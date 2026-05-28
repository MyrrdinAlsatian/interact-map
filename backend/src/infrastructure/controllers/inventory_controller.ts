import { observabilityRepository } from '#repositories/observability_repository'
import {
  getInventoryViewModel,
  type InventoryCategory,
} from '#infrastructure/services/inventory_data_service'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * InventoryController — serves server-rendered inventory pages.
 *
 * Each action records request latency and renders an Edge template.
 * When Unpoly sends an X-Up-Target header, AdonisJS will respond with
 * only the targeted fragment; without Unpoly the full layout is returned.
 */
export default class InventoryController {
  private async renderCategory(
    category: InventoryCategory,
    template: string,
    { view, response }: { view: any; response: HttpContext['response'] }
  ) {
    const start = Date.now()
    const model = await getInventoryViewModel(category)
    const html = await view.render(template, model)

    observabilityRepository.recordLatency(Date.now() - start)
    response.header('Content-Type', 'text/html; charset=utf-8')
    return response.ok(html)
  }

  async applications({ view, response }: HttpContext & { view: any }) {
    return this.renderCategory('applications', 'applications/index', { view, response })
  }

  async services({ view, response }: HttpContext & { view: any }) {
    return this.renderCategory('services', 'services/index', { view, response })
  }

  async servers({ view, response }: HttpContext & { view: any }) {
    return this.renderCategory('servers', 'servers/index', { view, response })
  }

  async containers({ view, response }: HttpContext & { view: any }) {
    return this.renderCategory('containers', 'containers/index', { view, response })
  }

  async interactions({ view, response }: HttpContext & { view: any }) {
    return this.renderCategory('interactions', 'interactions/index', { view, response })
  }
}
