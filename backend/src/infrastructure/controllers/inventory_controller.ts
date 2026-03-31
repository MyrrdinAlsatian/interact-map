import { observabilityRepository } from '#repositories/observability_repository'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * InventoryController — serves server-rendered inventory pages.
 *
 * Each action records request latency and renders an Edge template.
 * When Unpoly sends an X-Up-Target header, AdonisJS will respond with
 * only the targeted fragment; without Unpoly the full layout is returned.
 */
export default class InventoryController {
  async applications({ view, response }: HttpContext & { view: any }) {
    const start = Date.now()
    const html = await view.render('applications/index', {
      pageTitle: 'Applications',
      items: [
        { id: 'sample-app-1', label: 'Web Frontend', type: 'application' },
        { id: 'sample-app-2', label: 'Orders API', type: 'application' },
      ],
    })
    observabilityRepository.recordLatency(Date.now() - start)
    response.header('Content-Type', 'text/html; charset=utf-8')
    return response.ok(html)
  }

  async services({ view, response }: HttpContext & { view: any }) {
    const start = Date.now()
    const html = await view.render('services/index', {
      pageTitle: 'Services',
      items: [
        { id: 'svc-postgres', label: 'PostgreSQL', type: 'service' },
        { id: 'svc-redis', label: 'Redis', type: 'service' },
      ],
    })
    observabilityRepository.recordLatency(Date.now() - start)
    response.header('Content-Type', 'text/html; charset=utf-8')
    return response.ok(html)
  }

  async servers({ view, response }: HttpContext & { view: any }) {
    const start = Date.now()
    const html = await view.render('servers/index', {
      pageTitle: 'Servers',
      items: [{ id: 'srv-prod-1', label: 'prod-vm-01', type: 'server' }],
    })
    observabilityRepository.recordLatency(Date.now() - start)
    response.header('Content-Type', 'text/html; charset=utf-8')
    return response.ok(html)
  }

  async containers({ view, response }: HttpContext & { view: any }) {
    const start = Date.now()
    const html = await view.render('containers/index', {
      pageTitle: 'Containers',
      items: [{ id: 'ctr-orders', label: 'orders-api', type: 'container' }],
    })
    observabilityRepository.recordLatency(Date.now() - start)
    response.header('Content-Type', 'text/html; charset=utf-8')
    return response.ok(html)
  }

  async interactions({ view, response }: HttpContext & { view: any }) {
    const start = Date.now()
    const html = await view.render('interactions/index', {
      pageTitle: 'Interactions',
      items: [],
    })
    observabilityRepository.recordLatency(Date.now() - start)
    response.header('Content-Type', 'text/html; charset=utf-8')
    return response.ok(html)
  }
}
