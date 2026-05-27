import assert from 'node:assert/strict'
import test from 'node:test'
import { ValidateParserResultUseCase } from '#domain/usecases/validate_parser_result_usecase'
import type { ParserResult } from '#domain/contracts/dto/parser_contract_dto'

const validParserResult: ParserResult = {
  schemaVersion: '1.0',
  nodes: [],
  edges: [],
  errors: [],
  warnings: [],
}

test('ValidateParserResultUseCase accepts a valid ParserResult', () => {
  const validator = new ValidateParserResultUseCase()
  const result = validator.execute(validParserResult)

  assert.strictEqual(result.valid, true)
  assert.deepEqual(result.errors, [])
  assert.deepEqual(result.warnings, [])
})

test('ValidateParserResultUseCase rejects ParserResult missing nodes array', () => {
  const validator = new ValidateParserResultUseCase()
  const invalidPayload = {
    schemaVersion: '1.0',
    edges: [],
    errors: [],
    warnings: [],
  }

  const result = validator.execute(invalidPayload)

  assert.strictEqual(result.valid, false)
  assert.strictEqual(result.errors[0].path, 'nodes')
})

test('ValidateParserResultUseCase rejects ParserResult with invalid warning diagnostic', () => {
  const validator = new ValidateParserResultUseCase()
  const invalidPayload = {
    schemaVersion: '1.0',
    nodes: [],
    edges: [],
    errors: [],
    warnings: [{ code: 'BAD_WARNING' }],
  }

  const result = validator.execute(invalidPayload)

  assert.strictEqual(result.valid, false)
  assert.strictEqual(result.errors[0].path, 'warnings[0]')
})
