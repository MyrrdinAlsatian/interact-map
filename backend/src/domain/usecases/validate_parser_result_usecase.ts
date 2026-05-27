import type { ParserResult } from '#domain/contracts/dto/parser_contract_dto'
import type { ContractError } from '#domain/contracts/dto/graph_contract_dto'
import { ValidateContractVersionUseCase } from '#domain/usecases/validate_contract_version_usecase'
import { ValidateGraphContractUseCase } from '#domain/usecases/validate_graph_contract_usecase'

export interface ParserResultValidationResult {
  valid: boolean
  errors: ContractError[]
  warnings: ContractError[]
}

function isContractDiagnostic(item: unknown): item is ContractError {
  return (
    !!item &&
    typeof item === 'object' &&
    typeof (item as Record<string, unknown>).code === 'string' &&
    typeof (item as Record<string, unknown>).message === 'string' &&
    typeof (item as Record<string, unknown>).severity === 'string'
  )
}

export class ValidateParserResultUseCase {
  private readonly versionValidator = new ValidateContractVersionUseCase()
  private readonly graphValidator = new ValidateGraphContractUseCase()

  execute(parserResult: unknown): ParserResultValidationResult {
    const errors: ContractError[] = []
    const warnings: ContractError[] = []

    if (!parserResult || typeof parserResult !== 'object') {
      return {
        valid: false,
        errors: [
          {
            code: 'PARSER_RESULT_INVALID',
            message: 'ParserResult must be a non-null object.',
            severity: 'error',
          },
        ],
        warnings,
      }
    }

    const payload = parserResult as Record<string, unknown>
    const schemaVersion = payload['schemaVersion'] as string
    const nodes = payload['nodes'] as unknown
    const edges = payload['edges'] as unknown
    const rawErrors = payload['errors'] as unknown
    const rawWarnings = payload['warnings'] as unknown

    if (!Array.isArray(nodes)) {
      errors.push({
        code: 'PARSER_RESULT_INVALID',
        message: 'ParserResult.nodes must be an array.',
        path: 'nodes',
        severity: 'error',
      })
    }

    if (!Array.isArray(edges)) {
      errors.push({
        code: 'PARSER_RESULT_INVALID',
        message: 'ParserResult.edges must be an array.',
        path: 'edges',
        severity: 'error',
      })
    }

    if (!Array.isArray(rawErrors)) {
      errors.push({
        code: 'PARSER_RESULT_INVALID',
        message: 'ParserResult.errors must be an array.',
        path: 'errors',
        severity: 'error',
      })
    }

    if (!Array.isArray(rawWarnings)) {
      errors.push({
        code: 'PARSER_RESULT_INVALID',
        message: 'ParserResult.warnings must be an array.',
        path: 'warnings',
        severity: 'error',
      })
    }

    if (errors.length > 0) {
      return { valid: false, errors, warnings }
    }

    const versionValidation = this.versionValidator.execute(schemaVersion)
    if (!versionValidation.valid) {
      errors.push(...versionValidation.errors)
    }

    const graphValidation = this.graphValidator.execute({
      schemaVersion,
      nodes,
      edges,
      errors: [],
    })

    if (!graphValidation.valid) {
      errors.push(...graphValidation.errors)
    }

    if (!errors.length) {
      const diagnostics = rawErrors as unknown[]
      for (const [index, errorEntry] of diagnostics.entries()) {
        if (!isContractDiagnostic(errorEntry)) {
          errors.push({
            code: 'PARSER_RESULT_INVALID',
            message: `ParserResult.errors[${index}] must be a valid diagnostic object.`,
            path: `errors[${index}]`,
            severity: 'error',
          })
        }
      }
    }

    if (!errors.length) {
      const diagnostics = rawWarnings as unknown[]
      for (const [index, warning] of diagnostics.entries()) {
        if (!isContractDiagnostic(warning)) {
          errors.push({
            code: 'PARSER_RESULT_INVALID',
            message: `ParserResult.warnings[${index}] must be a valid diagnostic object.`,
            path: `warnings[${index}]`,
            severity: 'error',
          })
        } else {
          warnings.push(warning)
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings }
  }
}
