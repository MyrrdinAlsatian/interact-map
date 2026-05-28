import type { ParserResult } from '#domain/contracts/dto/parser_contract_dto'
import type { GraphContract, ContractError } from '#domain/contracts/dto/graph_contract_dto'
import { ValidateContractVersionUseCase } from '#domain/usecases/validate_contract_version_usecase'
import { ValidateGraphContractUseCase } from '#domain/usecases/validate_graph_contract_usecase'
import type { ContractVersionValidationResult } from '#domain/usecases/validate_contract_version_usecase'
import type { GraphContractValidationResult } from '#domain/usecases/validate_graph_contract_usecase'

export type MergeStrategy = 'skip' | 'update' | 'archive-missing'

export interface ImportOptions {
  mergeStrategy?: MergeStrategy
}

export interface ImportParserResultOutput {
  merged: GraphContract
  errors: ContractError[]
  warnings: ContractError[]
}

export interface ContractVersionValidator {
  execute(schemaVersion: string): ContractVersionValidationResult
}

export interface GraphContractValidator {
  execute(contract: unknown): GraphContractValidationResult
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
  #versionValidator: ContractVersionValidator
  #contractValidator: GraphContractValidator

  constructor(
    versionValidator: ContractVersionValidator = new ValidateContractVersionUseCase(),
    contractValidator: GraphContractValidator = new ValidateGraphContractUseCase()
  ) {
    this.#versionValidator = versionValidator
    this.#contractValidator = contractValidator
  }

  execute(
    parserResult: ParserResult,
    base: GraphContract,
    options: ImportOptions = {}
  ): ImportParserResultOutput {
    const warnings: ContractError[] = [...parserResult.warnings]
    const mergeStrategy: MergeStrategy = options.mergeStrategy ?? 'skip'

    // Version check on parser result
    const versionCheck = this.#versionValidator.execute(parserResult.schemaVersion)
    if (!versionCheck.valid) {
      return { merged: base, errors: versionCheck.errors, warnings }
    }

    const fatalWarnings = parserResult.warnings.filter((warning) => warning.severity === 'error')

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
          ...fatalWarnings,
        ],
        warnings,
      }
    }

    if (fatalWarnings.length > 0) {
      return {
        merged: base,
        errors: [
          {
            code: 'PARSER_RESULT_INVALID',
            message: `Cannot merge parser result with ${fatalWarnings.length} warning(s) of severity error.`,
            severity: 'error',
          },
          ...fatalWarnings,
        ],
        warnings,
      }
    }

    const incomingNodesById = new Map(parserResult.nodes.map((node) => [node.id, node]))
    const incomingEdgesById = new Map(parserResult.edges.map((edge) => [edge.id, edge]))

    let mergedNodes =
      mergeStrategy === 'skip'
        ? [
            ...base.nodes,
            ...parserResult.nodes.filter((node) => !base.nodes.some((existing) => existing.id === node.id)),
          ]
        : [
            ...base.nodes.map((node) => incomingNodesById.get(node.id) ?? node),
            ...parserResult.nodes.filter((node) => !base.nodes.some((existing) => existing.id === node.id)),
          ]

    const mergedEdges =
      mergeStrategy === 'skip'
        ? [
            ...base.edges,
            ...parserResult.edges.filter((edge) => !base.edges.some((existing) => existing.id === edge.id)),
          ]
        : [
            ...base.edges.map((edge) => incomingEdgesById.get(edge.id) ?? edge),
            ...parserResult.edges.filter((edge) => !base.edges.some((existing) => existing.id === edge.id)),
          ]

    if (mergeStrategy === 'archive-missing') {
      const incomingNodeIds = new Set(parserResult.nodes.map((node) => node.id))

      mergedNodes = mergedNodes.map((node) => {
        if (incomingNodeIds.has(node.id)) {
          const metadata = { ...(node.metadata ?? {}) }
          delete metadata['archived']
          delete metadata['archivedAt']
          return { ...node, metadata }
        }

        return {
          ...node,
          metadata: {
            ...(node.metadata ?? {}),
            archived: true,
            archivedAt: new Date().toISOString(),
          },
        }
      })
    }

    const merged: GraphContract = {
      schemaVersion: base.schemaVersion,
      nodes: mergedNodes,
      edges: mergedEdges,
      errors: [],
    }

    // Validate merged result
    const mergeValidation = this.#contractValidator.execute(merged)
    if (!mergeValidation.valid) {
      return { merged: base, errors: mergeValidation.errors, warnings }
    }

    return { merged, errors: [], warnings }
  }
}
