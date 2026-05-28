import {
  ImportParserResultUseCase,
  type MergeStrategy,
} from '#domain/usecases/import_parser_result_usecase'
import { ValidateParserResultUseCase } from '../../domain/usecases/validate_parser_result_usecase.js'
import { ValidateContractVersionUseCase } from '#domain/usecases/validate_contract_version_usecase'
import { ValidateGraphContractUseCase } from '#domain/usecases/validate_graph_contract_usecase'
import { observabilityRepository } from '#repositories/observability_repository'
import {
  createImportReport,
  loadCurrentGraphContract,
  persistCurrentGraphContract,
  persistLatestImportReport,
} from '#infrastructure/services/graph_store_service'
import type { ParserResult } from '#domain/contracts/dto/parser_contract_dto'
import type { GraphContract } from '#domain/contracts/dto/graph_contract_dto'

const validateParserResult = new ValidateParserResultUseCase()
const importParserResult = new ImportParserResultUseCase(
  new ValidateContractVersionUseCase(),
  new ValidateGraphContractUseCase()
)
const ALLOWED_MERGE_STRATEGIES: MergeStrategy[] = ['skip', 'update', 'archive-missing']

/**
 * ParserController — accepts a ParserResult payload and merges it into the project graph.
 *
 * POST /parser/ingest
 * Required body: { parserResult: ParserResult, base?: GraphContract }
 * Required role: security or higher (enforced by requireRole middleware in routes.ts)
 *
 * Returns: merged GraphContract or structured errors.
 */
export default class ParserController {
  async ingest({ request, response, auth }: { request: any; response: any; auth: any }) {
    const start = Date.now()
    const body = request.all() as {
      parserResult: ParserResult
      base?: GraphContract
      mergeStrategy?: MergeStrategy
      dryRun?: boolean | string
    }

    const parserResult = body.parserResult
    const mergeStrategy = (body.mergeStrategy ?? 'skip') as MergeStrategy
    const dryRun =
      body.dryRun === true ||
      body.dryRun === 'true' ||
      body.dryRun === 'on' ||
      body.dryRun === '1'

    if (!ALLOWED_MERGE_STRATEGIES.includes(mergeStrategy)) {
      return response.status(422).json({
        error: {
          code: 'MERGE_STRATEGY_INVALID',
          message: `mergeStrategy must be one of: ${ALLOWED_MERGE_STRATEGIES.join(', ')}`,
          severity: 'error',
        },
      })
    }

    const storedGraph = await loadCurrentGraphContract()
    const base = body.base ?? storedGraph ?? {
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

    const validation = validateParserResult.execute(parserResult)
    if (!validation.valid) {
      observabilityRepository.incrementParseError()
      observabilityRepository.appendAuditLog({
        actorId: auth?.user?.id ?? 'anonymous',
        actorRole: auth?.user?.role ?? 'security',
        action: 'parser.validate',
        resourceType: 'ParserResult',
        resourceId: String(parserResult.schemaVersion ?? 'unknown'),
        outcome: 'failure',
        metadata: { errorCount: validation.errors.length },
      })
      observabilityRepository.recordLatency(Date.now() - start)

      return response.status(422).json({
        error: {
          code: 'PARSER_RESULT_INVALID',
          message: `ParserResult validation failed with ${validation.errors.length} error(s).`,
          severity: 'error',
        },
        validationErrors: validation.errors,
        warnings: validation.warnings,
      })
    }

    const output = importParserResult.execute(parserResult, base, { mergeStrategy })

    if (output.errors.length > 0) {
      observabilityRepository.incrementParseError()
      observabilityRepository.appendAuditLog({
        actorId: auth?.user?.id ?? 'anonymous',
        actorRole: auth?.user?.role ?? 'security',
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
      actorRole: auth?.user?.role ?? 'security',
      action: dryRun ? 'parser.preview' : 'parser.ingest',
      resourceType: 'ParserResult',
      resourceId: String(parserResult.schemaVersion ?? 'unknown'),
      outcome: 'success',
      metadata: {
        nodeCount: output.merged.nodes.length,
        edgeCount: output.merged.edges.length,
        warnings: output.warnings.length,
        mergeStrategy,
        dryRun,
      },
    })

    const previewReport = createImportReport({
      base,
      incoming: { nodes: parserResult.nodes, edges: parserResult.edges },
      merged: output.merged,
      sourceType: 'parser.ingest',
      mergeStrategy,
    })

    if (!dryRun) {
      try {
        await persistCurrentGraphContract(output.merged)
        await persistLatestImportReport(previewReport)
      } catch {
        observabilityRepository.appendAuditLog({
          actorId: auth?.user?.id ?? 'anonymous',
          actorRole: auth?.user?.role ?? 'security',
          action: 'parser.persist',
          resourceType: 'GraphContract',
          resourceId: String(parserResult.schemaVersion ?? 'unknown'),
          outcome: 'failure',
        })
        observabilityRepository.recordLatency(Date.now() - start)

        return response.status(500).json({
          error: {
            code: 'GRAPH_PERSIST_FAILED',
            message: 'Parser result merged but could not be persisted to JSON storage.',
            severity: 'error',
          },
          merged: output.merged,
        })
      }
    }

    observabilityRepository.recordLatency(Date.now() - start)

    return response.ok({
      merged: output.merged,
      mergeStrategy,
      dryRun,
      persisted: !dryRun,
      previewReport,
      warnings: output.warnings,
    })
  }
}
