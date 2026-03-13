import { randomUUID } from 'node:crypto'
import type {
  ObservabilityRepository,
  CoreMetrics,
  AuditLogEntry,
  AuditEventInput,
} from '#domain/contracts/repositories/observability_repository'

class InMemoryObservabilityRepository implements ObservabilityRepository {
  private latencySamples: number[] = []
  private fragmentErrors = 0
  private parseErrors = 0
  private auditLog: AuditLogEntry[] = []

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
        ? Math.round(this.latencySamples.reduce((sum, v) => sum + v, 0) / this.latencySamples.length)
        : 0
    return {
      request_latency_ms: avg,
      fragment_error_count: this.fragmentErrors,
      parse_error_count: this.parseErrors,
    }
  }

  appendAuditLog(event: AuditEventInput): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: randomUUID(),
      ...event,
      timestamp: new Date().toISOString(),
    }
    this.auditLog.push(entry)
    return entry
  }

  queryAuditLogs(): AuditLogEntry[] {
    return [...this.auditLog]
  }
}

// Module-level singleton so metrics/audit data persists for the process lifetime.
export const observabilityRepository: ObservabilityRepository = new InMemoryObservabilityRepository()
