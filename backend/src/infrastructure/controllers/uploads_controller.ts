import { observabilityRepository } from '#repositories/observability_repository'
import { parseUploadedInfrastructureData } from '#infrastructure/services/upload_parser_service'
import { ValidateContractVersionUseCase } from '#domain/usecases/validate_contract_version_usecase'
import { ValidateGraphContractUseCase } from '#domain/usecases/validate_graph_contract_usecase'
import { ImportParserResultUseCase } from '#domain/usecases/import_parser_result_usecase'
import { ValidateParserResultUseCase } from '#domain/usecases/validate_parser_result_usecase'
import {
  createImportReport,
  loadCurrentGraphContract,
  persistCurrentGraphContract,
  persistLatestImportReport,
} from '#infrastructure/services/graph_store_service'
import { readFile } from 'node:fs/promises'

const validateParserResult = new ValidateParserResultUseCase()
const importParserResult = new ImportParserResultUseCase(
  new ValidateContractVersionUseCase(),
  new ValidateGraphContractUseCase()
)

export default class UploadsController {
  async store({ request, response, auth }: { request: any; response: any; auth?: any }) {
    const actorId = auth?.user?.id ?? 'anonymous'
    const actorRole = auth?.user?.role ?? 'viewer'

    const start = Date.now()
    const body = request.all() as {
      sourceType?: string
      payload?: string
      schemaVersion?: string
    }

    const uploadFile = request.file?.('file')
    let content = body.payload
    let fileName: string | undefined

    if (uploadFile?.tmpPath) {
      content = await readFile(uploadFile.tmpPath, 'utf-8')
      fileName = uploadFile.clientName
    }

    if (!content || typeof content !== 'string') {
      return response.status(422).json({
        error: {
          code: 'UPLOAD_CONTENT_MISSING',
          message: 'Provide payload text or multipart file field "file".',
          severity: 'error',
        },
      })
    }

    const parserResult = parseUploadedInfrastructureData({
      content,
      sourceType: body.sourceType,
      fileName,
      schemaVersion: body.schemaVersion ?? '1.0',
    })

    const validation = validateParserResult.execute(parserResult)
    if (!validation.valid) {
      observabilityRepository.incrementParseError()
      observabilityRepository.appendAuditLog({
        actorId,
        actorRole,
        action: 'uploads.store',
        resourceType: 'Upload',
        resourceId: fileName ?? 'inline-payload',
        outcome: 'failure',
        metadata: { errorCount: validation.errors.length },
      })
      observabilityRepository.recordLatency(Date.now() - start)

      return response.status(422).json({
        error: {
          code: 'PARSER_RESULT_INVALID',
          message: `Upload parsing failed with ${validation.errors.length} error(s).`,
          severity: 'error',
        },
        validationErrors: validation.errors,
        warnings: validation.warnings,
      })
    }

    const base =
      (await loadCurrentGraphContract()) ?? {
        schemaVersion: '1.0',
        nodes: [],
        edges: [],
        errors: [],
      }

    const output = importParserResult.execute(parserResult, base)
    if (output.errors.length > 0) {
      observabilityRepository.incrementParseError()
      observabilityRepository.appendAuditLog({
        actorId,
        actorRole,
        action: 'uploads.store',
        resourceType: 'Upload',
        resourceId: fileName ?? 'inline-payload',
        outcome: 'failure',
        metadata: { errorCount: output.errors.length },
      })
      observabilityRepository.recordLatency(Date.now() - start)

      return response.status(422).json({
        error: {
          code: 'INGESTION_FAILED',
          message: `Upload ingestion failed with ${output.errors.length} error(s).`,
          severity: 'error',
        },
        validationErrors: output.errors,
        warnings: output.warnings,
      })
    }

    try {
      await persistCurrentGraphContract(output.merged)
      await persistLatestImportReport(
        createImportReport({
          base,
          incoming: { nodes: parserResult.nodes, edges: parserResult.edges },
          merged: output.merged,
          sourceType: body.sourceType ?? fileName ?? 'auto-detect',
          fileName,
        })
      )
    } catch {
      observabilityRepository.appendAuditLog({
        actorId,
        actorRole,
        action: 'uploads.store',
        resourceType: 'Upload',
        resourceId: fileName ?? 'inline-payload',
        outcome: 'failure',
      })
      observabilityRepository.recordLatency(Date.now() - start)

      return response.status(500).json({
        error: {
          code: 'GRAPH_PERSIST_FAILED',
          message: 'Upload parsed and merged, but persistence to JSON failed.',
          severity: 'error',
        },
        merged: output.merged,
      })
    }

    observabilityRepository.appendAuditLog({
      actorId,
      actorRole,
      action: 'uploads.store',
      resourceType: 'Upload',
      resourceId: fileName ?? 'inline-payload',
      outcome: 'success',
      metadata: {
        nodeCount: output.merged.nodes.length,
        edgeCount: output.merged.edges.length,
        sourceType: body.sourceType ?? 'auto-detect',
      },
    })
    observabilityRepository.recordLatency(Date.now() - start)

    return response.ok({
      status: 'uploaded',
      message: 'Upload parsed and merged into current graph',
      parserResult,
      merged: output.merged,
      warnings: output.warnings,
    })
  }
}
