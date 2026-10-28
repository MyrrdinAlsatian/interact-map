# Quickstart

## Prerequisites
- Node.js >=24.6.0
- npm 10+
- No database installation is required for the default SQLite setup.
- PostgreSQL is optional; configure `DB_CONNECTION=postgres` and the `DB_*` connection variables to use it.

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

The `predev` script applies pending migrations before starting the development server. Without those migrations, SQLite has no `application_states` table and graph reads fail. For production startup, apply migrations explicitly with `node ace migration:run --force` before launching the server.

## 4. Verify hypermedia baseline and progressive enhancement

**US1 Manual Verification Steps:**

### 4a. Development authentication bypass
- With `NODE_ENV=development`, open `/`, `/applications`, and `/graph` without signing in; each page should be accessible.
- Open `/login` and `/register`; both should redirect to `/`.
- Confirm the top bar does not display a sign-out control.
- Confirm role-gated development actions work and audit records use actor `dev-user` with role `admin`.

Session login and logout remain active outside development.

### 4b. No-JS baseline (disable JavaScript in browser DevTools)
- Navigate to `http://localhost:3333/applications` → full HTML inventory page renders (status 200, Content-Type text/html).
- Navigate to `http://localhost:3333/services`, `/servers`, `/containers`, `/interactions` → each returns a full HTML page without JS.
- Verify all navigation links are plain `<a href>` elements that work without Unpoly.

### 4c. Unpoly fragment updates (JavaScript enabled)
- Load `http://localhost:3333/applications` with Unpoly active.
- Click a nav link (e.g. Services) → verify Unpoly intercepts and updates only `#inventory-table` (no full reload). Check browser network tab for `X-Up-Target` header.
- Perform at least 3 different fragment navigations; confirm each completes without full-page reload.

### 4d. Missing fragment 422 fallback
- Request `GET http://localhost:3333/fragments/unknown-target`
- Expected response: `HTTP 422`, body:
  ```json
  {
    "error": { "code": "FRAGMENT_NOT_FOUND", "severity": "error", "message": "..." },
    "fallbackNavigation": "full_page"
  }
  ```
- Verify client behavior: after receiving `422`, the browser performs a full-page `GET` to the originating target URL.
- If Unpoly is not active, verify the raw `422` JSON is returned and no fragment HTML is rendered.

### 4e. Known fragment resolution
- Request `GET http://localhost:3333/fragments/inventory-applications` → returns HTTP 200 with valid HTML partial.

### 4f. Accessibility baseline checks (FR-015)
- Use keyboard-only navigation on `/applications`: Tab order reaches all primary nav links, and Enter activates navigation.
- Verify skip link is visible on focus and moves focus to `#main-content`.
- Verify visible focus ring appears on links, inputs, selects, buttons, and textarea controls.
- Verify inventory and graph pages expose semantic landmarks (`header`, `nav`, `main`, labeled regions).

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
- Repeat with `schemaVersion: "0.8"` (current-2) → expect HTTP 422 with `ContractError` code `VERSION_UNSUPPORTED`.

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
- Call `POST /graph/simulate-incident` with `{ "projectId": "acme", "failedNodeId": "app-orders", "traversal": "bfs" }` as an editor-role user → expect HTTP 200.
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

## 6. Historical validation run (T055 + remediation)

This run predates the Node.js 24.6 runtime requirement and SQLite graph/audit persistence. Its results are retained as historical evidence and do not validate the current backend.

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

Result: success (dependencies installed).

### 6b. Backend quality gate

Command:

```bash
npm run lint && npm run typecheck && npm test
```

Result: success.

Observed summary:

```text
lint       PASS
typecheck  PASS
tests      PASS (3/3)
```

Remediation applied in backend toolchain:
- Replaced ESLint and Prettier with Oxlint and Oxfmt, preserving the Adonis formatting conventions. Oxfmt does not yet support Edge.js templates, so `resources/views/**/*.edge` is excluded from format checks.
- Removed incompatible `ignoreDeprecations` compiler option from `tsconfig.json`.
- Updated test script to run TypeScript tests through `tsx` loader.
- Added ambient declaration for `@ioc:Adonis/Core/Route` to satisfy typecheck.

### 6c. Auth/RBAC/Audit and observability verification checklist

- Auth baseline implemented with an HTTP-only session cookie: public routes include `GET /health`, `GET/POST /login`, `GET /register`, and `POST /users/register`; application pages and APIs require authentication.
- RBAC baseline implemented: `editor` role gates standard writes/imports, `security` role gates audit/observability oversight, `admin` retains privileged operations.
- Audit access implemented at `GET /audit/logs` for `security+` role policy.
- Audit write hooks implemented in graph validation, incident simulation, and parser ingestion controllers.
- Audit write hooks implemented for `POST /users/register` and `POST /uploads`.
- Metrics endpoint implemented at `GET /observability/metrics`.

### 6d. Capability-island metrics verification (T059)

1. Open `/graph` and attach an event listener in DevTools:
  ```js
  document.addEventListener('observability-metric', (e) => console.log('metric', e.detail))
  ```
2. Trigger graph render by reloading page; verify event `name: "graph.render_duration_ms"` appears.
3. Call `architectureGraph.loadGraph({ schemaVersion: '0.1', nodes: [], edges: [] })`; verify event `name: "graph.contract_validation_error_count"` appears.
4. Mount `<parser-island>` and parse valid input; verify `name: "parser.parse_duration_ms"` appears with success metadata.
5. Parse invalid schema version (`0.1`); verify `name: "parser.contract_validation_error_count"` appears.

Expected metric trigger semantics:
- `request_latency_ms`: emitted for every HTTP response, value in milliseconds.
- `fragment_error_count`: increments for each missing-fragment `422` response.
- `parse_error_count`: increments for each parser validation failure.

### 6e. Full write/mutate audit verification (T062)

Validate all write/mutate endpoints produce audit records:

- `POST /users/register` → `action: users.register`
- `POST /graph/contract/validate` → `action: graph.contract.validate`
- `POST /graph/simulate-incident` → `action: graph.simulate-incident`
- `POST /parser/ingest` → `action: parser.ingest`
- `POST /uploads` → `action: uploads.store`

After exercising each endpoint, query `GET /audit/logs` (security+) and confirm each action appears with expected outcome.

## 7. Current validation status

Checked on 2026-10-28. `nvm use` selected Node.js 24.15.0 and npm 11.12.1 from `backend/.nvmrc`, satisfying the runtime requirement. Standard `npm ci` reaches dependency installation but fails while running the `esbuild` lifecycle script (`EPERM` when spawning its binary). `npm ci --ignore-scripts` installed all 436 packages; smoke checks confirmed `oxlint`, `esbuild`, and `better-sqlite3` are usable.

Test results in this environment:
- Unit suite: 10 passed using `node --import=tsx bin/test.ts unit`.
- Functional suite: blocked during setup after SQLite migrations because opening `127.0.0.1:3334` fails with `EPERM`.
- Standard `npm test`: blocked before running suites because the runner's `get-port` dependency cannot query network interfaces (`uv_interface_addresses` system error).
- `npm run lint` and `npm run typecheck` have not yet been run.

The SQLite persistence tests are part of the functional suite and therefore remain unverified here.

## 8. Architecture verification checklist
- Domain layer has no direct framework dependencies.
- Infrastructure layer adapts framework/runtime concerns.
- Canonical graph contract remains independent from AntV X6 structures.
