/**
 * parser-contract.js — parser schema-version policy enforcement.
 *
 * Schema version policy for parser inputs:
 *   - '1.0' (current)  — fully supported
 *   - '0.9' (previous) — supported with optional compatibility warnings
 *   - anything older   — structured error, NOT silently ignored
 *
 * All parsers call validateParserInput() before normalizing their payload.
 * The returned errors[] is deterministic for identical inputs.
 */

export const SUPPORTED_PARSER_SCHEMA_VERSIONS = ['1.0', '0.9'];
export const SUPPORTED_SOURCE_TYPES = ['docker-compose', 'docker-inspect', 'docker-ps'];

/**
 * Validates a ParserInput envelope.
 * @param {object} input - { sourceType, schemaVersion, payload }
 * @returns {{ valid: boolean, errors: ContractError[], warnings: ContractError[] }}
 */
export function validateParserInput(input) {
  const errors = [];
  const warnings = [];

  if (!input || typeof input !== 'object') {
    return { valid: false, errors: [{ code: 'INPUT_INVALID', message: 'Parser input must be a non-null object', severity: 'error' }], warnings: [] };
  }

  if (!input.sourceType) {
    errors.push({ code: 'SOURCE_TYPE_MISSING', message: 'sourceType is required', path: 'sourceType', severity: 'error' });
  } else if (!SUPPORTED_SOURCE_TYPES.includes(input.sourceType)) {
    errors.push({
      code: 'SOURCE_TYPE_UNSUPPORTED',
      message: `sourceType "${input.sourceType}" is not supported. Accepted: ${SUPPORTED_SOURCE_TYPES.join(', ')}.`,
      path: 'sourceType',
      severity: 'error',
    });
  }

  if (!input.schemaVersion) {
    errors.push({ code: 'VERSION_MISSING', message: 'schemaVersion is required', path: 'schemaVersion', severity: 'error' });
  } else if (!SUPPORTED_PARSER_SCHEMA_VERSIONS.includes(input.schemaVersion)) {
    errors.push({
      code: 'VERSION_UNSUPPORTED',
      message: `Schema version "${input.schemaVersion}" is not supported by this parser. Accepted: ${SUPPORTED_PARSER_SCHEMA_VERSIONS.join(', ')}.`,
      path: 'schemaVersion',
      severity: 'error',
    });
  } else if (input.schemaVersion === '0.9') {
    warnings.push({
      code: 'VERSION_PREVIOUS',
      message: 'Using previous schema version 0.9. Consider upgrading to 1.0.',
      path: 'schemaVersion',
      severity: 'warning',
    });
  }

  if (input.payload === undefined || input.payload === null) {
    errors.push({ code: 'PAYLOAD_MISSING', message: 'payload is required', path: 'payload', severity: 'error' });
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Wraps a normalized parse result with schema metadata.
 * Called by each parser adapter after normalization succeeds.
 *
 * @param {{ nodes: object[], edges: object[], metadata?: object }} rawResult
 * @param {string} schemaVersion - the version used for parsing
 * @param {object[]} errors - ContractErrors from validation (typically [])
 * @param {object[]} warnings - ContractWarnings from validation
 * @returns {ParserResult}
 */
export function buildParserResult(rawResult, schemaVersion, errors = [], warnings = []) {
  return {
    schemaVersion,
    nodes: rawResult.nodes ?? [],
    edges: rawResult.edges ?? [],
    errors,
    warnings,
  };
}
