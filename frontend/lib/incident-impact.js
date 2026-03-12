export function analyzeIncidentImpact(graph, failedNodeId, mode = 'bfs') {
  if (!graph || !failedNodeId) {
    throw new Error('graph and failedNodeId are required');
  }

  const adjacency = new Map();
  for (const node of graph.nodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of graph.edges) {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, []);
    }
    adjacency.get(edge.source).push(edge.target);
  }

  const visited = new Set();
  const impactedEdges = new Set();
  const frontier = [failedNodeId];
  visited.add(failedNodeId);

  while (frontier.length > 0) {
    const current = mode === 'dfs' ? frontier.pop() : frontier.shift();
    const neighbors = adjacency.get(current) || [];

    for (const neighbor of neighbors) {
      const edge = graph.edges.find((candidate) => candidate.source === current && candidate.target === neighbor);
      if (edge) {
        impactedEdges.add(edge.id);
      }

      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        frontier.push(neighbor);
      }
    }
  }

  const impactedNodes = [...visited].filter((id) => id !== failedNodeId);

  return {
    failedNodeId,
    traversal: mode,
    impactedNodes,
    impactedEdges: [...impactedEdges],
  };
}
