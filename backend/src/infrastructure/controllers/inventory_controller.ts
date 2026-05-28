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
    { view, response, request }: { view: any; response: HttpContext['response']; request: HttpContext['request'] }
  ) {
    const start = Date.now()
    const query = String(request.input('q') ?? '')
    const model = await getInventoryViewModel(category, query)
    const html = await view.render(template, model)

    observabilityRepository.recordLatency(Date.now() - start)
    response.header('Content-Type', 'text/html; charset=utf-8')
    return response.ok(html)
  }

  async applications({ view, response, request }: HttpContext & { view: any }) {
    return this.renderCategory('applications', 'applications/index', { view, response, request })
  }

  async services({ view, response, request }: HttpContext & { view: any }) {
    return this.renderCategory('services', 'services/index', { view, response, request })
  }

  async servers({ view, response, request }: HttpContext & { view: any }) {
    return this.renderCategory('servers', 'servers/index', { view, response, request })
  }

  async containers({ view, response, request }: HttpContext & { view: any }) {
    return this.renderCategory('containers', 'containers/index', { view, response, request })
  }

  async interactions({ view, response, request }: HttpContext & { view: any }) {
    return this.renderCategory('interactions', 'interactions/index', { view, response, request })
  }
}
