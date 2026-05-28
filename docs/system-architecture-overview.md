# System Architecture Mapping Platform - Overview

## Purpose
The platform documents applications, services, infrastructure, and runtime dependencies to support architecture visualization, incident impact analysis, and offline Docker infrastructure exploration.

## Architectural Style
- Hypermedia-first, server-rendered HTML for primary navigation and data views.
- Progressive enhancement with Unpoly for partial page updates and form interactions.
- Client-side capability islands via Web Components for complex interactions:
  - Graph visualization
  - Docker source parsing
  - Incident simulation

## High-Level Components
1. Presentation Layer (server-driven)
   - AdonisJS routes/controllers render HTML views.
   - Inventory pages (applications, services, servers, containers, interactions) remain server-rendered.
   - Unpoly progressively enhances filters, pagination, and partial updates.
   - Dashboard includes import form (file upload or raw payload), merge strategy selector, dry-run toggle, and latest diff summary widget.
2. Capability Islands (browser)
   - `architecture-graph` Web Component renders and interacts with graph data using X6.
   - Parsing modules import Docker files client-side.
   - Offline store persists projects and graph snapshots in IndexedDB.
3. Application Layer
   - Use cases orchestrate domain operations (import, map, analyze, export).
   - `ImportParserResultUseCase` supports `MergeStrategy`: `skip`, `update`, `archive-missing`.
4. Domain Layer
   - Framework-agnostic entities and domain services.
   - Canonical graph model independent from visualization engine.
5. Infrastructure Layer
   - JSON file persistence (`shared/current-graph.json`, `shared/latest-import-report.json`).
   - `GraphStoreService`: load/persist graph, archive/restore/purge nodes, create import report with field-level diff.
   - `UploadParserService`: server-side Docker file parsers (docker-compose YAML, docker-inspect JSON, docker-ps JSON).
   - `InventoryDataService`: builds view models for all inventory pages, node detail, dashboard with search and archive state.
   - AES-256 crypto services and key management integration.
   - Authentication integration adapters (SSO in production, local account in development).

## Core Flows
- Architecture mapping: import manual records or Docker files → normalize to graph model → save project.
- Visualization: load graph model from backend or local cache → convert through X6 adapter → render interactive graph.
- Incident simulation: pick failing node → run impact traversal (BFS/DFS) → highlight impacted edges/nodes.
- Offline analysis: import Docker sources client-side → build and explore graph in browser → export JSON project bundle.
- Infrastructure import: upload Docker source file or POST `ParserResult` → parse on backend → validate schema version → merge into current graph (with chosen `MergeStrategy`) → persist updated graph and `GraphImportReport` → view fine-grained diff at `/imports/latest`.
- Node lifecycle: nodes can be soft-archived (`POST /nodes/:id/archive`) or hard-purged (`POST /nodes/:id/purge`); archived nodes remain in the graph with a distinct visual state and can be restored via `POST /nodes/:id/restore`.

## Server-Rendered Baseline + Unpoly Fragment Flow

```
Browser                        AdonisJS Server
  |                                  |
  |-- GET /applications -----------> |
  |                                  |--> InventoryController.applications()
  |                                  |     recordLatency(start)
  |                                  |     view('applications/index')
  |<-- 200 text/html (full page) --- |
  |
  |-- (Unpoly) GET /fragments/inventory-applications
  |   headers: X-Up-Target, X-Up-Version
  |-----------------------------------------> FragmentsController.show()
  |                                              validate target
  |                                              render partial
  |<-- 200 text/html (fragment only) --------- |
  |
  |-- (unknown target) GET /fragments/bad
  |-----------------------------------------> FragmentsController.show()
  |                                              incrementFragmentError()
  |<-- 422 JSON ErrorEnvelope ---------------- |
  |   { fallbackNavigation: 'full_page' }
```

## Capability-Island + Observability Flow

```
Browser                                     AdonisJS Server
  |                                               |
  |-- GET /graph ------------------------------>  |
  |                                               |--> GraphController.index()
  |                                               |     loads project-dataset.json
  |                                               |     injects GraphContract as JSON
  |<-- 200 text/html (graph shell + data) ------- |
  |
  |  [<architecture-graph> Web Component]
  |    validateGraphContract(data)  <-- schema version policy
  |    X6 adapter renders nodes/edges
  |
  |-- POST /graph/simulate-incident (security+) -> |
  |   { startNodeId, traversalMode }              |--> GraphSimulationController.simulate()
  |                                               |     BFS/DFS traversal
  |                                               |     appendAuditLog(...)
  |<-- 200 IncidentSimulationResult ------------- |
  |
  |-- POST /parser/ingest (editor+) ------------> |
  |   { parserResult, mergeStrategy?, dryRun? }   |--> ParserController.ingest()
  |                                               |     ImportParserResultUseCase
  |                                               |     GraphStoreService.createImportReport()
  |                                               |     [if !dryRun] persist graph + report
  |                                               |     appendAuditLog(...)
  |<-- 200 { merged, previewReport, dryRun } ---- |
  |  or 422 ErrorEnvelope (validation errors)
  |
  |-- POST /uploads (editor+) ----------------->  |
  |   multipart file | payload body               |--> UploadsController.store()
  |   + sourceType?, mergeStrategy?, dryRun?      |     UploadParserService.parse()
  |                                               |     ValidateGraphContractUseCase
  |                                               |     ImportParserResultUseCase
  |                                               |     GraphStoreService.createImportReport()
  |                                               |     [if !dryRun] persist graph + report
  |<-- 200 { merged, previewReport, dryRun } ---- |
  |
  |-- GET /imports/latest (viewer+) ----------->  |
  |                                               |--> ImportReportController.show()
  |                                               |     GraphStoreService.loadLatestImportReport()
  |<-- 200 text/html (diff view) ---------------- |
  |
  |-- GET /nodes/:id (viewer+) --------------->   |
  |                                               |--> NodeController.show()
  |                                               |     InventoryDataService.getNodeDetailViewModel()
  |<-- 200 text/html (node detail) -------------- |
  |
  |-- POST /nodes/:id/archive|restore|purge ----> |
  |                                               |--> NodeController.archive|restore|purge()
  |                                               |     GraphStoreService.archiveNodeById|...|purgeNodeById()
  |<-- 302 redirect to category page ------------ |
  |
        |-- GET /observability/metrics (security+) ----> |
  |<-- 200 CoreMetrics JSON ------------------- |
  |
  |-- GET /audit/logs (admin only) ------------>  |
  |<-- 200 AuditLogEntry[] newest first -------- |
```

## Import Pipeline — JSON Persistence

```
POST /uploads or POST /parser/ingest
        │
        ▼
UploadParserService.parse()          ← only for /uploads (file/payload)
        │  docker-compose YAML → ParserResult
        │  docker-inspect JSON → ParserResult
        │  docker-ps     JSON → ParserResult
        ▼
ValidateGraphContractUseCase         ← schema version + structural validation
ValidateContractVersionUseCase
        │  errors[] → 422 immediately
        ▼
GraphStoreService.loadCurrentGraphContract()   ← reads shared/current-graph.json
        │
        ▼
ImportParserResultUseCase(parserResult, base, { mergeStrategy })
        │  skip           → base wins on collision
        │  update         → incoming wins on collision
        │  archive-missing → update + archive absent base nodes
        ▼
GraphStoreService.createImportReport({ base, incoming, merged, ... })
        │  addedNodeIds / addedEdgeIds
        │  skippedNodeIds / skippedEdgeIds
        │  modifiedNodes[]  with per-field changes[] { path, before, after, applied }
        │  archivedNodeIds
        ▼
[dryRun=false] GraphStoreService.persistCurrentGraphContract()
               GraphStoreService.persistLatestImportReport()
        │
        ▼
Response: { status, merged, previewReport, dryRun, persisted, mergeStrategy }
```

## Hexagonal Boundary Diagram

```
┌─────────────────────────────────────────────────┐
│                    Domain Layer                  │
│  (no framework imports, no side-effects)         │
│                                                  │
│  ┌──────────────┐  ┌────────────────────────┐   │
│  │  Entities    │  │  UseCases              │   │
│  │  user.ts     │  │  validate_contract...  │   │
│  │              │  │  validate_graph...     │   │
│  │              │  │  import_parser...      │   │
│  └──────────────┘  └────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │           Contracts (Interfaces)          │   │
│  │  dto/graph_contract_dto.ts               │   │
│  │  dto/parser_contract_dto.ts              │   │
│  │  repositories/user_repository.ts         │   │
│  │  repositories/observability_repository.ts│   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
              ↑ implements ↑
┌─────────────────────────────────────────────────┐
│               Infrastructure Layer              │
│                                                  │
│  ┌────────────────┐  ┌───────────────────────┐  │
│  │  Controllers   │  │  Repositories         │  │
│  │  (HTTP in)     │  │  (in-memory/DB out)   │  │
│  └────────────────┘  └───────────────────────┘  │
│  ┌────────────────────────────────────────────┐  │
│  │  Adonis Adapters: routes, kernel, env       │  │
│  └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
              ↑ drives ↑
┌─────────────────────────────────────────────────┐
│              Browser / Frontend Layer            │
│                                                  │
│  Server-rendered HTML (Edge templates)           │
│  Unpoly (fragment updates, 422 fallback)         │
│  Web Components: architecture-graph, parser-island│
│  Shared: graph-model.js, parser-contract.js      │
└─────────────────────────────────────────────────┘
```

## Security and Access
- Encryption at rest and in transit required on backend and client-side project payloads.
- AES-256 envelope encryption model with key rotation policy.
- RBAC enforced via `ROLE_HIERARCHY` (viewer=0, security=1, editor=2, admin=3).
- `requireRole(minimumRole)` middleware factory applied per route group.
- All write/mutate operations emit `AuditLogEntry` via `ObservabilityRepository.appendAuditLog()`.
- Audit log access: admin-only via `GET /audit/logs`.

## Progressive Enhancement Rules
- Baseline UX must function without JavaScript for navigation and inventory reading.
- JavaScript adds:
  - partial updates (Unpoly)
  - graph interactions (Web Component)
  - local parsing and offline operations

## Non-Functional Priorities
- Simplicity: explicit boundaries and small modules.
- Maintainability: hexagonal architecture and framework-agnostic domain model.
- Framework independence: graph model and algorithms decoupled from UI libraries.
- Evolvability: adapter pattern for graph engines and infrastructure sources.
