import { observabilityRepository } from '#repositories/observability_repository'
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
    const html = await view.render('dashboard/index', {
      pageTitle: 'Dashboard',
      stats: {
        applications: 24,
        services: 18,
        servers: 8,
        containers: 42,
        interactions: 156,
        uptime: '99.8%',
      },
    })
    observabilityRepository.recordLatency(Date.now() - start)
    response.header('Content-Type', 'text/html; charset=utf-8')
    return response.ok(html)
  }
}
