import type { GraphContract, GraphEdge, GraphNode, NodeType } from '#domain/contracts/dto/graph_contract_dto'
import type { MergeStrategy } from '#domain/usecases/import_parser_result_usecase'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const SHARED_GRAPH_PATH = resolve(process.cwd(), '../shared/current-graph.json')
const EXAMPLE_DATASET_PATH = resolve(process.cwd(), '../examples/project-dataset.json')
const IMPORT_REPORT_PATH = resolve(process.cwd(), '../shared/latest-import-report.json')

export interface GraphImportReport {
  timestamp: string
  sourceType: string
  mergeStrategy: MergeStrategy
  fileName?: string
  addedNodeIds: string[]
  addedEdgeIds: string[]
  skippedNodeIds: string[]
  skippedEdgeIds: string[]
  archivedNodeIds: string[]
  modifiedNodes: Array<{
    id: string
    before: string
    after: string
    applied: boolean
    changes: Array<{ path: string; before: string; after: string }>
  }>
  modifiedEdges: Array<{
    id: string
    before: string
    after: string
    applied: boolean
    changes: Array<{ path: string; before: string; after: string }>
  }>
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

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys)
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = sortObjectKeys((value as Record<string, unknown>)[key])
        return accumulator
      }, {})
  }

  return value
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortObjectKeys(value), null, 2)
}

function displayValue(value: unknown): string {
  if (value === undefined) {
    return 'undefined'
  }
  return stableStringify(value)
}

function collectDiffChanges(
  before: unknown,
  after: unknown,
  basePath = ''
): Array<{ path: string; before: string; after: string }> {
  const beforeType = Array.isArray(before) ? 'array' : typeof before
  const afterType = Array.isArray(after) ? 'array' : typeof after

  if (beforeType !== afterType) {
    return [
      {
        path: basePath || '$',
        before: displayValue(before),
        after: displayValue(after),
      },
    ]
  }

  if (before === null || after === null || beforeType !== 'object') {
    if (Object.is(before, after)) {
      return []
    }
    return [
      {
        path: basePath || '$',
        before: displayValue(before),
        after: displayValue(after),
      },
    ]
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    const maxLength = Math.max(before.length, after.length)
    const changes: Array<{ path: string; before: string; after: string }> = []
    for (let index = 0; index < maxLength; index++) {
      const path = `${basePath || '$'}[${index}]`
      changes.push(...collectDiffChanges(before[index], after[index], path))
    }
    return changes
  }

  const beforeObject = before as Record<string, unknown>
  const afterObject = after as Record<string, unknown>
  const keys = new Set([...Object.keys(beforeObject), ...Object.keys(afterObject)])
  const changes: Array<{ path: string; before: string; after: string }> = []

  for (const key of keys) {
    const path = basePath ? `${basePath}.${key}` : key
    changes.push(...collectDiffChanges(beforeObject[key], afterObject[key], path))
  }

  return changes
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
    const parsed = JSON.parse(raw) as Partial<GraphImportReport>
    if (!parsed || typeof parsed !== 'object' || typeof parsed.timestamp !== 'string') {
      return null
    }
    return {
      timestamp: parsed.timestamp,
      sourceType: parsed.sourceType ?? 'unknown',
      mergeStrategy: parsed.mergeStrategy ?? 'skip',
      fileName: parsed.fileName,
      addedNodeIds: parsed.addedNodeIds ?? [],
      addedEdgeIds: parsed.addedEdgeIds ?? [],
      skippedNodeIds: parsed.skippedNodeIds ?? [],
      skippedEdgeIds: parsed.skippedEdgeIds ?? [],
      archivedNodeIds: parsed.archivedNodeIds ?? [],
      modifiedNodes: parsed.modifiedNodes ?? [],
      modifiedEdges: parsed.modifiedEdges ?? [],
      totalNodes: parsed.totalNodes ?? 0,
      totalEdges: parsed.totalEdges ?? 0,
    }
  } catch {
    return null
  }
}

export async function persistLatestImportReport(report: GraphImportReport): Promise<void> {
  await writeFile(IMPORT_REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf-8')
}

export function createImportReport(params: {
  base: GraphContract
  incoming: Pick<GraphContract, 'nodes' | 'edges'>
  merged: GraphContract
  sourceType: string
  mergeStrategy: MergeStrategy
  fileName?: string
}): GraphImportReport {
  const { base, incoming, merged, sourceType, mergeStrategy, fileName } = params
  const baseNodesById = new Map(base.nodes.map((node) => [node.id, node]))
  const baseEdgesById = new Map(base.edges.map((edge) => [edge.id, edge]))
  const mergedNodesById = new Map(merged.nodes.map((node) => [node.id, node]))
  const mergedEdgesById = new Map(merged.edges.map((edge) => [edge.id, edge]))

  const addedNodeIds: string[] = []
  const skippedNodeIds: string[] = []
  const modifiedNodes: Array<{
    id: string
    before: string
    after: string
    applied: boolean
    changes: Array<{ path: string; before: string; after: string }>
  }> = []
  for (const node of incoming.nodes) {
    const existing = baseNodesById.get(node.id)
    if (!existing) {
      addedNodeIds.push(node.id)
      continue
    }

    if (stableStringify(existing) === stableStringify(node)) {
      skippedNodeIds.push(node.id)
      continue
    }

    modifiedNodes.push({
      id: node.id,
      before: stableStringify(existing),
      after: stableStringify(node),
      applied: stableStringify(mergedNodesById.get(node.id) ?? null) === stableStringify(node),
      changes: collectDiffChanges(existing, node),
    })
  }

  const addedEdgeIds: string[] = []
  const skippedEdgeIds: string[] = []
  const modifiedEdges: Array<{
    id: string
    before: string
    after: string
    applied: boolean
    changes: Array<{ path: string; before: string; after: string }>
  }> = []
  for (const edge of incoming.edges) {
    const existing = baseEdgesById.get(edge.id)
    if (!existing) {
      addedEdgeIds.push(edge.id)
      continue
    }

    if (stableStringify(existing) === stableStringify(edge)) {
      skippedEdgeIds.push(edge.id)
      continue
    }

    modifiedEdges.push({
      id: edge.id,
      before: stableStringify(existing),
      after: stableStringify(edge),
      applied: stableStringify(mergedEdgesById.get(edge.id) ?? null) === stableStringify(edge),
      changes: collectDiffChanges(existing, edge),
    })
  }

  const archivedNodeIds = merged.nodes
    .filter((node) => isNodeArchived(node))
    .filter((node) => {
      const baseNode = baseNodesById.get(node.id)
      return Boolean(baseNode && !isNodeArchived(baseNode))
    })
    .map((node) => node.id)

  return {
    timestamp: new Date().toISOString(),
    sourceType,
    mergeStrategy,
    fileName,
    addedNodeIds,
    addedEdgeIds,
    skippedNodeIds,
    skippedEdgeIds,
    archivedNodeIds,
    modifiedNodes,
    modifiedEdges,
    totalNodes: merged.nodes.length,
    totalEdges: merged.edges.length,
  }
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
