import YAML from 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/+esm';

function normalizePorts(ports) {
  if (!Array.isArray(ports)) {
    return [];
  }

  return ports.map((port) => {
    if (typeof port === 'string') {
      const [host, container] = port.split(':');
      return { host: host || null, container: container || host || null };
    }
    if (typeof port === 'number') {
      return { host: null, container: String(port) };
    }
    return port;
  });
}

export function parseDockerCompose(input, projectName = 'docker-compose-project') {
  const parsed = YAML.load(input);
  const services = parsed?.services || {};

  const nodes = [];
  const edges = [];

  for (const [name, definition] of Object.entries(services)) {
    nodes.push({
      id: `container:${name}`,
      type: 'container',
      label: name,
      metadata: {
        docker_image: definition.image || null,
        exposed_ports: normalizePorts(definition.ports),
        environment_variables: definition.environment || {},
        project: projectName,
      },
    });

    const dependsOn = Array.isArray(definition.depends_on)
      ? definition.depends_on
      : Object.keys(definition.depends_on || {});

    for (const dependency of dependsOn) {
      edges.push({
        id: `depends:${name}->${dependency}`,
        source: `container:${name}`,
        target: `container:${dependency}`,
        criticality: 'high',
        dependencyType: 'required',
        protocol: 'docker-network',
      });
    }
  }

  return {
    nodes,
    edges,
    metadata: {
      sourceType: 'docker-compose',
      sourceName: projectName,
    },
  };
}
