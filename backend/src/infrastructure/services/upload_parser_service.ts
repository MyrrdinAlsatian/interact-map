import type { ParserResult, ParserSourceType } from '#domain/contracts/dto/parser_contract_dto'
import type { ContractError, GraphEdge, GraphNode } from '#domain/contracts/dto/graph_contract_dto'
import yaml from 'js-yaml'

function warning(code: string, message: string, path?: string): ContractError {
  return { code, message, path, severity: 'warning' }
}

function error(code: string, message: string, path?: string): ContractError {
  return { code, message, path, severity: 'error' }
}

function detectSourceType(content: string, fileName?: string): ParserSourceType {
  const lowerName = (fileName ?? '').toLowerCase()
  if (lowerName.endsWith('.yaml') || lowerName.endsWith('.yml')) {
    return 'docker-compose'
  }

  const trimmed = content.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0]) {
        const row = parsed[0] as Record<string, unknown>
        const looksLikeInspect = 'Config' in row || 'NetworkSettings' in row || 'State' in row
        if (looksLikeInspect) {
          return 'docker-inspect'
        }
      }
      return 'docker-ps'
    } catch {
      return 'docker-compose'
    }
  }

  return 'docker-compose'
}

function normalizePorts(ports: unknown): Array<{ host: string | null; container: string | null }> {
  if (!Array.isArray(ports)) {
    return []
  }

  return ports.map((port) => {
    if (typeof port === 'string') {
      const [host, container] = port.split(':')
      return { host: host || null, container: container || host || null }
    }
    if (typeof port === 'number') {
      return { host: null, container: String(port) }
    }
    return { host: null, container: null }
  })
}

function parseDockerCompose(content: string, schemaVersion: string): ParserResult {
  const warnings: ContractError[] = []
  const parsed = yaml.load(content) as { services?: Record<string, any> } | undefined
  const services = parsed?.services ?? {}

  if (!parsed || typeof parsed !== 'object') {
    return { schemaVersion, nodes: [], edges: [], errors: [error('COMPOSE_INVALID', 'docker-compose payload is invalid YAML.')], warnings }
  }

  if (Object.keys(services).length === 0) {
    warnings.push(warning('COMPOSE_EMPTY', 'No services found in docker-compose payload.', 'services'))
  }

  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  for (const [name, definition] of Object.entries(services)) {
    nodes.push({
      id: `container:${name}`,
      type: 'container',
      label: name,
      metadata: {
        docker_image: definition?.image ?? null,
        exposed_ports: normalizePorts(definition?.ports),
        environment_variables: definition?.environment ?? {},
      },
    })

    const dependsOn = Array.isArray(definition?.depends_on)
      ? definition.depends_on
      : Object.keys(definition?.depends_on ?? {})

    for (const dependency of dependsOn) {
      edges.push({
        id: `depends:${name}->${dependency}`,
        source: `container:${name}`,
        target: `container:${dependency}`,
        criticality: 'high',
        dependencyType: 'required',
        protocol: 'docker-network',
      })
    }
  }

  return { schemaVersion, nodes, edges, errors: [], warnings }
}

function parseDockerInspect(content: string, schemaVersion: string): ParserResult {
  const warnings: ContractError[] = []
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    return { schemaVersion, nodes: [], edges: [], errors: [error('INSPECT_INVALID_JSON', 'docker inspect payload must be valid JSON array.')], warnings }
  }

  if (!Array.isArray(parsed)) {
    return { schemaVersion, nodes: [], edges: [], errors: [error('INSPECT_INVALID_FORMAT', 'docker inspect payload must be an array.')], warnings }
  }

  const names = parsed
    .map((item) => (item && typeof item === 'object' ? String((item as Record<string, unknown>).Name ?? '').replace(/^\//, '') : ''))
    .filter(Boolean)

  for (const entry of parsed) {
    if (!entry || typeof entry !== 'object') {
      continue
    }
    const row = entry as Record<string, any>
    const name = String(row.Name ?? '').replace(/^\//, '') || String(row.Id ?? 'unknown')

    nodes.push({
      id: `container:${name}`,
      type: 'container',
      label: name,
      metadata: {
        docker_image: row?.Config?.Image ?? null,
        status: row?.State?.Status ?? 'unknown',
        networks: Object.keys(row?.NetworkSettings?.Networks ?? {}),
        environment_variables: row?.Config?.Env ?? [],
      },
    })

    const envList: string[] = Array.isArray(row?.Config?.Env) ? row.Config.Env : []
    for (const variable of envList) {
      const [, value] = variable.split('=')
      if (!value) {
        continue
      }
      for (const candidate of names) {
        if (candidate !== name && value.includes(candidate)) {
          edges.push({
            id: `inspect:${name}->${candidate}`,
            source: `container:${name}`,
            target: `container:${candidate}`,
            criticality: 'medium',
            dependencyType: 'required',
            protocol: 'inferred',
          })
        }
      }
    }
  }

  return { schemaVersion, nodes, edges, errors: [], warnings }
}

function parseDockerPs(content: string, schemaVersion: string): ParserResult {
  const warnings: ContractError[] = []
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    return { schemaVersion, nodes: [], edges: [], errors: [error('DOCKER_PS_INVALID_JSON', 'docker ps payload must be valid JSON array.')], warnings }
  }

  if (!Array.isArray(parsed)) {
    return { schemaVersion, nodes: [], edges: [], errors: [error('DOCKER_PS_INVALID_FORMAT', 'docker ps payload must be an array.')], warnings }
  }

  const nodes: GraphNode[] = parsed.map((row: any) => {
    const name = row.Names ?? row.Name ?? row.ID ?? row.Id ?? 'unknown'
    return {
      id: `container:${name}`,
      type: 'container',
      label: String(name),
      metadata: {
        docker_image: row.Image ?? null,
        status: row.State ?? row.Status ?? 'unknown',
        exposed_ports: row.Ports ?? '',
      },
    }
  })

  return { schemaVersion, nodes, edges: [], errors: [], warnings }
}

export function parseUploadedInfrastructureData(params: {
  content: string
  sourceType?: string
  fileName?: string
  schemaVersion?: string
}): ParserResult {
  const schemaVersion = params.schemaVersion ?? '1.0'
  const sourceType = (params.sourceType as ParserSourceType | undefined) ?? detectSourceType(params.content, params.fileName)

  if (sourceType === 'docker-compose') {
    return parseDockerCompose(params.content, schemaVersion)
  }

  if (sourceType === 'docker-inspect') {
    return parseDockerInspect(params.content, schemaVersion)
  }

  if (sourceType === 'docker-ps') {
    return parseDockerPs(params.content, schemaVersion)
  }

  return {
    schemaVersion,
    nodes: [],
    edges: [],
    errors: [error('SOURCE_TYPE_UNSUPPORTED', `Unsupported sourceType "${params.sourceType}".`)],
    warnings: [],
  }
}
