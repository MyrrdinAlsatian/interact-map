import { ImportParserResultUseCase } from '#domain/usecases/import_parser_result_usecase.js'
import { observabilityRepository } from '#repositories/observability_repository.js'
import type { ParserResult } from '#domain/contracts/dto/parser_contract_dto.js'
import type { GraphContract } from '#domain/contracts/dto/graph_contract_dto.js'

const importParserResult = new ImportParserResultUseCase()

/**
 * ParserController — accepts a ParserResult payload and merges it into the project graph.
 *
 * POST /parser/ingest
 * Required body: { parserResult: ParserResult, base?: GraphContract }
 * Required role: analyst or higher (enforced by requireRole middleware in routes.ts)
 *
 * Returns: merged GraphContract or structured errors.
 */
export default class ParserController {
  async ingest({ request, response, auth }: { request: any; response: any; auth: any }) {
    const start = Date.now()
    const body = request.all() as { parserResult: ParserResult; base?: GraphContract }

    const parserResult = body.parserResult
    const base = body.base ?? {
      schemaVersion: '1.0',
      nodes: [],
      edges: [],
      errors: [],
    }

    if (!parserResult || typeof parserResult !== 'object') {
      return response.status(422).json({
        error: {
          code: 'PARSER_RESULT_MISSING',
          message: 'parserResult is required in the request body.',
          severity: 'error',
        },
      })
    }

    const output = importParserResult.execute(parserResult, base)

    if (output.errors.length > 0) {
      observabilityRepository.incrementParseError()
      observabilityRepository.appendAuditLog({
        actorId: auth?.user?.id ?? 'anonymous',
        actorRole: auth?.user?.role ?? 'analyst',
        action: 'parser.ingest',
        resourceType: 'ParserResult',
        resourceId: String(parserResult.schemaVersion ?? 'unknown'),
        outcome: 'failure',
        metadata: { errorCount: output.errors.length },
      })
      observabilityRepository.recordLatency(Date.now() - start)

      return response.status(422).json({
        error: {
          code: 'INGESTION_FAILED',
          message: `Parser result ingestion failed with ${output.errors.length} error(s).`,
          severity: 'error',
        },
        validationErrors: output.errors,
        warnings: output.warnings,
      })
    }

    observabilityRepository.appendAuditLog({
      actorId: auth?.user?.id ?? 'anonymous',
      actorRole: auth?.user?.role ?? 'analyst',
      action: 'parser.ingest',
      resourceType: 'ParserResult',
      resourceId: String(parserResult.schemaVersion ?? 'unknown'),
      outcome: 'success',
      metadata: {
        nodeCount: output.merged.nodes.length,
        edgeCount: output.merged.edges.length,
        warnings: output.warnings.length,
      },
    })
    observabilityRepository.recordLatency(Date.now() - start)

    return response.ok({
      merged: output.merged,
      warnings: output.warnings,
    })
  }
}
