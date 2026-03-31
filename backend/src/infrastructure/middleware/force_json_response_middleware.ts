import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Updating the "Accept" header to always accept "application/json" response
 * from the server. This will force the internals of the framework like
 * validator errors or auth errors to return a JSON response.
 *
 * Note: only applied to routes that explicitly have no Accept header,
 * so Edge-rendered HTML pages (which reply with text/html) are not affected.
 */
export default class ForceJsonResponseMiddleware {
  async handle({ request }: HttpContext, next: NextFn) {
    const headers = request.headers()
    // Only force JSON when the client hasn't expressed a preference
    if (!headers.accept || headers.accept === '*/*') {
      headers.accept = 'application/json'
    }

    return next()
  }
}
