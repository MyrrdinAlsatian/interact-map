# Web Component Contracts

## architecture-graph

### Input contract
- Property: `data` (GraphModel)
- Method: `loadGraph(graphModel: GraphModel)`

### Interaction contract
- Method: `focusNode(nodeId: string)`
- Method: `highlightDependencies(nodeId: string)`
- Method: `simulateIncident(nodeId: string, mode?: 'bfs' | 'dfs')`

### Output contract
- Event: `incident-simulated`
  - `detail.failedNodeId: string`
  - `detail.traversal: 'bfs' | 'dfs'`
  - `detail.impactedNodes: string[]`
  - `detail.impactedEdges: string[]`

## parser-island (custom parser)

### Input contract
- Property: `sourceType: string`
- Method: `parse(payload: unknown)`

### Output contract
- Success: `{ nodes: GraphNode[], edges: GraphEdge[], errors: [], warnings: [] }`
- Failure: `{ nodes: [], edges: [], errors: ParseError[], warnings: ParseWarning[] }`

## Compatibility constraints
- Components must be framework-agnostic and mountable in server-rendered HTML.
- Components must not require SPA router state.
