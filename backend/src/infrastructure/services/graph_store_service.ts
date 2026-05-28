import type { GraphContract } from '#domain/contracts/dto/graph_contract_dto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const SHARED_GRAPH_PATH = resolve(process.cwd(), '../shared/current-graph.json')
const EXAMPLE_DATASET_PATH = resolve(process.cwd(), '../examples/project-dataset.json')

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
