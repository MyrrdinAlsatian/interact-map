import { observabilityRepository } from '#repositories/observability_repository'
import { getDashboardViewModel } from '#infrastructure/services/inventory_data_service'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * DashboardController — displays system overview and monitoring dashboard.
 *
 * This is the main landing page showing real-time infrastructure stats,
 * system health, and recent activity.
 */
export default class DashboardController {
  async index({ view, response }: HttpContext & { view: any }) {
    const start = Date.now()
    const model = await getDashboardViewModel()
    const html = await view.render('dashboard/index', model)
    observabilityRepository.recordLatency(Date.now() - start)
    response.header('Content-Type', 'text/html; charset=utf-8')
    return response.ok(html)
  }
}
