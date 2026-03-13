import type { ActorRole, AuditOutcome } from '#domain/contracts/dto/graph_contract_dto.js'

export interface CoreMetrics {
  request_latency_ms: number
  fragment_error_count: number
  parse_error_count: number
}

export interface AuditLogEntry {
  id: string
  actorId: string
  actorRole: ActorRole
  action: string
  resourceType: string
  resourceId: string
  timestamp: string
  outcome: AuditOutcome
  metadata?: Record<string, unknown>
}

export interface AuditEventInput {
  actorId: string
  actorRole: ActorRole
  action: string
  resourceType: string
  resourceId: string
  outcome: AuditOutcome
  metadata?: Record<string, unknown>
}

export interface ObservabilityRepository {
  recordLatency(ms: number): void
  incrementFragmentError(): void
  incrementParseError(): void
  getMetrics(): CoreMetrics
  appendAuditLog(event: AuditEventInput): AuditLogEntry
  queryAuditLogs(): AuditLogEntry[]
}
