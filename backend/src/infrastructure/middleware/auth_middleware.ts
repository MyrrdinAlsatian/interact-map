import { ROLE_HIERARCHY } from '#infrastructure/adonis/kernel.js'
import type { ActorRole } from '#domain/contracts/dto/graph_contract_dto.js'

/**
 * Requires a valid authenticated user on the request context.
 * Responds 401 if no user is present.
 */
export default async function authMiddleware(ctx: any, next: () => Promise<void>) {
  if (!ctx.auth?.user) {
    return ctx.response.unauthorized({ message: 'Authentication required' })
  }
  await next()
}

/**
 * Factory that creates a named middleware enforcing a minimum role level.
 * Usage in routes: .use(requireRole('analyst'))
 *
 * Responds 401 if not authenticated, 403 if authenticated but insufficient role.
 */
export function requireRole(minimumRole: ActorRole) {
  return async function roleGuardMiddleware(ctx: any, next: () => Promise<void>) {
    if (!ctx.auth?.user) {
      return ctx.response.unauthorized({ message: 'Authentication required' })
    }

    const userRole: string = ctx.auth.user.role ?? 'viewer'
    const userLevel = ROLE_HIERARCHY[userRole] ?? -1
    const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 999

    if (userLevel < requiredLevel) {
      return ctx.response.forbidden({
        message: `Role "${userRole}" does not have permission. Required: "${minimumRole}" or higher.`,
      })
    }

    await next()
  }
}

