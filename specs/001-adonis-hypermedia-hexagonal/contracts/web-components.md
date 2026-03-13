# Web Component Contracts

## architecture-graph

**Element**: `<architecture-graph>`
**File**: `frontend/components/architecture-graph.js`

### Input contract
- Property: `data` (`GraphContract`) — sets and validates on assignment
- Method: `loadGraph(contract: GraphContract)` — delegates to `data` setter

`GraphContract` shape:

```json
{
  "schemaVersion": "1.0",
  "nodes": [{ "id": "string", "type": "application|service|container|server|external", "label": "string", "metadata": {} }],
  "edges": [{ "id": "string", "source": "string", "target": "string", "criticality": "critical|high|medium|low", "dependencyType": "required|optional|async|cache", "protocol": "string" }],
  "errors": []
}
```

**Schema version policy**: `'1.0'` (current) and `'0.9'` (previous) accepted. Older versions dispatch `contract-validation-error` and abort rendering — no exception is thrown.

### Interaction contract
- Method: `focusNode(nodeId: string)` — centers and selects node
- Method: `highlightDependencies(nodeId: string)` — visually emphasizes connected edges
- Method: `simulateIncident(nodeId: string, mode?: 'bfs' | 'dfs') → IncidentSimulationResult` — runs BFS/DFS and highlights affected cells

### Output events
| Event | When | `detail` shape |
|---|---|---|
| `contract-validation-error` | Invalid or unsupported contract passed to `loadGraph` | `{ errors: ContractError[] }` |
| `incident-simulated` | After `simulateIncident()` completes | `{ failedNodeId, traversal, impactedNodes: string[], impactedEdges: string[] }` |

---

## parser-island

**Element**: `<parser-island>`
**File**: `frontend/components/parser-island.js`

### Input contract
- Method: `parse(input: ParserInput) → ParserResult`
  - `input.sourceType` — `'docker-compose' | 'docker-inspect' | 'docker-ps'`
  - `input.schemaVersion` — version string
  - `input.payload` — raw input string/object

### Output contract
- **Success**: `{ schemaVersion, nodes: GraphNode[], edges: GraphEdge[], errors: [], warnings: ContractError[] }`
- **Failure**: `{ schemaVersion, nodes: [], edges: [], errors: ContractError[], warnings: ContractError[] }`

**Important**: `parse()` NEVER throws — all structural and version errors are returned in `errors[]`.

### Schema version compatibility policy
| Version | Behavior |
|---|---|
| `'1.0'` (current) | Fully supported |
| `'0.9'` (previous) | Supported; `VERSION_PREVIOUS` warning emitted in `warnings[]` |
| Anything older | `VERSION_UNSUPPORTED` error in `errors[]`; empty `nodes[]` and `edges[]` returned |

### Output events
| Event | When | `detail` shape |
|---|---|---|
| `parse-success` | Parsing produced valid normalized result | `ParserResult` |
| `parse-error` | Validation or normalization failed | `{ errors: ContractError[], warnings: ContractError[] }` |

### Error format (`ContractError`)
```json
{
  "code": "VERSION_UNSUPPORTED",
  "message": "Human-readable description",
  "path": "schemaVersion",
  "severity": "error | warning"
}
```

---

## Compatibility constraints
- Both components are framework-agnostic Custom Elements v1. No SPA framework required.
- Components must be mountable in server-rendered HTML without a JavaScript bundler.
- Components must degrade gracefully: if not defined (JS disabled), their inner HTML content (or absence) does not break page layout.
- `ContractError` codes are stable identifiers — client error handlers may switch/match on `code`.

