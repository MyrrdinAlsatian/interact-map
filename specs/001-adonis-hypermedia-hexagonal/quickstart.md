# Quickstart

## Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL (for runtime integration phase)

## 1. Install backend dependencies
```bash
cd backend
npm install
```

## 2. Run quality checks
```bash
npm run lint
npm run typecheck
npm test
```

## 3. Start backend (scaffold mode)
```bash
npm run dev
```

## 4. Verify hypermedia baseline and progressive enhancement

**US1 Manual Verification Steps:**

### 4a. No-JS baseline (disable JavaScript in browser DevTools)
- Navigate to `http://localhost:3333/applications` → full HTML inventory page renders (status 200, Content-Type text/html).
- Navigate to `http://localhost:3333/services`, `/servers`, `/containers`, `/interactions` → each returns a full HTML page without JS.
- Verify all navigation links are plain `<a href>` elements that work without Unpoly.

### 4b. Unpoly fragment updates (JavaScript enabled)
- Load `http://localhost:3333/applications` with Unpoly active.
- Click a nav link (e.g. Services) → verify Unpoly intercepts and updates only `#inventory-table` (no full reload). Check browser network tab for `X-Up-Target` header.
- Perform at least 3 different fragment navigations; confirm each completes without full-page reload.

### 4c. Missing fragment 422 fallback
- Request `GET http://localhost:3333/fragments/unknown-target`
- Expected response: `HTTP 422`, body:
  ```json
  {
    "error": { "code": "FRAGMENT_NOT_FOUND", "severity": "error", "message": "..." },
    "fallbackNavigation": "full_page"
  }
  ```
- Verify Unpoly falls back to a full-page navigation (or the raw 422 JSON is returned if Unpoly is not active).

### 4d. Known fragment resolution
- Request `GET http://localhost:3333/fragments/inventory-applications` → returns HTTP 200 with valid HTML partial.

## 5. Verify capability islands and contract policy

### US2 — Graph capability island

**US2 Independent Verification Checklist:**

#### 5a. Graph component renders in under 2 seconds
- Load `http://localhost:3333/graph` in the browser.
- Open DevTools Performance tab, record while page loads.
- Confirm `architecture-graph` renders all 7 sample nodes and 5 edges in ≤2s.

#### 5b. Schema version acceptance/rejection
- Call `POST /graph/contract/validate` with `{ "schemaVersion": "1.0", "nodes": [...], "edges": [], "errors": [] }` → expect HTTP 200 `{ valid: true }`.
- Repeat with `schemaVersion: "0.9"` → expect HTTP 200 (previous version accepted).
- Repeat with `schemaVersion: "0.1"` → expect HTTP 422 with `ContractError` code `VERSION_UNSUPPORTED`.

#### 5c. Component fires `contract-validation-error` for invalid contracts
- In browser console: `document.getElementById('architectureGraph').loadGraph({ schemaVersion: '0.1', nodes: [], edges: [] })`.
- Verify `contract-validation-error` event fires with `{ errors: [{ code: 'VERSION_UNSUPPORTED' }] }`.

#### 5d. Graph interactions (zoom, pan, node focus, edge highlight)
- `architecture-graph.focusNode('app-orders')` → graph centers on that node.
- `architecture-graph.highlightDependencies('app-orders')` → connected edges visually emphasized.
- Zoom/pan with mouse wheel and drag — verify X6 responds correctly.

#### 5e. Incident simulation (BFS and DFS)
- `architecture-graph.simulateIncident('app-orders', 'bfs')` → impacted downstream nodes highlighted in orange, failed node in red.
- `architecture-graph.simulateIncident('app-orders', 'dfs')` → same result (different traversal order).
- Verify `incident-simulated` event contains `{ failedNodeId, traversal, impactedNodes, impactedEdges }`.
- Call `POST /graph/simulate-incident` with `{ "projectId": "acme", "failedNodeId": "app-orders", "traversal": "bfs" }` as an analyst-role user → expect HTTP 200.
- Repeat as a viewer-role user → expect HTTP 403.

---

### US3 — Parser capability island

**US3 Independent Verification Checklist:**

#### 5f. Current schema version (1.0)
- Mount `<parser-island>` in the browser (or load `index.html`).
- Call `parserIslandEl.parse({ sourceType: 'docker-ps', schemaVersion: '1.0', payload: '[{"Names":"web","Image":"nginx","State":"running"}]' })`.
- Expect: `parse-success` event fires, result has 1 node, 0 errors.

#### 5g. Previous schema version (0.9) — warning, not error
- Call `parserIslandEl.parse({ sourceType: 'docker-ps', schemaVersion: '0.9', payload: '[{"Names":"web","Image":"nginx","State":"running"}]' })`.
- Expect: `parse-success` event fires with `warnings: [{ code: 'VERSION_PREVIOUS' }]`, result has 1 node.

#### 5h. Older schema version produces structured error
- Call `parserIslandEl.parse({ sourceType: 'docker-ps', schemaVersion: '0.1', payload: '[]' })`.
- Expect: `parse-error` event fires with `errors: [{ code: 'VERSION_UNSUPPORTED' }]`, result has 0 nodes, 0 edges.
- Confirm no exception is thrown.

#### 5i. Malformed payload produces structured error
- Call `parserIslandEl.parse({ sourceType: 'docker-inspect', schemaVersion: '1.0', payload: 'not-JSON' })`.
- Expect: `parse-error` event fires with `errors: [{ code: 'PARSE_EXCEPTION' }]`.

#### 5j. Backend ingestion endpoint
- Use `examples/parser-fixtures.json` fixtures:
  - POST `/parser/ingest` with `valid_docker_compose_v1` → expect HTTP 200 with merged graph.
  - POST `/parser/ingest` with `older_schema_version` → expect HTTP 422 with `errors[VERSION_UNSUPPORTED]`.
  - POST `/parser/ingest` with `parser_result_with_errors` → expect HTTP 422 with `errors[PARSER_RESULT_INVALID]`.
  - POST `/parser/ingest` as viewer-role user → expect HTTP 403.

#### 5k. Deterministic output
- Run the same fixture twice and confirm output is identical (same nodes/edges order, same error codes).

## 6. Full validation run results (T055)

Validation date: 2026-03-13

Environment used for validation:
- OS: Linux
- Node.js: v18.20.5
- npm: 10.8.2

### 6a. Dependency installation

Command:

```bash
cd backend
npm install
```

Result: success (dependencies installed), with engine warnings because AdonisJS packages require Node.js >= 20.6.0.

### 6b. Lint

Command:

```bash
npm run lint
```

Result: failed.

Observed error:

```text
sh: 1: eslint: not found
```

Interpretation: `backend/package.json` defines `"lint": "eslint ."` but `eslint` is not present in `devDependencies`.

### 6c. Typecheck

Command:

```bash
npm run typecheck
```

Result: failed.

Observed error:

```text
tsconfig.json:6:27 - error TS5103: Invalid value for '--ignoreDeprecations'.
```

Interpretation: current TypeScript/runtime toolchain rejects the configured `ignoreDeprecations` value.

### 6d. Unit tests

Command:

```bash
npm test
```

Result: failed (3/3 tests failed to execute).

Observed error:

```text
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts"
```

Interpretation: Node test runner is executing `.ts` tests without a TypeScript test loader/transpilation step in this environment.

### 6e. Auth/RBAC/Audit and observability verification checklist

- Auth baseline implemented: public routes are `GET /health` and `POST /users/register`; all other routes are authenticated.
- RBAC baseline implemented: `requireRole('analyst')` applied to write/mutate endpoints.
- Admin-only audit access implemented at `GET /audit/logs` (route policy + inline controller guard).
- Audit write hooks implemented in graph validation, incident simulation, and parser ingestion controllers.
- Metrics endpoint implemented at `GET /observability/metrics`.

Note: endpoint runtime checks were not executed in this run due the Node.js 18 vs required Node.js >= 20.6.0 mismatch.

## 7. Architecture verification checklist
- Domain layer has no direct framework dependencies.
- Infrastructure layer adapts framework/runtime concerns.
- Canonical graph contract remains independent from AntV X6 structures.
