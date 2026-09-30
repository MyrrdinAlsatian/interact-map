import { randomUUID } from 'node:crypto'
import db from '@adonisjs/lucid/services/db'
import type {
  ObservabilityRepository,
  CoreMetrics,
  AuditLogEntry,
  AuditEventInput,
} from '#domain/contracts/repositories/observability_repository'

interface AuditLogRow {
  id: string
  actor_id: string
  actor_role: string
  action: string
  resource_type: string
  resource_id: string
  timestamp: string
  outcome: string
  metadata: string | null
}

function toAuditLogEntry(row: AuditLogRow): AuditLogEntry {
  let metadata: Record<string, unknown> | undefined
  if (row.metadata) {
    try {
      const parsed: unknown = JSON.parse(row.metadata)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        metadata = parsed as Record<string, unknown>
      }
    } catch {
      metadata = undefined
    }
  }

  return {
    id: row.id,
    actorId: row.actor_id,
    actorRole: row.actor_role as AuditLogEntry['actorRole'],
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    timestamp: row.timestamp,
    outcome: row.outcome as AuditLogEntry['outcome'],
    ...(metadata ? { metadata } : {}),
  }
}

export class SqliteObservabilityRepository implements ObservabilityRepository {
  private latencySamples: number[] = []
  private fragmentErrors = 0
  private parseErrors = 0

  recordLatency(ms: number): void {
    this.latencySamples.push(ms)
  }

  incrementFragmentError(): void {
    this.fragmentErrors += 1
  }

  incrementParseError(): void {
    this.parseErrors += 1
  }

  getMetrics(): CoreMetrics {
    const avg =
      this.latencySamples.length > 0
        ? Math.round(
            this.latencySamples.reduce((sum, v) => sum + v, 0) / this.latencySamples.length
          )
        : 0
    return {
      request_latency_ms: avg,
      fragment_error_count: this.fragmentErrors,
      parse_error_count: this.parseErrors,
    }
  }

  async appendAuditLog(event: AuditEventInput): Promise<AuditLogEntry> {
    const entry: AuditLogEntry = {
      id: randomUUID(),
      ...event,
      timestamp: new Date().toISOString(),
    }
    await db.table('audit_logs').insert({
      id: entry.id,
      actor_id: entry.actorId,
      actor_role: entry.actorRole,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      timestamp: entry.timestamp,
      outcome: entry.outcome,
      metadata: entry.metadata === undefined ? null : JSON.stringify(entry.metadata),
    })
    return entry
  }

  async queryAuditLogs(): Promise<AuditLogEntry[]> {
    const rows = (await db
      .from('audit_logs')
      .select('*')
      .orderBy('timestamp', 'asc')
      .orderBy('id', 'asc')) as AuditLogRow[]
    return rows.map(toAuditLogEntry)
  }
}

// Metrics remain process-local; audit entries are persisted in Lucid.
export const observabilityRepository: ObservabilityRepository = new SqliteObservabilityRepository()
