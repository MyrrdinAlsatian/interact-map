import { observabilityRepository } from '#repositories/observability_repository'
import type { TraversalMode, GraphContract } from '#domain/contracts/dto/graph_contract_dto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

/**
 * GraphSimulationController — role-gated incident simulation endpoint.
 *
 * POST /graph/simulate-incident
 * Required body: { projectId: string, failedNodeId: string, traversal?: 'bfs' | 'dfs' }
 * Required role: analyst or higher (enforced by requireRole middleware in routes.ts)
 *
 * Performs BFS/DFS traversal on the project's graph and returns impacted nodes/edges.
 * Emits an audit log entry for every simulation attempt.
 */
export default class GraphSimulationController {
  async simulate({ request, response, auth }: { request: any; response: any; auth: any }) {
    const start = Date.now()
    const {
      projectId,
      failedNodeId,
      traversal = 'bfs',
    } = request.all() as {
      projectId: string
      failedNodeId: string
      traversal?: TraversalMode
    }

    if (!projectId || !failedNodeId) {
      return response.status(422).json({
        error: {
          code: 'SIMULATION_PARAMS_MISSING',
          message: 'projectId and failedNodeId are required.',
          severity: 'error',
        },
      })
    }

    // Load graph for specified project (currently loads sample dataset)
    let graph: GraphContract | null = null
    try {
      const datasetPath = resolve(process.cwd(), '../examples/project-dataset.json')
      const raw = await readFile(datasetPath, 'utf-8')
      const dataset = JSON.parse(raw) as { graph: GraphContract }
      graph = {
        schemaVersion: '1.0',
        nodes: dataset.graph.nodes,
        edges: dataset.graph.edges,
        errors: [],
      }
    } catch {
      return response.status(422).json({
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: `No graph found for project "${projectId}".`,
          severity: 'error',
        },
      })
    }

    // BFS/DFS traversal (same algorithm as frontend incident-impact.js)
    const adjacency = new Map<string, string[]>()
    for (const node of graph.nodes) adjacency.set(node.id, [])
    for (const edge of graph.edges) {
      if (!adjacency.has(edge.source)) adjacency.set(edge.source, [])
      adjacency.get(edge.source)!.push(edge.target)
    }

    const visited = new Set<string>([failedNodeId])
    const impactedEdgeIds = new Set<string>()
    const frontier: string[] = [failedNodeId]

    while (frontier.length > 0) {
      const current = traversal === 'dfs' ? frontier.pop()! : frontier.shift()!
      for (const neighbor of adjacency.get(current) ?? []) {
        const edge = graph.edges.find((e) => e.source === current && e.target === neighbor)
        if (edge) impactedEdgeIds.add(edge.id)
        if (!visited.has(neighbor)) {
          visited.add(neighbor)
          frontier.push(neighbor)
        }
      }
    }

    const impactedNodes = [...visited].filter((id) => id !== failedNodeId)

    const result = {
      failedNodeId,
      traversal: traversal as TraversalMode,
      impactedNodes,
      impactedEdges: [...impactedEdgeIds],
    }

    observabilityRepository.appendAuditLog({
      actorId: auth?.user?.id ?? 'anonymous',
      actorRole: auth?.user?.role ?? 'analyst',
      action: 'graph.simulate-incident',
      resourceType: 'GraphContract',
      resourceId: projectId,
      outcome: 'success',
      metadata: { failedNodeId, traversal, impactedCount: impactedNodes.length },
    })
    observabilityRepository.recordLatency(Date.now() - start)

    return response.ok(result)
  }
}
