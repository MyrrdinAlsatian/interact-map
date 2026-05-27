import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

// import { ROLE_HIERARCHY } from '#infrastructure/adonis/kernel'
// import type { ActorRole } from '#domain/contracts/dto/graph_contract_dto'

export default class AuthMiddleware {
  redirectTo = '/'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo })
    return next()
  }
}

// /**
//  * Requires a valid authenticated user on the request context.
//  * Responds 401 if no user is present.
//  */
// export async function authMiddleware(ctx: any, next: () => Promise<void>) {
//   if (!ctx.auth?.user) {
//     return ctx.response.unauthorized({ message: 'Authentication required' })
//   }
//   await next()
// }

// /**
//  * Factory that creates a named middleware enforcing a minimum role level.
//  * Usage in routes: .use(requireRole('security'))
//  *
//  * Responds 401 if not authenticated, 403 if authenticated but insufficient role.
//  */
// export function requireRole(minimumRole: ActorRole) {
//   return async function roleGuardMiddleware(ctx: any, next: () => Promise<void>) {
//     if (!ctx.auth?.user) {
//       return ctx.response.unauthorized({ message: 'Authentication required' })
//     }

//     const userRole: string = ctx.auth.user.role ?? 'viewer'
//     const userLevel = ROLE_HIERARCHY[userRole] ?? -1
//     const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 999

//     if (userLevel < requiredLevel) {
//       return ctx.response.forbidden({
//         message: `Role "${userRole}" does not have permission. Required: "${minimumRole}" or higher.`,
//       })
//     }

//     await next()
//   }
// }
