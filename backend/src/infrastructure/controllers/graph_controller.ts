import type { GraphContract } from '#domain/contracts/dto/graph_contract_dto'
import { ValidateGraphContractUseCase } from '#domain/usecases/validate_graph_contract_usecase'
import { observabilityRepository } from '#repositories/observability_repository'
import { loadCurrentGraphContract } from '#infrastructure/services/graph_store_service'
import { getGraphSummaryViewModel } from '#infrastructure/services/inventory_data_service'
import type { HttpContext } from '@adonisjs/core/http'

const validateContract = new ValidateGraphContractUseCase()

/**
 * GraphController — serves the graph page and handles contract validation.
 *
 * GET /graph — renders server-rendered shell with sample graph contract injected as JSON.
 * POST /graph/contract/validate — validates a submitted GraphContract payload.
 */
export default class GraphController {
  async index({ view, response }: HttpContext & { view: any }) {
    const start = Date.now()

    const sampleContract: GraphContract | null = await loadCurrentGraphContract()

    const summary = await getGraphSummaryViewModel()

    const html = await view.render('graph/index', {
      pageTitle: 'Architecture Graph',
      initialContract: sampleContract ? JSON.stringify(sampleContract) : null,
      summary,
    })

    observabilityRepository.recordLatency(Date.now() - start)
    response.header('Content-Type', 'text/html; charset=utf-8')
    return response.ok(html)
  }

  async validate({ request, response, auth }: HttpContext & { auth: any }) {
    const start = Date.now()
    const payload = request.all()

    const result = validateContract.execute(payload)

    if (!result.valid) {
      observabilityRepository.appendAuditLog({
        actorId: String(auth?.user?.id ?? 'anonymous'),
        actorRole: 'viewer',
        action: 'graph.contract.validate',
        resourceType: 'GraphContract',
        resourceId: 'submitted',
        outcome: 'failure',
        metadata: { errorCount: result.errors.length },
      })
      observabilityRepository.recordLatency(Date.now() - start)
      return response.status(422).json({
        error: {
          code: 'CONTRACT_INVALID',
          message: `Contract validation failed with ${result.errors.length} error(s).`,
          severity: 'error',
        },
        validationErrors: result.errors,
      })
    }

    observabilityRepository.appendAuditLog({
      actorId: String(auth?.user?.id ?? 'anonymous'),
      actorRole: 'viewer',
      action: 'graph.contract.validate',
      resourceType: 'GraphContract',
      resourceId: String(payload['schemaVersion'] ?? 'unknown'),
      outcome: 'success',
    })
    observabilityRepository.recordLatency(Date.now() - start)
    return response.ok({ valid: true, errors: [] })
  }
}
