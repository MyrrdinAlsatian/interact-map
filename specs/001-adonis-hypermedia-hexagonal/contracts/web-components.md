# Web Component Contracts

## architecture-graph

### Input contract
- Property: `data` (`GraphContract`)
- Method: `loadGraph(contract: GraphContract)`

`GraphContract` shape:

```json
{
  "schemaVersion": "1.0",
  "nodes": [],
  "edges": [],
  "errors": []
}
```

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
- Method: `parse(payload: unknown, schemaVersion: string)`

### Output contract
- Success: `{ schemaVersion, nodes: GraphNode[], edges: GraphEdge[], errors: [], warnings: [] }`
- Failure: `{ schemaVersion, nodes: [], edges: [], errors: ParseError[], warnings: ParseWarning[] }`

### Compatibility policy
- Supported `schemaVersion`: current and previous.
- Older versions must produce structured compatibility errors (no unhandled exceptions).

### Error contract
- `ParseError = { code: string, message: string, path?: string, severity: 'error' | 'warning' }`
- Missing fragment/invalid contract errors are surfaced with structured payloads compatible with server `422` envelopes.

## Compatibility constraints
- Components must be framework-agnostic and mountable in server-rendered HTML.
- Components must not require SPA router state.
