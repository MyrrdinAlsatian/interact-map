import type { GraphContract } from '#domain/contracts/dto/graph_contract_dto'
import { ValidateGraphContractUseCase } from '#domain/usecases/validate_graph_contract_usecase'
import { observabilityRepository } from '#repositories/observability_repository'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const validateContract = new ValidateGraphContractUseCase()

/**
 * GraphController — serves the graph page and handles contract validation.
 *
 * GET /graph — renders server-rendered shell with sample graph contract injected as JSON.
 * POST /graph/contract/validate — validates a submitted GraphContract payload.
 */
export default class GraphController {
  async index({ view, response }: { view: any; response: any }) {
    const start = Date.now()

    // Load sample graph contract for initial page render
    let sampleContract: GraphContract | null = null
    try {
      const datasetPath = resolve(process.cwd(), '../examples/project-dataset.json')
      const raw = await readFile(datasetPath, 'utf-8')
      const dataset = JSON.parse(raw) as { graph: GraphContract }
      sampleContract = {
        schemaVersion: '1.0',
        nodes: dataset.graph.nodes,
        edges: dataset.graph.edges,
        errors: [],
      }
    } catch {
      // Sample data not required — page renders without pre-loaded contract
    }

    const html = await view.render('graph/index', {
      pageTitle: 'Architecture Graph',
      initialContract: sampleContract ? JSON.stringify(sampleContract) : null,
    })

    observabilityRepository.recordLatency(Date.now() - start)
    return response.ok(html).header('Content-Type', 'text/html; charset=utf-8')
  }

  async validate({ request, response, auth }: { request: any; response: any; auth: any }) {
    const start = Date.now()
    const payload = request.all()

    const result = validateContract.execute(payload)

    if (!result.valid) {
      observabilityRepository.appendAuditLog({
        actorId: auth?.user?.id ?? 'anonymous',
        actorRole: auth?.user?.role ?? 'viewer',
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
      actorId: auth?.user?.id ?? 'anonymous',
      actorRole: auth?.user?.role ?? 'viewer',
      action: 'graph.contract.validate',
      resourceType: 'GraphContract',
      resourceId: String(payload['schemaVersion'] ?? 'unknown'),
      outcome: 'success',
    })
    observabilityRepository.recordLatency(Date.now() - start)
    return response.ok({ valid: true, errors: [] })
  }
}
