import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { ActorRole } from '#domain/contracts/dto/graph_contract_dto'
import { observabilityRepository } from '#repositories/observability_repository'
import { hasRequiredRole, isDevelopmentAuthBypassEnabled } from '#infrastructure/middleware/auth_middleware'

export default class RoleMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: { minimumRole: ActorRole; action: string }
  ) {
    const startedAt = Date.now()
    const user = ctx.auth.user

    if (user && hasRequiredRole(user.role, options.minimumRole)) return next()
    if (!user && isDevelopmentAuthBypassEnabled()) return next()

    const developmentBypass = isDevelopmentAuthBypassEnabled()
    await observabilityRepository.appendAuditLog({
      actorId: user?.id ? String(user.id) : developmentBypass ? 'dev-user' : 'anonymous',
      actorRole: user?.role ?? (developmentBypass ? 'admin' : 'viewer'),
      action: options.action,
      resourceType: 'Route',
      resourceId: `${ctx.request.method()} ${ctx.request.url()}`,
      outcome: 'denied',
      metadata: { requiredRole: options.minimumRole },
    })
    observabilityRepository.recordLatency(Date.now() - startedAt)

    return ctx.response.forbidden({
      error: {
        code: 'ROLE_INSUFFICIENT',
        message: `This action requires the ${options.minimumRole} role or higher.`,
        severity: 'error',
      },
    })
  }
}
