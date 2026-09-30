import assert from 'node:assert/strict'
import { test } from '@japa/runner'
import type { GraphContract } from '#domain/contracts/dto/graph_contract_dto'
import type { GraphImportReport } from '#infrastructure/services/graph_store_service'
import {
  loadCurrentGraphContract,
  loadLatestImportReport,
  persistImportState,
} from '#infrastructure/services/graph_store_service'

test('persists the graph and import report in SQLite', async () => {
  const graph: GraphContract = {
    schemaVersion: '1.0',
    nodes: [{ id: 'sqlite-test-node', type: 'application', label: 'SQLite Test' }],
    edges: [],
    errors: [],
  }
  const report: GraphImportReport = {
    timestamp: new Date().toISOString(),
    sourceType: 'sqlite-test',
    mergeStrategy: 'skip',
    addedNodeIds: ['sqlite-test-node'],
    addedEdgeIds: [],
    skippedNodeIds: [],
    skippedEdgeIds: [],
    archivedNodeIds: [],
    modifiedNodes: [],
    modifiedEdges: [],
    totalNodes: 1,
    totalEdges: 0,
  }

  await persistImportState(graph, report)

  assert.deepEqual(await loadCurrentGraphContract(), graph)
  assert.deepEqual(await loadLatestImportReport(), report)
})
