# Frontend Architecture

## Rendering Strategy
- Server renders pages for all primary flows.
- Unpoly enhances links/forms with partial replacement targets.
- Web Components encapsulate complex interactions as capability islands.

## Pages
- `/applications`
- `/services`
- `/servers`
- `/containers`
- `/interactions`
- `/graph`

## Capability Islands
- `architecture-graph`
  - Input: framework-agnostic graph JSON (`nodes`, `edges`).
  - Features: zoom, pan, selection, dependency highlight, incident impact overlays.
- Future islands can be added without converting app into SPA.

## Data Contracts
Graph model (framework-agnostic):

```json
{
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
  ]
}
```

## Offline Layer
- IndexedDB stores projects, graph snapshots, and imported source files.
- Export/import format preserves project state for disconnected analysis.

## Security Notes
- Sensitive project bundles may be encrypted client-side before persistence/export.
- Client crypto key derivation and wrapping strategy must align with backend key management.
