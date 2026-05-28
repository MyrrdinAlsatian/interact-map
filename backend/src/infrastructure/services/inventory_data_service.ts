import type { GraphContract, GraphEdge, GraphNode, NodeType } from '#domain/contracts/dto/graph_contract_dto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export type InventoryCategory =
  | 'applications'
  | 'services'
  | 'servers'
  | 'containers'
  | 'interactions'

export interface InventoryItem {
  id: string
  label: string
  type: NodeType
}

export interface InventoryViewModel {
  pageTitle: string
  pageSlug: string
  items: InventoryItem[]
}

export interface GraphSummaryViewModel {
  nodeCount: number
  edgeCount: number
  applications: number
  services: number
  servers: number
  containers: number
}

const TITLE_BY_CATEGORY: Record<InventoryCategory, string> = {
  applications: 'Applications',
  services: 'Services',
  servers: 'Servers',
  containers: 'Containers',
  interactions: 'Interactions',
}

const NODE_TYPE_BY_CATEGORY: Record<Exclude<InventoryCategory, 'interactions'>, NodeType> = {
  applications: 'application',
  services: 'service',
  servers: 'server',
  containers: 'container',
}

const FALLBACK_ITEMS: Record<InventoryCategory, InventoryItem[]> = {
  applications: [
    { id: 'sample-app-1', label: 'Web Frontend', type: 'application' },
    { id: 'sample-app-2', label: 'Orders API', type: 'application' },
  ],
  services: [
    { id: 'svc-postgres', label: 'PostgreSQL', type: 'service' },
    { id: 'svc-redis', label: 'Redis', type: 'service' },
  ],
  servers: [{ id: 'srv-prod-1', label: 'prod-vm-01', type: 'server' }],
  containers: [{ id: 'ctr-orders', label: 'orders-api', type: 'container' }],
  interactions: [
    { id: 'edge-e1', label: 'web-frontend -> orders-api', type: 'service' },
    { id: 'edge-e2', label: 'orders-api -> postgres', type: 'service' },
  ],
}

async function loadDatasetGraph(): Promise<GraphContract | null> {
  try {
    const datasetPath = resolve(process.cwd(), '../examples/project-dataset.json')
    const raw = await readFile(datasetPath, 'utf-8')
    const dataset = JSON.parse(raw) as { graph?: GraphContract }
    if (!dataset.graph || !Array.isArray(dataset.graph.nodes) || !Array.isArray(dataset.graph.edges)) {
      return null
    }
    return dataset.graph
  } catch {
    return null
  }
}

function mapNodes(nodes: GraphNode[], type: NodeType): InventoryItem[] {
  return nodes.filter((node) => node.type === type).map((node) => ({ id: node.id, label: node.label, type: node.type }))
}

function mapEdges(edges: GraphEdge[]): InventoryItem[] {
  return edges.map((edge) => ({
    id: edge.id,
    label: `${edge.source} -> ${edge.target}`,
    type: 'service',
  }))
}

export async function getInventoryViewModel(category: InventoryCategory): Promise<InventoryViewModel> {
  const graph = await loadDatasetGraph()

  if (!graph) {
    return {
      pageTitle: TITLE_BY_CATEGORY[category],
      pageSlug: category,
      items: FALLBACK_ITEMS[category],
    }
  }

  const items =
    category === 'interactions'
      ? mapEdges(graph.edges)
      : mapNodes(graph.nodes, NODE_TYPE_BY_CATEGORY[category])

  return {
    pageTitle: TITLE_BY_CATEGORY[category],
    pageSlug: category,
    items: items.length > 0 ? items : FALLBACK_ITEMS[category],
  }
}

export async function getGraphSummaryViewModel(): Promise<GraphSummaryViewModel> {
  const graph = await loadDatasetGraph()

  if (!graph) {
    return {
      nodeCount: 0,
      edgeCount: 0,
      applications: 0,
      services: 0,
      servers: 0,
      containers: 0,
    }
  }

  return {
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    applications: graph.nodes.filter((node) => node.type === 'application').length,
    services: graph.nodes.filter((node) => node.type === 'service').length,
    servers: graph.nodes.filter((node) => node.type === 'server').length,
    containers: graph.nodes.filter((node) => node.type === 'container').length,
  }
}
