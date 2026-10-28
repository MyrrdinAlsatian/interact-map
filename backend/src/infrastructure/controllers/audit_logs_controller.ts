import { observabilityRepository } from '#repositories/observability_repository'

/**
 * AuditLogsController — read-only access to audit log entries.
 *
 * GET /audit/logs
 * Auth required + admin role (enforceable via requireRole('admin') in routes or inline check).
 *
 * Returns: AuditLogEntry[] (append-only; newest-first)
 */
export default class AuditLogsController {
  async index({ response }: { response: any }) {
    const entries = await observabilityRepository.queryAuditLogs()
    return response.ok(entries.toReversed())
  }
}
