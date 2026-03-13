import type { ParserResult } from '#domain/contracts/dto/parser_contract_dto'
import type { GraphContract, ContractError } from '#domain/contracts/dto/graph_contract_dto'
import { ValidateContractVersionUseCase } from '#domain/usecases/validate_contract_version_usecase'
import { ValidateGraphContractUseCase } from '#domain/usecases/validate_graph_contract_usecase'

export interface ImportParserResultOutput {
  merged: GraphContract
  errors: ContractError[]
  warnings: ContractError[]
}

/**
 * ImportParserResultUseCase — ingests a validated ParserResult into the current GraphContract state.
 *
 * Rules:
 * 1. Schema version of ParserResult must be supported (current or previous only).
 * 2. Nodes and edges from ParserResult are merged into the base GraphContract.
 * 3. Duplicate node ids from existing contract take precedence (parser result nodes are additive).
 * 4. Merged contract is structurally validated before returning.
 * 5. Any structural violations are returned as errors (not thrown).
 */
export class ImportParserResultUseCase {
  private readonly versionValidator = new ValidateContractVersionUseCase()
  private readonly contractValidator = new ValidateGraphContractUseCase()

  execute(parserResult: ParserResult, base: GraphContract): ImportParserResultOutput {
    const warnings: ContractError[] = [...parserResult.warnings]

    // Version check on parser result
    const versionCheck = this.versionValidator.execute(parserResult.schemaVersion)
    if (!versionCheck.valid) {
      return { merged: base, errors: versionCheck.errors, warnings }
    }

    // If ParserResult itself contains errors, refuse merge
    if (parserResult.errors.length > 0) {
      return {
        merged: base,
        errors: [
          {
            code: 'PARSER_RESULT_INVALID',
            message: `Cannot merge parser result with ${parserResult.errors.length} error(s). Fix parser errors first.`,
            severity: 'error',
          },
        ],
        warnings,
      }
    }

    // Build merged contract — existing nodes take precedence on id collision
    const existingNodeIds = new Set(base.nodes.map((n) => n.id))
    const existingEdgeIds = new Set(base.edges.map((e) => e.id))

    const mergedNodes = [
      ...base.nodes,
      ...parserResult.nodes.filter((n) => !existingNodeIds.has(n.id)),
    ]
    const mergedEdges = [
      ...base.edges,
      ...parserResult.edges.filter((e) => !existingEdgeIds.has(e.id)),
    ]

    const merged: GraphContract = {
      schemaVersion: base.schemaVersion,
      nodes: mergedNodes,
      edges: mergedEdges,
      errors: [],
    }

    // Validate merged result
    const mergeValidation = this.contractValidator.execute(merged)
    if (!mergeValidation.valid) {
      return { merged: base, errors: mergeValidation.errors, warnings }
    }

    return { merged, errors: [], warnings }
  }
}
