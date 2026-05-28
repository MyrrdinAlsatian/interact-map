import { observabilityRepository } from '#repositories/observability_repository'
import { hasRequiredRole } from '#infrastructure/middleware/auth_middleware'

/**
 * MetricsController — exposes core service metrics.
 *
 * GET /observability/metrics
 * Auth required (middleware). Security role or higher required.
 *
 * Returns: CoreMetrics snapshot { request_latency_ms, fragment_error_count, parse_error_count }
 */
export default class MetricsController {
  async index({ response, auth }: { response: any; auth: any }) {
    if (!hasRequiredRole(auth?.user?.role, 'security')) {
      return response.forbidden({
        message: 'Insufficient role. Required: security or higher.',
      })
    }

    const metrics = observabilityRepository.getMetrics()
    return response.ok(metrics)
  }
}
