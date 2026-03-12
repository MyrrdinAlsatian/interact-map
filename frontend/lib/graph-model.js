export const NODE_TYPES = ['application', 'service', 'server', 'container', 'external'];
export const CRITICALITY_LEVELS = ['critical', 'high', 'medium', 'low'];

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
