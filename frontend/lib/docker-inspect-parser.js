function parsePorts(networkSettings = {}) {
  const portMap = networkSettings.Ports || {};
  return Object.entries(portMap).map(([containerPort, mappings]) => ({
    container: containerPort,
    host: Array.isArray(mappings) && mappings[0] ? mappings[0].HostPort : null,
  }));
}

function inferDependencyByEnv(container, knownNames) {
  const envList = container?.Config?.Env || [];
  const dependencies = [];
  for (const variable of envList) {
    const [, value] = variable.split('=');
    if (!value) {
      continue;
    }
    for (const candidate of knownNames) {
      if (value.includes(candidate)) {
        dependencies.push(candidate);
      }
    }
  }
  return [...new Set(dependencies)];
}

export function parseDockerInspect(input) {
  const containers = typeof input === 'string' ? JSON.parse(input) : input;
  if (!Array.isArray(containers)) {
    throw new Error('docker inspect payload must be an array');
  }

  const nodes = [];
  const edges = [];
  const names = containers.map((item) => (item.Name || '').replace(/^\//, '')).filter(Boolean);

  for (const container of containers) {
    const name = (container.Name || '').replace(/^\//, '') || container.Id;
    const image = container?.Config?.Image || null;

    nodes.push({
      id: `container:${name}`,
      type: 'container',
      label: name,
      metadata: {
        docker_image: image,
        status: container?.State?.Status || 'unknown',
        networks: Object.keys(container?.NetworkSettings?.Networks || {}),
        exposed_ports: parsePorts(container?.NetworkSettings || {}),
        environment_variables: container?.Config?.Env || [],
      },
    });

    const inferred = inferDependencyByEnv(container, names);
    for (const dependency of inferred) {
      if (dependency === name) {
        continue;
      }
      edges.push({
        id: `inspect:${name}->${dependency}`,
        source: `container:${name}`,
        target: `container:${dependency}`,
        criticality: 'medium',
        dependencyType: 'required',
        protocol: 'inferred',
      });
    }
  }

  return {
    nodes,
    edges,
    metadata: {
      sourceType: 'docker-inspect',
      sourceName: 'docker inspect',
    },
  };
}
