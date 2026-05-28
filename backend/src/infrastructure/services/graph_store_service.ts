import type { GraphContract, GraphEdge, GraphNode, NodeType } from '#domain/contracts/dto/graph_contract_dto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const SHARED_GRAPH_PATH = resolve(process.cwd(), '../shared/current-graph.json')
const EXAMPLE_DATASET_PATH = resolve(process.cwd(), '../examples/project-dataset.json')
const IMPORT_REPORT_PATH = resolve(process.cwd(), '../shared/latest-import-report.json')

export interface GraphImportReport {
  timestamp: string
  sourceType: string
  fileName?: string
  addedNodeIds: string[]
  addedEdgeIds: string[]
  skippedNodeIds: string[]
  skippedEdgeIds: string[]
  totalNodes: number
  totalEdges: number
}

export interface GraphMutationResult {
  graph: GraphContract
  node: GraphNode | null
  category: NodeType | null
  removedEdgeCount: number
}

function isGraphContract(value: unknown): value is GraphContract {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<GraphContract>
  return (
    typeof candidate.schemaVersion === 'string' &&
    Array.isArray(candidate.nodes) &&
    Array.isArray(candidate.edges)
  )
}

function normalizeGraph(value: GraphContract): GraphContract {
  return {
    schemaVersion: value.schemaVersion,
    nodes: value.nodes,
    edges: value.edges,
    errors: Array.isArray(value.errors) ? value.errors : [],
  }
}

export function isNodeArchived(node: GraphNode): boolean {
  return Boolean(node.metadata?.['archived'] === true || node.metadata?.['archivedAt'])
}

function updateNodeMetadata(node: GraphNode, updates: Record<string, unknown>): GraphNode {
  return {
    ...node,
    metadata: {
      ...(node.metadata ?? {}),
      ...updates,
    },
  }
}

async function readSharedGraph(): Promise<GraphContract | null> {
  try {
    const raw = await readFile(SHARED_GRAPH_PATH, 'utf-8')
    const parsed = JSON.parse(raw) as unknown
    if (!isGraphContract(parsed)) {
      return null
    }
    return normalizeGraph(parsed)
  } catch {
    return null
  }
}

async function readExampleDatasetGraph(): Promise<GraphContract | null> {
  try {
    const raw = await readFile(EXAMPLE_DATASET_PATH, 'utf-8')
    const dataset = JSON.parse(raw) as { graph?: unknown }
    if (!isGraphContract(dataset.graph)) {
      return null
    }
    return normalizeGraph(dataset.graph)
  } catch {
    return null
  }
}

export async function loadCurrentGraphContract(): Promise<GraphContract | null> {
  const sharedGraph = await readSharedGraph()
  if (sharedGraph) {
    return sharedGraph
  }

  return readExampleDatasetGraph()
}

export async function persistCurrentGraphContract(contract: GraphContract): Promise<void> {
  const normalized = normalizeGraph(contract)
  await writeFile(SHARED_GRAPH_PATH, `${JSON.stringify(normalized, null, 2)}\n`, 'utf-8')
}

export async function loadLatestImportReport(): Promise<GraphImportReport | null> {
  try {
    const raw = await readFile(IMPORT_REPORT_PATH, 'utf-8')
    const parsed = JSON.parse(raw) as GraphImportReport
    if (!parsed || typeof parsed !== 'object' || typeof parsed.timestamp !== 'string') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export async function persistLatestImportReport(report: GraphImportReport): Promise<void> {
  await writeFile(IMPORT_REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf-8')
}

export async function archiveNodeById(nodeId: string): Promise<GraphMutationResult | null> {
  const graph = await loadCurrentGraphContract()
  if (!graph) {
    return null
  }

  const target = graph.nodes.find((node) => node.id === nodeId)
  if (!target) {
    return null
  }

  const updatedNodes = graph.nodes.map((node) =>
    node.id === nodeId
      ? updateNodeMetadata(node, {
          archived: true,
          archivedAt: new Date().toISOString(),
        })
      : node
  )

  const updatedNode = updatedNodes.find((node) => node.id === nodeId) ?? null
  const updatedGraph: GraphContract = { ...graph, nodes: updatedNodes }
  await persistCurrentGraphContract(updatedGraph)

  return {
    graph: updatedGraph,
    node: updatedNode,
    category: updatedNode?.type ?? null,
    removedEdgeCount: 0,
  }
}

export async function restoreNodeById(nodeId: string): Promise<GraphMutationResult | null> {
  const graph = await loadCurrentGraphContract()
  if (!graph) {
    return null
  }

  const target = graph.nodes.find((node) => node.id === nodeId)
  if (!target) {
    return null
  }

  const updatedNodes = graph.nodes.map((node) => {
    if (node.id !== nodeId) {
      return node
    }

    const metadata = { ...(node.metadata ?? {}) }
    delete metadata['archived']
    delete metadata['archivedAt']

    return {
      ...node,
      metadata,
    }
  })

  const updatedNode = updatedNodes.find((node) => node.id === nodeId) ?? null
  const updatedGraph: GraphContract = { ...graph, nodes: updatedNodes }
  await persistCurrentGraphContract(updatedGraph)

  return {
    graph: updatedGraph,
    node: updatedNode,
    category: updatedNode?.type ?? null,
    removedEdgeCount: 0,
  }
}

export async function purgeNodeById(nodeId: string): Promise<GraphMutationResult | null> {
  const graph = await loadCurrentGraphContract()
  if (!graph) {
    return null
  }

  const target = graph.nodes.find((node) => node.id === nodeId)
  if (!target) {
    return null
  }

  const nextNodes = graph.nodes.filter((node) => node.id !== nodeId)
  const nextEdges = graph.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
  const updatedGraph: GraphContract = {
    ...graph,
    nodes: nextNodes,
    edges: nextEdges,
  }

  await persistCurrentGraphContract(updatedGraph)

  return {
    graph: updatedGraph,
    node: target,
    category: target.type,
    removedEdgeCount: graph.edges.length - nextEdges.length,
  }
}

export function getNodeCategoryPath(type: NodeType): string {
  switch (type) {
    case 'application':
      return '/applications'
    case 'service':
    case 'external':
      return '/services'
    case 'server':
      return '/servers'
    case 'container':
      return '/containers'
    default:
      return '/graph'
  }
}

export function isArchivedInteraction(edge: GraphEdge, graph: GraphContract): boolean {
  const source = graph.nodes.find((node) => node.id === edge.source)
  const target = graph.nodes.find((node) => node.id === edge.target)
  return Boolean((source && isNodeArchived(source)) || (target && isNodeArchived(target)))
}
