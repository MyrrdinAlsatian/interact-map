# Frontend Architecture

## Rendering Strategy
- Server renders pages for all primary flows.
- Unpoly enhances links/forms with partial replacement targets.
- Web Components encapsulate complex interactions as capability islands.

## Pages
- `/` — Dashboard: import form (file or inline payload, merge strategy, dry-run), latest diff summary widget
- `/applications` — Application inventory with search (`?q=`), archived badges, archive/restore/purge actions
- `/services` — Service inventory (same features)
- `/servers` — Server inventory (same features)
- `/containers` — Container inventory (same features)
- `/interactions` — Edge inventory
- `/graph` — Architecture graph capability island
- `/nodes/:id` — Node detail page: metadata table, inbound/outbound dependencies, related interactions, lifecycle actions (archive, restore, purge)
- `/imports/latest` — Latest import diff page: stat cards, per-node/edge field-level changes table (path, before, after, applied)

## Capability Islands
- `architecture-graph`
  - Input: `GraphContract` (`schemaVersion`, `nodes`, `edges`, `errors`).
  - `set data(value)` — triggers `validateGraphContract(value)` before rendering.
  - On validation failure, fires `contract-validation-error` event (`detail.errors: ContractError[]`) and aborts render.
  - Features: zoom, pan, selection, dependency highlight, incident impact overlays.
  - Emits `observability-metric` events for:
    - `graph.render_duration_ms`
    - `graph.contract_validation_error_count`
- `parser-island`
  - `parse(input: ParserInput)` — validates input, runs selected parser, returns `ParserResult`.
  - Dispatches `parse-success` (`detail: ParserResult`) or `parse-error` (`detail: { errors: ContractError[] }`).
  - Renders own UI shell: textarea, source type select, parse button, output display.
  - Emits `observability-metric` events for:
    - `parser.parse_duration_ms`
    - `parser.contract_validation_error_count`
- Future islands can be added without converting app into SPA.

## Contract Version Policy

Both frontend libraries and backend use cases enforce the same schema version policy:

| Version | Status | Treatment |
|---------|--------|-----------|
| `"1.0"` | Current | Valid, no warnings |
| `"0.9"` | Previous | Valid with `ContractError` severity `warning` code `VERSION_PREVIOUS` |
| Any other / missing | Unsupported | Rejected — `ContractError` severity `error` code `VERSION_UNSUPPORTED` |

`SUPPORTED_SCHEMA_VERSIONS = ['1.0', '0.9']` is the canonical list, defined in both:
- `backend/src/domain/contracts/dto/graph_contract_dto.ts`
- `frontend/lib/graph-model.js` and `frontend/lib/parser-contract.js`

## Data Contracts

Graph contract (feature 001 schema):

```json
{
  "schemaVersion": "1.0",
  "nodes": [
    {
      "id": "node-id",
      "type": "application|service|server|container|external",
      "label": "Display name",
      "metadata": {}
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "source-node-id",
      "target": "target-node-id",
      "criticality": "critical|high|medium|low",
      "dependencyType": "required|optional|async|cache",
      "protocol": "http|tcp|..."
    }
  ],
  "errors": []
}
```

Parser result contract:

```json
{
  "schemaVersion": "1.0",
  "sourceType": "docker-compose|docker-inspect|docker-ps",
  "nodes": [],
  "edges": [],
  "errors": [],
  "warnings": []
}
```

## CSS Utility Classes (layout.edge)

| Class | Purpose |
|---|---|
| `.btn-secondary` | Secondary action button |
| `.btn-warning` | Warning / archive action button |
| `.btn-danger` | Danger / purge action button |
| `.input` | Text input field |
| `.form-row` | Horizontal form field row |
| `.form-row-stack` | Vertical (stacked) form field row |
| `.field-label` | Label for a form field |
| `.action-row` | Row for action buttons |
| `.list-unstyled` | List without default bullets |
| `.diff-block` | Block container for import diff tables |

## Import Chain

```
frontend/lib/parser-contract.js        (shared validator + builder)
   ↳ frontend/lib/docker-compose-parser.js
   ↳ frontend/lib/docker-inspect-parser.js
   ↳ frontend/lib/docker-ps-parser.js
       ↳ frontend/components/parser-island.js  (Web Component consumer)

frontend/lib/graph-model.js            (graph validation)
   ↳ frontend/components/architecture-graph.js  (Web Component consumer)
   ↳ frontend/lib/x6-adapter.js                 (rendering adapter)
   ↳ frontend/lib/incident-impact.js            (traversal)
```

## Component API Summary

### `<architecture-graph>`

| API | Type | Description |
|-----|------|-------------|
| `set data(contract)` | setter | Validate + render GraphContract |
| `loadGraph(contract)` | method | Alias for `data` setter |
| `contract-validation-error` | event | Fired when schema validation fails |
| `node-selected` | event | Fired when user selects a node |
| `observability-metric` | event | Fired on render/error metrics (`name`, `value`, `source`, `timestamp`, `metadata`) |

### `<parser-island>`

| API | Type | Description |
|-----|------|-------------|
| `parse(input)` | method | Validate + parse; returns ParserResult |
| `parse-success` | event | Fired on valid parse result |
| `parse-error` | event | Fired on validation or parse failure |
| `observability-metric` | event | Fired on parse/error metrics (`name`, `value`, `source`, `timestamp`, `metadata`) |

## Frontend Observability Contract

Capability-island metrics are emitted as bubbling DOM events:

```json
{
  "name": "graph.render_duration_ms",
  "value": 12.41,
  "source": "architecture-graph",
  "timestamp": "2026-03-13T10:22:11.300Z",
  "metadata": {
    "nodeCount": 7,
    "edgeCount": 5
  }
}
```

Collection pattern:
- Shell page listens once at document level: `document.addEventListener('observability-metric', handler)`.
- Handler forwards to backend collector endpoint or log pipeline.

## Offline Layer
- IndexedDB stores projects, graph snapshots, and imported source files.
- Export/import format preserves project state for disconnected analysis.

## Security Notes
- Sensitive project bundles may be encrypted client-side before persistence/export.
- Client crypto key derivation and wrapping strategy must align with backend key management.
