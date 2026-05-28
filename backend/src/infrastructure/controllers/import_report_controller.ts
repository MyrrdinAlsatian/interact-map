import { observabilityRepository } from '#repositories/observability_repository'
import { loadLatestImportReport } from '#infrastructure/services/graph_store_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class ImportReportController {
  async show({ view, response }: HttpContext & { view: any }) {
    const start = Date.now()
    const report = await loadLatestImportReport()
    const html = await view.render('imports/show', {
      pageTitle: 'Latest Import Diff',
      report,
    })

    observabilityRepository.recordLatency(Date.now() - start)
    response.header('Content-Type', 'text/html; charset=utf-8')
    return response.ok(html)
  }
}
