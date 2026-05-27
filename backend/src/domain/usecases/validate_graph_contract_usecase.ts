import type { ContractError } from '#domain/contracts/dto/graph_contract_dto'
import { ValidateContractVersionUseCase } from '#domain/usecases/validate_contract_version_usecase'
import { VALID_NODE_TYPES, VALID_CRITICALITY } from '#domain/contracts/graph_contract_metadata'

export interface GraphContractValidationResult {
  valid: boolean
  errors: ContractError[]
}

export class ValidateGraphContractUseCase {
  private readonly versionValidator = new ValidateContractVersionUseCase()

  execute(contract: unknown): GraphContractValidationResult {
    const errors: ContractError[] = []

    if (!contract || typeof contract !== 'object') {
      return {
        valid: false,
        errors: [
          {
            code: 'PAYLOAD_INVALID',
            message: 'Contract payload must be a non-null object',
            severity: 'error',
          },
        ],
      }
    }

    const payload = contract as Record<string, unknown>

    // Schema version check
    const versionResult = this.versionValidator.execute(payload['schemaVersion'] as string)
    if (!versionResult.valid) {
      errors.push(...versionResult.errors)
    }

    // Structural checks
    if (!Array.isArray(payload['nodes'])) {
      errors.push({ code: 'NODES_MISSING', message: 'nodes must be an array', severity: 'error' })
    }

    if (!Array.isArray(payload['edges'])) {
      errors.push({ code: 'EDGES_MISSING', message: 'edges must be an array', severity: 'error' })
    }

    if (errors.length > 0) {
      return { valid: false, errors }
    }

    const nodes = payload['nodes'] as unknown[]
    const edges = payload['edges'] as unknown[]
    const nodeIds = new Set<string>()

    for (const [index, node] of nodes.entries()) {
      const n = node as Record<string, unknown>
      if (!n['id'] || typeof n['id'] !== 'string') {
        errors.push({
          code: 'NODE_ID_MISSING',
          message: `Node at index ${index} is missing a valid id`,
          path: `nodes[${index}].id`,
          severity: 'error',
        })
      } else {
        nodeIds.add(n['id'])
      }
      if (!n['label'] || typeof n['label'] !== 'string') {
        errors.push({
          code: 'NODE_LABEL_MISSING',
          message: `Node at index ${index} is missing a label`,
          path: `nodes[${index}].label`,
          severity: 'error',
        })
      }
      if (!VALID_NODE_TYPES.includes(n['type'] as (typeof VALID_NODE_TYPES)[number])) {
        errors.push({
          code: 'NODE_TYPE_INVALID',
          message: `Node at index ${index} has unsupported type: ${String(n['type'])}`,
          path: `nodes[${index}].type`,
          severity: 'error',
        })
      }
    }

    for (const [index, edge] of edges.entries()) {
      const e = edge as Record<string, unknown>
      if (!e['id'] || typeof e['id'] !== 'string') {
        errors.push({
          code: 'EDGE_ID_MISSING',
          message: `Edge at index ${index} is missing a valid id`,
          path: `edges[${index}].id`,
          severity: 'error',
        })
      }
      if (!VALID_CRITICALITY.includes(e['criticality'] as (typeof VALID_CRITICALITY)[number])) {
        errors.push({
          code: 'EDGE_CRITICALITY_INVALID',
          message: `Edge at index ${index} has unsupported criticality: ${String(e['criticality'])}`,
          path: `edges[${index}].criticality`,
          severity: 'error',
        })
      }
      if (typeof e['source'] !== 'string' || !nodeIds.has(e['source'])) {
        errors.push({
          code: 'EDGE_SOURCE_INVALID',
          message: `Edge at index ${index} references unknown source node`,
          path: `edges[${index}].source`,
          severity: 'error',
        })
      }
      if (typeof e['target'] !== 'string' || !nodeIds.has(e['target'])) {
        errors.push({
          code: 'EDGE_TARGET_INVALID',
          message: `Edge at index ${index} references unknown target node`,
          path: `edges[${index}].target`,
          severity: 'error',
        })
      }
    }

    return { valid: errors.length === 0, errors }
  }
}
