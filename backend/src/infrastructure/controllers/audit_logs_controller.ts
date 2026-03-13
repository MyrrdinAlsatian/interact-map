import { observabilityRepository } from '#repositories/observability_repository'
import { ROLE_HIERARCHY } from '#infrastructure/adonis/kernel'

/**
 * AuditLogsController — read-only access to audit log entries.
 *
 * GET /audit/logs
 * Auth required + admin role (enforceable via requireRole('admin') in routes or inline check).
 *
 * Returns: AuditLogEntry[] (append-only; newest-first)
 */
export default class AuditLogsController {
  async index({ response, auth }: { response: any; auth: any }) {
    // Inline role check for admin — belt-and-suspenders beyond requireRole middleware
    const userRole: string = auth?.user?.role ?? 'viewer'
    const userLevel = ROLE_HIERARCHY[userRole] ?? -1
    const adminLevel = ROLE_HIERARCHY['admin'] ?? 3

    if (userLevel < adminLevel) {
      return response.forbidden({
        message: `Role "${userRole}" does not have permission to view audit logs. Required: "admin".`,
      })
    }

    const entries = observabilityRepository.queryAuditLogs()
    return response.ok([...entries].reverse())
  }
}
