import { observabilityRepository } from '#repositories/observability_repository'
import { hasRequiredRole } from '#infrastructure/middleware/auth_middleware'

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
    if (!hasRequiredRole(auth?.user?.role, 'security')) {
      return response.forbidden({
        message: 'Insufficient role. Required: security or higher.',
      })
    }

    const entries = observabilityRepository.queryAuditLogs()
    return response.ok([...entries].reverse())
  }
}
