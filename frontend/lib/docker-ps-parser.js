import { validateParserInput, buildParserResult } from './parser-contract';

/**
 * Parses a `docker ps --format json` array into a canonical ParserResult.
 *
 * @param {string|object[]} input - Raw JSON string or parsed array from docker ps
 * @param {string} [schemaVersion='1.0'] - Parser schema version for the envelope
 * @returns {ParserResult | { valid: false, errors: ContractError[], warnings: ContractError[] }}
 */
export function parseDockerPsJson(input, schemaVersion = '1.0') {
  const validation = validateParserInput({ sourceType: 'docker-ps', schemaVersion, payload: input });
  if (!validation.valid) {
    return { schemaVersion, nodes: [], edges: [], errors: validation.errors, warnings: validation.warnings };
  }

  const entries = typeof input === 'string' ? JSON.parse(input) : input;
  if (!Array.isArray(entries)) {
    return {
      schemaVersion, nodes: [], edges: [],
      errors: [{ code: 'INPUT_FORMAT_INVALID', message: 'docker ps JSON export must be an array', severity: 'error' }],
      warnings: validation.warnings,
    };
  }

  const nodes = entries.map((row) => {
    const names = row.Names || row.Name || row.ID;
    return {
      id: `container:${names}`,
      type: 'container',
      label: names,
      metadata: {
        docker_image: row.Image,
        status: row.State || row.Status,
        exposed_ports: row.Ports || '',
      },
    };
  });

  return buildParserResult({ nodes, edges: [], metadata: { sourceType: 'docker-ps', sourceName: 'docker ps export' } }, schemaVersion, [], validation.warnings);
}
