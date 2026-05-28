# Interactive Map

System Architecture Mapping Platform — hypermedia-first, progressive enhancement, Docker infrastructure import.

## Run

Serve the folder with a static server and open `index.html`:

- `npx serve .`
- or any equivalent static server

## Backend Runtime

The backend requires Node.js `>=24.6.0` and npm `>=10.0.0`.

Recommended workflow:

```sh
cd backend
nvm use
npm install
npm run dev    # HMR dev server on :3333
npm run build  # production build
npm test       # run Japa test suite
```

Enforcement:

- `backend/package.json` defines `engines.node` and `engines.npm`
- `backend/.npmrc` sets `engine-strict=true` so unsupported versions fail early

## Delivered Outputs

### Infrastructure

- SQL schema: `database/schema.sql`
- Shared graph state: `shared/current-graph.json`
- Latest import report: `shared/latest-import-report.json`
- Example dataset: `examples/project-dataset.json`
- HTTP fixture (REST Client): `examples/interact-map.http`
- Problemes rencontres + solutions: `docs/problems-and-solutions.md`

### Backend — AdonisJS Hexagonal

- Full backend scaffold: `backend/`
- Architecture overview: `backend/ARCHITECTURE.md`
- Graph store service (load/persist/archive/purge): `backend/src/infrastructure/services/graph_store_service.ts`
- Server-side upload parser (docker-compose/inspect/ps): `backend/src/infrastructure/services/upload_parser_service.ts`
- Import report with fine-grained field diff: `backend/src/infrastructure/services/graph_store_service.ts` → `createImportReport()`

### Backend — Endpoints

| Endpoint | Role | Description |
|---|---|---|
| `GET /` | viewer+ | Dashboard with import form and last diff summary |
| `GET /applications` | viewer+ | Application inventory with search (`?q=`) |
| `GET /services` | viewer+ | Service inventory |
| `GET /servers` | viewer+ | Server inventory |
| `GET /containers` | viewer+ | Container inventory |
| `GET /interactions` | viewer+ | Edge inventory |
| `GET /graph` | viewer+ | Architecture graph capability island |
| `GET /nodes/:id` | viewer+ | Node detail page (metadata, deps, interactions) |
| `POST /nodes/:id/archive` | viewer+ | Soft-archive a node |
| `POST /nodes/:id/restore` | viewer+ | Restore an archived node |
| `POST /nodes/:id/purge` | viewer+ | Permanently remove node and its edges |
| `POST /uploads` | viewer+ | Parse + merge + persist (multipart or JSON body) |
| `POST /parser/ingest` | editor+ | Ingest a pre-built `ParserResult` |
| `GET /imports/latest` | viewer+ | Latest import diff page |
| `GET /fragments/:target` | viewer+ | Unpoly fragment resolver |
| `GET /observability/metrics` | security+ | Core metrics |
| `GET /audit/logs` | security+ | Audit log |

### Upload / Ingest Parameters

Both `/uploads` and `/parser/ingest` accept:

| Parameter | Type | Default | Values |
|---|---|---|---|
| `sourceType` | string | auto-detect | `docker-compose`, `docker-inspect`, `docker-ps` |
| `schemaVersion` | string | `1.0` | — |
| `mergeStrategy` | string | `skip` | `skip`, `update`, `archive-missing` |
| `dryRun` | boolean | `false` | `true` / `false` — preview only, no persistence |

`/uploads` also accepts a `file` field in `multipart/form-data`.

### Frontend — Capability Islands

- Graph Web Component: `frontend/components/architecture-graph.js`
- Parser island: `frontend/components/parser-island.js`
- X6 adapter: `frontend/lib/x6-adapter.js`
- Docker parsers (client-side):
  - `frontend/lib/docker-compose-parser.js`
  - `frontend/lib/docker-inspect-parser.js`
  - `frontend/lib/docker-ps-parser.js`
- Incident impact algorithm: `frontend/lib/incident-impact.js`
- Offline store (IndexedDB/Dexie): `frontend/lib/offline-store.js`

## Governance

Project governance and delivery rules are defined in `.specify/memory/constitution.md`.
