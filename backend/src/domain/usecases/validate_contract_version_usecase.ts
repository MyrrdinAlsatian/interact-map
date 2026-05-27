import { SUPPORTED_SCHEMA_VERSIONS } from '#domain/contracts/graph_contract_metadata'
import type { ContractError } from '#domain/contracts/dto/graph_contract_dto'

export interface ContractVersionValidationResult {
  valid: boolean
  errors: ContractError[]
}

export class ValidateContractVersionUseCase {
  execute(schemaVersion: string): ContractVersionValidationResult {
    if (!schemaVersion) {
      return {
        valid: false,
        errors: [
          {
            code: 'VERSION_MISSING',
            message: 'schemaVersion is required',
            severity: 'error',
          },
        ],
      }
    }

    const isSupported = (SUPPORTED_SCHEMA_VERSIONS as readonly string[]).includes(schemaVersion)

    if (isSupported) {
      return { valid: true, errors: [] }
    }

    return {
      valid: false,
      errors: [
        {
          code: 'VERSION_UNSUPPORTED',
          message: `Schema version "${schemaVersion}" is not supported. Accepted versions: ${SUPPORTED_SCHEMA_VERSIONS.join(', ')}.`,
          severity: 'error',
        },
      ],
    }
  }
}
