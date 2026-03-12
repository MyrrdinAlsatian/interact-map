export function parseDockerPsJson(input) {
  const entries = typeof input === 'string' ? JSON.parse(input) : input;
  if (!Array.isArray(entries)) {
    throw new Error('docker ps JSON export must be an array');
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

  return {
    nodes,
    edges: [],
    metadata: {
      sourceType: 'docker-ps',
      sourceName: 'docker ps export',
    },
  };
}
