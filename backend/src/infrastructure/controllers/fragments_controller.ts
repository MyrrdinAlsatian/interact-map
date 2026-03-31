import { observabilityRepository } from '#repositories/observability_repository'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * FragmentsController — resolves named server-rendered fragments for Unpoly requests.
 *
 * Supported targets are rendered as partial HTML without the full layout wrapper.
 * Unknown targets return 422 with an ErrorEnvelope and fallbackNavigation: full_page
 * so Unpoly (or the client) can fall back to a full-page navigation.
 *
 * Contract: GET /fragments/:target
 */

const SUPPORTED_TARGETS = [
  'inventory-applications',
  'inventory-services',
  'inventory-servers',
  'inventory-containers',
  'inventory-interactions',
  'graph-summary',
] as const

type SupportedTarget = (typeof SUPPORTED_TARGETS)[number]

function isSupportedTarget(target: string): target is SupportedTarget {
  return (SUPPORTED_TARGETS as readonly string[]).includes(target)
}

export default class FragmentsController {
  async resolve({ params, view, response }: HttpContext & { params: any; view: any }) {
    const target: string = params.target

    if (!isSupportedTarget(target)) {
      observabilityRepository.incrementFragmentError()
      return response.status(422).json({
        error: {
          code: 'FRAGMENT_NOT_FOUND',
          message: `Fragment target "${target}" does not exist.`,
          path: `fragments/${target}`,
          severity: 'error',
        },
        fallbackNavigation: 'full_page',
      })
    }

    const start = Date.now()
    try {
      const html = await view.render(`partials/${target.replace(/-/g, '_')}`, { target })
      observabilityRepository.recordLatency(Date.now() - start)
      response.header('Content-Type', 'text/html; charset=utf-8')
      return response.ok(html)
    } catch {
      observabilityRepository.incrementFragmentError()
      return response.status(422).json({
        error: {
          code: 'FRAGMENT_RENDER_ERROR',
          message: `Fragment target "${target}" could not be rendered.`,
          path: `fragments/${target}`,
          severity: 'error',
        },
        fallbackNavigation: 'full_page',
      })
    }
  }
}
