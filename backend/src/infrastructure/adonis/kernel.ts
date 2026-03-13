/**
 * Global middleware stack applied to all HTTP requests in order.
 *
 * force_json_response_middleware — sets Content-Type: application/json (overridden for HTML fragments)
 * container_bindings_middleware  — resolves DI bindings into the request context
 *
 * Named (per-route) middleware is registered separately in routes.ts:
 *   auth        — requires valid authenticated user (Bearer JWT)
 *   requireRole — requires authenticated user with minimum role level
 */
export const middlewareStack = [
  'force_json_response_middleware',
  'container_bindings_middleware',
]

/**
 * Role hierarchy: viewer < analyst < architect < admin
 * requireRole('analyst') means analyst, architect, and admin may proceed.
 */
export const ROLE_HIERARCHY: Record<string, number> = {
  viewer: 0,
  analyst: 1,
  architect: 2,
  admin: 3,
}

