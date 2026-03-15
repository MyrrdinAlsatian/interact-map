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

## Feature Boundaries (001-adonis-hypermedia-hexagonal)

| Concern                     | Layer          | File(s)                                                                                                                                                                                                |
| --------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Graph contract types        | Domain         | `contracts/dto/graph_contract_dto.ts`                                                                                                                                                                  |
| Parser contract types       | Domain         | `contracts/dto/parser_contract_dto.ts`                                                                                                                                                                 |
| Contract version validation | Domain         | `usecases/validate_contract_version_usecase.ts`                                                                                                                                                        |
| Graph structural validation | Domain         | `usecases/validate_graph_contract_usecase.ts`                                                                                                                                                          |
| Parser result ingestion     | Domain         | `usecases/import_parser_result_usecase.ts`                                                                                                                                                             |
| Observability interfaces    | Domain         | `contracts/repositories/observability_repository.ts`                                                                                                                                                   |
| Metrics + audit storage     | Infrastructure | `repositories/observability_repository.ts`                                                                                                                                                             |
| Auth + RBAC middleware      | Infrastructure | `middleware/auth_middleware.ts`, `adonis/kernel.ts`                                                                                                                                                    |
| HTTP controllers            | Infrastructure | `controllers/inventory_controller.ts`, `fragments_controller.ts`, `graph_controller.ts`, `graph_simulation_controller.ts`, `parser_controller.ts`, `metrics_controller.ts`, `audit_logs_controller.ts` |
| Server-rendered views       | Resources      | `resources/views/` (Edge templates)                                                                                                                                                                    |

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
