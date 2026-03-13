export const NODE_TYPES = ['application', 'service', 'server', 'container', 'external'];
export const CRITICALITY_LEVELS = ['critical', 'high', 'medium', 'low'];
export const SUPPORTED_SCHEMA_VERSIONS = ['1.0', '0.9'];

/**
 * Validates a canonical GraphContract payload (schemaVersion, nodes[], edges[]).
 *
 * Returns { valid: true, errors: [] } on success.
 * Returns { valid: false, errors: ContractError[] } on failure.
 *
 * Schema version policy:
 *   - '1.0' (current)  — fully supported
 *   - '0.9' (previous) — supported with optional migration hints emitted as warnings
 *   - anything else    — structured compatibility error, NOT thrown as exception
 */
export function validateGraphContract(contract) {
  const errors = [];

  if (!contract || typeof contract !== 'object') {
    return { valid: false, errors: [{ code: 'PAYLOAD_INVALID', message: 'Contract must be a non-null object', severity: 'error' }] };
  }

  // Schema version enforcement
  const version = contract.schemaVersion;
  if (!version) {
    errors.push({ code: 'VERSION_MISSING', message: 'schemaVersion is required', severity: 'error' });
  } else if (!SUPPORTED_SCHEMA_VERSIONS.includes(version)) {
    errors.push({
      code: 'VERSION_UNSUPPORTED',
      message: `Schema version "${version}" is not supported. Accepted: ${SUPPORTED_SCHEMA_VERSIONS.join(', ')}.`,
      path: 'schemaVersion',
      severity: 'error',
    });
    return { valid: false, errors };
  }

  if (!Array.isArray(contract.nodes)) {
    errors.push({ code: 'NODES_MISSING', message: 'nodes must be an array', severity: 'error' });
  }
  if (!Array.isArray(contract.edges)) {
    errors.push({ code: 'EDGES_MISSING', message: 'edges must be an array', severity: 'error' });
  }

  if (errors.length > 0) return { valid: false, errors };

  const nodeIds = new Set();
  for (const [i, node] of contract.nodes.entries()) {
    if (!node.id) errors.push({ code: 'NODE_ID_MISSING', message: `Node at index ${i} missing id`, path: `nodes[${i}].id`, severity: 'error' });
    else nodeIds.add(node.id);
    if (!node.label) errors.push({ code: 'NODE_LABEL_MISSING', message: `Node at index ${i} missing label`, path: `nodes[${i}].label`, severity: 'error' });
    if (!NODE_TYPES.includes(node.type)) errors.push({ code: 'NODE_TYPE_INVALID', message: `Unsupported node type: ${node.type}`, path: `nodes[${i}].type`, severity: 'error' });
  }

  const edgeIds = new Set();
  for (const [i, edge] of contract.edges.entries()) {
    if (!edge.id) errors.push({ code: 'EDGE_ID_MISSING', message: `Edge at index ${i} missing id`, path: `edges[${i}].id`, severity: 'error' });
    else if (edgeIds.has(edge.id)) errors.push({ code: 'EDGE_ID_DUPLICATE', message: `Duplicate edge id: ${edge.id}`, path: `edges[${i}].id`, severity: 'error' });
    else edgeIds.add(edge.id);
    if (!CRITICALITY_LEVELS.includes(edge.criticality)) errors.push({ code: 'EDGE_CRITICALITY_INVALID', message: `Unsupported criticality: ${edge.criticality}`, path: `edges[${i}].criticality`, severity: 'error' });
    if (!nodeIds.has(edge.source)) errors.push({ code: 'EDGE_SOURCE_INVALID', message: `Edge ${edge.id} references unknown source`, path: `edges[${i}].source`, severity: 'error' });
    if (!nodeIds.has(edge.target)) errors.push({ code: 'EDGE_TARGET_INVALID', message: `Edge ${edge.id} references unknown target`, path: `edges[${i}].target`, severity: 'error' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * @deprecated Use validateGraphContract() for schema-version-aware validation.
 * Kept for backward compatibility with architecture-graph.js loadGraph().
 */
export function validateGraphModel(graph) {
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    throw new Error('Graph model must contain nodes[] and edges[]');
  }

  const nodeIds = new Set();
  for (const node of graph.nodes) {
    if (!node.id || !node.type || !node.label) {
      throw new Error('Each node must include id, type and label');
    }
    if (!NODE_TYPES.includes(node.type)) {
      throw new Error(`Unsupported node type: ${node.type}`);
    }
    nodeIds.add(node.id);
  }

  for (const edge of graph.edges) {
    if (!edge.id || !edge.source || !edge.target || !edge.criticality) {
      throw new Error('Each edge must include id, source, target and criticality');
    }
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new Error(`Edge ${edge.id} references unknown node`);
    }
    if (!CRITICALITY_LEVELS.includes(edge.criticality)) {
      throw new Error(`Unsupported criticality on edge ${edge.id}`);
    }
  }

  return true;
}

