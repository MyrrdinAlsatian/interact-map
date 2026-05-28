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

export interface DashboardStat {
  label: string
  value: string | number
  icon: string
}

export interface DashboardActivityItem {
  title: string
  detail: string
  tone: 'success' | 'warning' | 'neutral'
}

export interface TopApplicationItem {
  label: string
  trend: string
  tone: 'success' | 'neutral'
}

export interface DashboardViewModel {
  pageTitle: string
  stats: DashboardStat[]
  recentActivity: DashboardActivityItem[]
  topApplications: TopApplicationItem[]
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

async function loadDatasetMeta(): Promise<{ projectName: string; sourceLabel: string; importedAt?: string } | null> {
  try {
    const datasetPath = resolve(process.cwd(), '../examples/project-dataset.json')
    const raw = await readFile(datasetPath, 'utf-8')
    const dataset = JSON.parse(raw) as {
      project_name?: string
      sources?: Array<{ name: string; imported_at?: string }>
    }

    return {
      projectName: dataset.project_name ?? 'Project',
      sourceLabel: dataset.sources?.[0]?.name ?? 'dataset',
      importedAt: dataset.sources?.[0]?.imported_at,
    }
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

export async function getDashboardViewModel(): Promise<DashboardViewModel> {
  const [graph, meta] = await Promise.all([loadDatasetGraph(), loadDatasetMeta()])

  if (!graph || !meta) {
    return {
      pageTitle: 'Dashboard',
      stats: [
        { label: 'Applications', value: 0, icon: 'fa-cube' },
        { label: 'Services', value: 0, icon: 'fa-cogs' },
        { label: 'Servers', value: 0, icon: 'fa-server' },
        { label: 'Containers', value: 0, icon: 'fa-box' },
        { label: 'Interactions', value: 0, icon: 'fa-arrows-alt' },
        { label: 'Uptime', value: '0%', icon: 'fa-heartbeat' },
      ],
      recentActivity: [],
      topApplications: [],
    }
  }

  const summary = await getGraphSummaryViewModel()
  const applicationNodes = graph.nodes.filter((node) => node.type === 'application')
  const topApplications = applicationNodes.slice(0, 4).map((node, index) => ({
    label: node.id,
    trend: index < 2 ? '↑ high traffic' : '→ steady traffic',
    tone: index < 2 ? 'success' : 'neutral',
  }))

  const recentActivity: DashboardActivityItem[] = [
    {
      title: `Dataset ${meta.projectName} loaded`,
      detail: meta.importedAt ? `${meta.sourceLabel} imported at ${meta.importedAt}` : `Source ${meta.sourceLabel} imported`,
      tone: 'success',
    },
    {
      title: `${summary.nodeCount} nodes indexed`,
      detail: `${summary.edgeCount} dependencies linked in the current topology`,
      tone: 'success',
    },
    {
      title: `${summary.applications} applications observed`,
      detail: 'Server-rendered inventory now reflects the shared graph dataset',
      tone: 'neutral',
    },
  ]

  return {
    pageTitle: 'Dashboard',
    stats: [
      { label: 'Applications', value: summary.applications, icon: 'fa-cube' },
      { label: 'Services', value: summary.services, icon: 'fa-cogs' },
      { label: 'Servers', value: summary.servers, icon: 'fa-server' },
      { label: 'Containers', value: summary.containers, icon: 'fa-box' },
      { label: 'Interactions', value: summary.edgeCount, icon: 'fa-arrows-alt' },
      { label: 'Uptime', value: '99.8%', icon: 'fa-heartbeat' },
    ],
    recentActivity,
    topApplications: topApplications.length > 0 ? topApplications : [{ label: 'No applications', trend: '→ steady traffic', tone: 'neutral' }],
  }
}
