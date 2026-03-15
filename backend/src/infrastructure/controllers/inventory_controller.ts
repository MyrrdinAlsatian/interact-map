import { observabilityRepository } from '#repositories/observability_repository'

/**
 * InventoryController — serves server-rendered inventory pages.
 *
 * Each action records request latency and renders an Edge template.
 * When Unpoly sends an X-Up-Target header, AdonisJS will respond with
 * only the targeted fragment; without Unpoly the full layout is returned.
 */
export default class InventoryController {
  async applications({ view, response }: { view: any; response: any }) {
    const start = Date.now()
    return {
      pageTitle: 'Applications',
      items: [
        { id: 'sample-app-1', label: 'Web Frontend', type: 'application' },
        { id: 'sample-app-2', label: 'Orders API', type: 'application' },
      ],
    }
    // const html = await view.render('applications/index', {
    //   pageTitle: 'Applications',
    //   items: [
    //     { id: 'sample-app-1', label: 'Web Frontend', type: 'application' },
    //     { id: 'sample-app-2', label: 'Orders API', type: 'application' },
    //   ],
    // })
    // observabilityRepository.recordLatency(Date.now() - start)
    // return response.ok(html).header('Content-Type', 'text/html; charset=utf-8')
  }

  async services({ view, response }: { view: any; response: any }) {
    const start = Date.now()
    const html = await view.render('services/index', {
      pageTitle: 'Services',
      items: [
        { id: 'svc-postgres', label: 'PostgreSQL', type: 'service' },
        { id: 'svc-redis', label: 'Redis', type: 'service' },
      ],
    })
    observabilityRepository.recordLatency(Date.now() - start)
    return response.ok(html).header('Content-Type', 'text/html; charset=utf-8')
  }

  async servers({ view, response }: { view: any; response: any }) {
    const start = Date.now()
    const html = await view.render('servers/index', {
      pageTitle: 'Servers',
      items: [{ id: 'srv-prod-1', label: 'prod-vm-01', type: 'server' }],
    })
    observabilityRepository.recordLatency(Date.now() - start)
    return response.ok(html).header('Content-Type', 'text/html; charset=utf-8')
  }

  async containers({ view, response }: { view: any; response: any }) {
    const start = Date.now()
    const html = await view.render('containers/index', {
      pageTitle: 'Containers',
      items: [{ id: 'ctr-orders', label: 'orders-api', type: 'container' }],
    })
    observabilityRepository.recordLatency(Date.now() - start)
    return response.ok(html).header('Content-Type', 'text/html; charset=utf-8')
  }

  async interactions({ view, response }: { view: any; response: any }) {
    const start = Date.now()
    const html = await view.render('interactions/index', {
      pageTitle: 'Interactions',
      items: [],
    })
    observabilityRepository.recordLatency(Date.now() - start)
    return response.ok(html).header('Content-Type', 'text/html; charset=utf-8')
  }
}
