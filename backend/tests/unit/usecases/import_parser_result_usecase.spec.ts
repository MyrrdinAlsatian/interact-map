import assert from 'node:assert/strict'
import test from 'node:test'
import { ImportParserResultUseCase } from '#domain/usecases/import_parser_result_usecase'
import type { ParserResult } from '#domain/contracts/dto/parser_contract_dto'
import type { GraphContract, ContractError } from '#domain/contracts/dto/graph_contract_dto'
import type { ContractVersionValidationResult } from '#domain/usecases/validate_contract_version_usecase'
import type { GraphContractValidationResult } from '#domain/usecases/validate_graph_contract_usecase'

const validBase: GraphContract = {
  schemaVersion: '1.0',
  nodes: [],
  edges: [],
  errors: [],
}

const parserResult: ParserResult = {
  schemaVersion: '1.0',
  nodes: [],
  edges: [],
  errors: [],
  warnings: [],
}

test('ImportParserResultUseCase accepts injected validator adapters', async () => {
  let versionValidatorCalled = false
  let contractValidatorCalled = false

  const versionValidator = {
    execute(schemaVersion: string): ContractVersionValidationResult {
      versionValidatorCalled = true
      return {
        valid: schemaVersion === '1.0',
        errors: schemaVersion === '1.0' ? [] : [{ code: 'VERSION_UNSUPPORTED', message: 'unsupported', severity: 'error' }],
      }
    },
  }

  const contractValidator = {
    execute(contract: unknown): GraphContractValidationResult {
      contractValidatorCalled = true
      return { valid: true, errors: [] }
    },
  }

  const useCase = new ImportParserResultUseCase(versionValidator, contractValidator)
  const output = useCase.execute(parserResult, validBase)

  assert.ok(versionValidatorCalled, 'version validator should be invoked')
  assert.ok(contractValidatorCalled, 'contract validator should be invoked')
  assert.deepEqual(output.errors, [])
  assert.deepEqual(output.warnings, [])
})

test('ImportParserResultUseCase returns validator errors from injected version validator', async () => {
  const versionValidator = {
    execute(): ContractVersionValidationResult {
      return {
        valid: false,
        errors: [{ code: 'VERSION_UNSUPPORTED', message: 'unsupported', severity: 'error' }],
      }
    },
  }

  const contractValidator = {
    execute(contract: unknown): GraphContractValidationResult {
      return { valid: true, errors: [] }
    },
  }

  const useCase = new ImportParserResultUseCase(versionValidator, contractValidator)
  const output = useCase.execute(parserResult, validBase)

  assert.strictEqual(output.merged, validBase)
  assert.strictEqual(output.errors.length, 1)
  assert.strictEqual(output.errors[0].code, 'VERSION_UNSUPPORTED')
  assert.deepEqual(output.warnings, [])
})

test('ImportParserResultUseCase refuses merge when parserResult warnings include severity error', async () => {
  const versionValidator = {
    execute(schemaVersion: string): ContractVersionValidationResult {
      return {
        valid: true,
        errors: [],
      }
    },
  }

  const contractValidator = {
    execute(contract: unknown): GraphContractValidationResult {
      return { valid: true, errors: [] }
    },
  }

  const parserResultWithFatalWarning: ParserResult = {
    ...parserResult,
    warnings: [{ code: 'PARSER_WARNING_ERROR', message: 'fatal warning', severity: 'error' }],
  }

  const useCase = new ImportParserResultUseCase(versionValidator, contractValidator)
  const output = useCase.execute(parserResultWithFatalWarning, validBase)

  assert.strictEqual(output.merged, validBase)
  assert.strictEqual(output.errors.length, 2)
  assert.strictEqual(output.errors[0].code, 'PARSER_RESULT_INVALID')
  assert.strictEqual(output.errors[1].code, 'PARSER_WARNING_ERROR')
  assert.deepEqual(output.warnings, parserResultWithFatalWarning.warnings)
})
