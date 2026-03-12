const criticalityColors = {
  critical: '#e03131',
  high: '#f08c00',
  medium: '#ffd43b',
  low: '#868e96',
};

const nodeColors = {
  application: '#1971c2',
  service: '#0b7285',
  server: '#5f3dc4',
  container: '#2b8a3e',
  external: '#495057',
};

export function toX6Graph(graphModel) {
  const nodes = graphModel.nodes.map((node) => ({
    id: node.id,
    shape: 'rect',
    width: 180,
    height: 56,
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: nodeColors[node.type] || '#343a40',
        strokeWidth: 2,
        rx: 10,
        ry: 10,
      },
      label: {
        text: node.label,
        fill: '#212529',
        fontSize: 12,
      },
    },
    data: {
      ...node,
    },
  }));

  const edges = graphModel.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    attrs: {
      line: {
        stroke: criticalityColors[edge.criticality] || criticalityColors.low,
        strokeWidth: 2,
        targetMarker: {
          name: 'classic',
          size: 8,
        },
      },
    },
    labels: [
      {
        attrs: {
          label: {
            text: `${edge.dependencyType || 'required'} • ${edge.criticality}`,
            fill: '#495057',
            fontSize: 10,
          },
        },
      },
    ],
    data: {
      ...edge,
    },
  }));

  return { nodes, edges };
}

export function getCriticalityColor(criticality) {
  return criticalityColors[criticality] || criticalityColors.low;
}
