import { observabilityRepository } from '#repositories/observability_repository.js'

/**
 * MetricsController — exposes core service metrics.
 *
 * GET /observability/metrics
 * Auth required (middleware). No role restriction — all authenticated users may read metrics.
 *
 * Returns: CoreMetrics snapshot { request_latency_ms, fragment_error_count, parse_error_count }
 */
export default class MetricsController {
  async index({ response }: { response: any }) {
    const metrics = observabilityRepository.getMetrics()
    return response.ok(metrics)
  }
}
