# Backend Architecture

This backend follows a hexagonal architecture under `src/`.

## Domain Layer (`src/domain/`)

Pure TypeScript — zero framework imports. Holds:

- `models/` — value objects and domain entities (e.g. `User`)
- `contracts/dto/` — canonical data-transfer types shared between domain and infrastructure (`graph_contract_dto.ts`, `parser_contract_dto.ts`, etc.)
- `contracts/repositories/` — repository interfaces (`UserRepository`, `ObservabilityRepository`)
- `usecases/` — application use cases that orchestrate domain logic (e.g. `ValidateGraphContractUseCase`, `ImportParserResultUseCase`)

**Rule**: Nothing in `src/domain/` may import from `src/infrastructure/` or from AdonisJS.

## Infrastructure Layer (`src/infrastructure/`)

AdonisJS-specific adapters. Holds:

- `adonis/` — framework bootstrapping (`kernel.ts` middleware stack, `routes.ts`, `health.ts`, `env.ts`)
- `controllers/` — HTTP request handlers (thin — delegate to use cases)
- `middleware/` — auth guard, role guard, JSON response enforcer
- `repositories/` — concrete repository implementations (e.g. in-memory, Lucid ORM)
- `validators/` — request payload validators

## AdonisJS 7 Runtime and Indexing

The backend targets AdonisJS 7 and requires Node.js `>=24.6.0` (enforced by `package.json`). Its initialization hooks are registered in `adonisrc.ts`:

- `indexEntities()` indexes the configured application directories and generates the Adonis server-side entity indexes used by the app's generated imports and types.
- Tuyau's `generateRegistry()` scans the registered routes and generates the typed API client registry under `.adonisjs/client/registry`. The Tuyau 1.x integration uses this hook and its Ace commands; the previous provider and `config/tuyau.ts` are no longer used.

These files are generated artifacts. Run `node ace codegen` from `backend/` after changing indexed directories or routes; do not edit generated files by hand.

## Local Database

Lucid uses `better-sqlite3` by default in development, tests, and production. Development data is stored in `database/development.sqlite3`, production data in `database/production.sqlite3`, and tests use an in-memory database. Set `DB_SQLITE_FILENAME` to override the location; an absolute path is recommended for a mounted production volume. Set it to `:memory:` only for ephemeral local runs. PostgreSQL remains an explicit alternative via `DB_CONNECTION=postgres` and `DB_HOST`, `DB_PORT`, `DB_USER`, and `DB_DATABASE`.

Before starting a deployment for the first time or after an upgrade, run `node ace migration:run --force` from `backend/`, then start the server. The `--force` flag is required by Ace when migrations run under `NODE_ENV=production`. Keep the SQLite file on durable storage: container-local filesystems may be discarded on restart. Run one application instance against a SQLite file; do not mount one database file into multiple replicas. For multi-instance writes or high write concurrency, use PostgreSQL instead. Back up SQLite through its online backup API or while the application is stopped.

Lucid migrations create the `users`, `application_states`, and `audit_logs` tables. `application_states` stores the canonical graph and latest import report as JSON payloads; updates to both are transactional. `audit_logs` is append-only through the repository API and survives process restarts. Metrics counters and latency samples remain process-local. On first read, existing `../shared/current-graph.json` and `../shared/latest-import-report.json` files are imported into SQLite and left untouched. The separate `../database/schema.sql` is PostgreSQL-specific design SQL and is not applied by the Lucid migration runner.

### v6-to-v7 Compatibility Notes

- `config/encryption.ts` uses Adonis' `legacy` driver with `APP_KEY` so existing v6-encrypted values remain decryptable. Keep the same production key; key rotation requires a separate data migration.
- `request.all()` now includes multipart files as well as fields. Upload handlers should continue reading file metadata and temporary paths with `request.file()` / `request.files()` rather than treating the merged result as plain JSON.
- Requests accepting JSON receive JSON error responses instead of rendered status pages. Controller routes receive generated names; two routes targeting the same controller method can conflict if only one has an explicit name.
- The TypeScript JIT runner is `@poppinss/ts-exec`; `ts-node` is no longer part of the backend toolchain.

## Feature Boundaries (001-adonis-hypermedia-hexagonal)

| Concern                                      | Layer          | File(s)                                                                                                                                                                                                                                                                              |
| -------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Graph contract types                         | Domain         | `contracts/dto/graph_contract_dto.ts`                                                                                                                                                                                                                                                |
| Parser contract types                        | Domain         | `contracts/dto/parser_contract_dto.ts`                                                                                                                                                                                                                                               |
| Contract version validation                  | Domain         | `usecases/validate_contract_version_usecase.ts`                                                                                                                                                                                                                                      |
| Graph structural validation                  | Domain         | `usecases/validate_graph_contract_usecase.ts`                                                                                                                                                                                                                                        |
| Parser result ingestion + merge              | Domain         | `usecases/import_parser_result_usecase.ts` (supports `MergeStrategy`: `skip`, `update`, `archive-missing`)                                                                                                                                                                           |
| Observability interfaces                     | Domain         | `contracts/repositories/observability_repository.ts`                                                                                                                                                                                                                                 |
| Process-local metrics + SQLite audit storage | Infrastructure | `repositories/observability_repository.ts`                                                                                                                                                                                                                                           |
| Auth + RBAC middleware                       | Infrastructure | `middleware/auth_middleware.ts`, `adonis/kernel.ts`                                                                                                                                                                                                                                  |
| SQLite graph persistence                     | Infrastructure | `services/graph_store_service.ts`                                                                                                                                                                                                                                                    |
| Server-side Docker file parsing              | Infrastructure | `services/upload_parser_service.ts`                                                                                                                                                                                                                                                  |
| Inventory view model builder                 | Infrastructure | `services/inventory_data_service.ts`                                                                                                                                                                                                                                                 |
| HTTP controllers                             | Infrastructure | `controllers/inventory_controller.ts`, `fragments_controller.ts`, `graph_controller.ts`, `graph_simulation_controller.ts`, `parser_controller.ts`, `uploads_controller.ts`, `node_controller.ts`, `import_report_controller.ts`, `metrics_controller.ts`, `audit_logs_controller.ts` |
| Server-rendered views                        | Resources      | `resources/views/` (Edge templates)                                                                                                                                                                                                                                                  |

## Infrastructure Services

### `graph_store_service.ts`

SQLite-backed persistence adapter for the canonical graph and latest import report. Existing JSON files are read once as a non-destructive migration fallback.

**Exports:**

| Function                                                                              | Description                                                       |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `loadCurrentGraphContract()`                                                          | Read graph from SQLite, importing the legacy JSON file if needed  |
| `persistCurrentGraphContract(contract)`                                               | Persist graph payload in SQLite                                   |
| `loadLatestImportReport()`                                                            | Read report from SQLite, importing the legacy JSON file if needed |
| `persistLatestImportReport(report)`                                                   | Persist report payload in SQLite                                  |
| `persistImportState(graph, report)`                                                   | Atomically persist graph and report                               |
| `createImportReport({ base, incoming, merged, sourceType, mergeStrategy, fileName })` | Compute `GraphImportReport` with field-level diff                 |
| `archiveNodeById(id)`                                                                 | Set `metadata.archived = true` on node                            |
| `restoreNodeById(id)`                                                                 | Remove `metadata.archived` and `metadata.archivedAt`              |
| `purgeNodeById(id)`                                                                   | Remove node and all its incident edges                            |
| `isNodeArchived(node)`                                                                | Predicate helper                                                  |
| `collectDiffChanges(before, after, basePath)`                                         | Recursive field-level diff (returns `{ path, before, after }[]`)  |

**Key types:**

```typescript
interface GraphImportReport {
  timestamp: string
  sourceType: string
  mergeStrategy: MergeStrategy
  fileName?: string
  addedNodeIds: string[]
  addedEdgeIds: string[]
  skippedNodeIds: string[]
  skippedEdgeIds: string[]
  archivedNodeIds: string[]
  modifiedNodes: Array<{
    id: string
    before: GraphNode
    after: GraphNode
    applied: boolean
    changes: Array<{ path: string; before: unknown; after: unknown }>
  }>
  modifiedEdges: Array<{/* same shape */}>
  totalNodes: number
  totalEdges: number
}
```

### `upload_parser_service.ts`

Server-side infrastructure file parser. Auto-detects source type from file extension or JSON shape when `sourceType` is omitted.

```typescript
parseUploadedInfrastructureData({
  content: string
  sourceType?: 'docker-compose' | 'docker-inspect' | 'docker-ps'
  fileName?: string
  schemaVersion?: string
}): ParserResult
```

Supports:

- `docker-compose` — YAML (parsed with `js-yaml`)
- `docker-inspect` — JSON array (`docker inspect` output)
- `docker-ps` — JSON array (`docker ps --format json` output)

### `inventory_data_service.ts`

View model builder for server-rendered pages.

| Export                                   | Description                                                                                                                        |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `getInventoryViewModel(category, query)` | Returns `{ items, query, resultCount, archivedCount }`. Filters by `q` against id/label/type.                                      |
| `getNodeDetailViewModel(nodeId)`         | Returns `NodeDetailViewModel` with `node`, `inboundDependencies`, `outboundDependencies`, `relatedInteractions`, `metadataEntries` |
| `getDashboardViewModel()`                | Returns metrics, plus `latestImport: GraphImportReport \| null`                                                                    |

## Frontend Capability Islands (`../frontend/`)

Independent from backend domain. Browser-native:

- `components/architecture-graph.js` — X6-backed graph Web Component
- `components/parser-island.js` — parser + contract validation Web Component
- `lib/graph-model.js` — canonical graph contract validator (schema-version aware)
- `lib/x6-adapter.js` — converts GraphContract → AntV X6 cell format
- `lib/incident-impact.js` — BFS/DFS traversal for impact projection
- `lib/docker-compose-parser.js`, `lib/docker-inspect-parser.js`, `lib/docker-ps-parser.js` — input normalizers
- `lib/parser-contract.js` — parser schema-version policy enforcement
- `lib/offline-store.js` — IndexedDB/Dexie persistence

## Key Invariants

1. Domain use cases receive and return domain types only.
2. Controllers never contain business logic — they validate, delegate, and respond.
3. Every write/mutate action must emit one `AuditLogEntry` via `ObservabilityRepository`.
4. Schema version policy: current (`1.0`) and previous (`0.9`) accepted; older versions produce structured `ContractError[]`.
5. Missing fragment targets return HTTP 422 with `ErrorEnvelope` and `fallbackNavigation: full_page`.
6. Graph state is persisted as a single JSON file (`shared/current-graph.json`). All mutations go through `GraphStoreService`.
7. Import requests with `dryRun: true` must never call `persistCurrentGraphContract()` or `persistLatestImportReport()`.
8. `purgeNodeById` always cascade-removes all edges where `source` or `target` matches the purged node id.
