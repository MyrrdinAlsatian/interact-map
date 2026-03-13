# Tasks: Adonis Hypermedia Hexagonal Foundation

**Input**: Design documents from `/specs/001-adonis-hypermedia-hexagonal/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Automated TDD was not explicitly requested in the feature spec; tasks include implementation and explicit independent validation steps per story.
**Organization**: Tasks are grouped by user story so each story is independently completable and verifiable.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align repository scaffolding with the approved implementation plan and contracts.

- [ ] T001 Align backend scripts and dependencies for feature scope in `backend/package.json`
- [ ] T002 [P] Align backend runtime and aliases for feature modules in `backend/adonisrc.ts`
- [ ] T003 [P] Align TypeScript compiler and path mapping for new domain/infrastructure files in `backend/tsconfig.json`
- [ ] T004 [P] Add implementation boundary notes for this feature in `backend/ARCHITECTURE.md`
- [ ] T005 [P] Align root demo navigation links with server-rendered routes in `index.html`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared contracts and cross-cutting infrastructure required by all user stories.

**⚠️ CRITICAL**: User story work begins only after this phase is complete.

- [ ] T006 Define canonical graph contract and error types in `backend/src/domain/contracts/dto/graph_contract_dto.ts`
- [ ] T007 [P] Define parser input/result contract DTOs with schema version fields in `backend/src/domain/contracts/dto/parser_contract_dto.ts`
- [ ] T008 [P] Implement contract schema-version validation use case in `backend/src/domain/usecases/validate_contract_version_usecase.ts`
- [ ] T009 [P] Implement graph contract structural validation use case in `backend/src/domain/usecases/validate_graph_contract_usecase.ts`
- [ ] T010 Implement authentication + role guard middleware chain for read/write boundaries in `backend/src/infrastructure/adonis/kernel.ts`
- [ ] T011 [P] Implement shared authorization helpers for role-gated actions in `backend/src/infrastructure/middleware/auth_middleware.ts`
- [ ] T012 [P] Add structured logger configuration for request and feature events in `backend/config/logger.ts`
- [ ] T013 Implement metrics and audit service contracts in `backend/src/domain/contracts/repositories/observability_repository.ts`
- [ ] T014 Implement infrastructure observability repository (metrics + audit append) in `backend/src/infrastructure/repositories/observability_repository.ts`
- [ ] T015 Register baseline feature routes and shared middleware usage in `backend/src/infrastructure/adonis/routes.ts`

**Checkpoint**: Contract validation, auth/RBAC baseline, and observability/audit infrastructure are ready.

---

## Phase 3: User Story 1 - Server-driven navigation foundation (Priority: P1) 🎯 MVP

**Goal**: Deliver server-rendered navigation with progressive Unpoly updates and deterministic missing-fragment fallback behavior.

**Independent Test**: Open pages with JS disabled and enabled; verify full-page routing works and Unpoly updates fragments; verify missing fragment returns `422` with fallback metadata.

### Implementation for User Story 1

- [ ] T016 [US1] Implement inventory page controller actions for server-rendered navigation in `backend/src/infrastructure/controllers/inventory_controller.ts`
- [ ] T017 [P] [US1] Implement fragment resolver controller with `422` error envelope handling in `backend/src/infrastructure/controllers/fragments_controller.ts`
- [ ] T018 [US1] Wire inventory and fragment endpoints with read-auth requirements in `backend/src/infrastructure/adonis/routes.ts`
- [ ] T019 [P] [US1] Create shared hypermedia layout template with Unpoly target containers in `backend/resources/views/layout.edge`
- [ ] T020 [P] [US1] Create reusable inventory fragment partial used by Unpoly updates in `backend/resources/views/partials/inventory_table.edge`
- [ ] T021 [US1] Implement applications page template in `backend/resources/views/applications/index.edge`
- [ ] T022 [US1] Implement services page template in `backend/resources/views/services/index.edge`
- [ ] T023 [US1] Implement servers page template in `backend/resources/views/servers/index.edge`
- [ ] T024 [US1] Implement containers page template in `backend/resources/views/containers/index.edge`
- [ ] T025 [US1] Implement interactions page template in `backend/resources/views/interactions/index.edge`
- [ ] T026 [US1] Update US1 manual verification steps for no-JS and fragment fallback behavior in `specs/001-adonis-hypermedia-hexagonal/quickstart.md`

**Checkpoint**: US1 works independently with server-first navigation and Unpoly fallback behavior.

---

## Phase 4: User Story 2 - Graph capability island (Priority: P2)

**Goal**: Deliver the architecture graph Web Component with X6-backed interactions and role-gated incident simulation.

**Independent Test**: Load sample graph contract into the component and verify render/zoom/pan/selection/highlight/simulation flows in under 2 seconds.

### Implementation for User Story 2

- [ ] T027 [US2] Implement canonical graph contract validator used by graph island in `frontend/lib/graph-model.js`
- [ ] T028 [P] [US2] Implement X6 adapter conversion from canonical graph contract in `frontend/lib/x6-adapter.js`
- [ ] T029 [P] [US2] Implement incident traversal and impact projection utility in `frontend/lib/incident-impact.js`
- [ ] T030 [US2] Implement architecture graph Web Component APIs/events in `frontend/components/architecture-graph.js`
- [ ] T031 [US2] Implement graph page controller for server-rendered shell + contract payload injection in `backend/src/infrastructure/controllers/graph_controller.ts`
- [ ] T032 [P] [US2] Implement graph page server template mounting the graph island in `backend/resources/views/graph/index.edge`
- [ ] T033 [US2] Implement role-gated incident simulation endpoint in `backend/src/infrastructure/controllers/graph_simulation_controller.ts`
- [ ] T034 [US2] Wire graph page and simulation routes with RBAC checks in `backend/src/infrastructure/adonis/routes.ts`
- [ ] T035 [US2] Align graph contract endpoint semantics for US2 in `specs/001-adonis-hypermedia-hexagonal/contracts/http-endpoints.yaml`
- [ ] T036 [US2] Update graph sample fixture for interaction verification in `examples/project-dataset.json`

**Checkpoint**: US2 graph island is independently functional and contract-compliant.

---

## Phase 5: User Story 3 - Parser capability island (Priority: P3)

**Goal**: Deliver parser capability flows that normalize supported inputs into graph contracts with structured compatibility/validation errors.

**Independent Test**: Parse supported and malformed fixtures using current/previous/older schema versions and verify deterministic success/error outputs.

### Implementation for User Story 3

- [ ] T037 [US3] Implement parser contract validation utility with version policy enforcement in `frontend/lib/parser-contract.js`
- [ ] T038 [P] [US3] Implement docker-compose normalization parser in `frontend/lib/docker-compose-parser.js`
- [ ] T039 [P] [US3] Implement docker-inspect normalization parser in `frontend/lib/docker-inspect-parser.js`
- [ ] T040 [P] [US3] Implement docker-ps normalization parser in `frontend/lib/docker-ps-parser.js`
- [ ] T041 [US3] Implement parser capability island API and structured error output in `frontend/components/parser-island.js`
- [ ] T042 [US3] Implement parser result ingestion use case in `backend/src/domain/usecases/import_parser_result_usecase.ts`
- [ ] T043 [US3] Implement parser ingestion controller with compatibility error mapping in `backend/src/infrastructure/controllers/parser_controller.ts`
- [ ] T044 [US3] Wire parser ingestion route with authenticated read/write policy in `backend/src/infrastructure/adonis/routes.ts`
- [ ] T045 [US3] Add parser fixtures for valid, malformed, and older-version cases in `examples/parser-fixtures.json`
- [ ] T046 [US3] Align parser-island contract and error semantics in `specs/001-adonis-hypermedia-hexagonal/contracts/web-components.md`

**Checkpoint**: US3 parser island independently produces normalized graph fragments and structured errors.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize cross-story quality, observability, documentation, and constitution compliance.

- [ ] T047 Implement `/observability/metrics` response controller using core counters in `backend/src/infrastructure/controllers/metrics_controller.ts`
- [ ] T048 Implement `/audit/logs` query controller and admin gating in `backend/src/infrastructure/controllers/audit_logs_controller.ts`
- [ ] T049 Wire metrics and audit routes with role policies in `backend/src/infrastructure/adonis/routes.ts`
- [ ] T050 [P] Update architecture and security docs with auth/RBAC/audit decisions in `docs/security-and-auth.md`
- [ ] T051 [P] Update system architecture overview for capability-island + observability flows in `docs/system-architecture-overview.md`
- [ ] T052 [P] Update frontend architecture doc for parser/graph contract version policy in `docs/frontend-architecture.md`
- [ ] T053 Run full quickstart validation and record results in `specs/001-adonis-hypermedia-hexagonal/quickstart.md`
- [ ] T054 Verify constitution gate outcomes and final compliance notes in `specs/001-adonis-hypermedia-hexagonal/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies; starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2; delivers MVP.
- **Phase 4 (US2)**: Depends on Phase 2; can proceed after foundation (parallel with US1 if staffed).
- **Phase 5 (US3)**: Depends on Phase 2; can proceed after foundation (parallel with US1/US2 if staffed).
- **Phase 6 (Polish)**: Depends on completion of selected user stories.

### User Story Dependencies

- **US1 (P1)**: No dependency on US2/US3.
- **US2 (P2)**: Depends on foundational contract/auth/observability baseline; independent of parser implementation.
- **US3 (P3)**: Depends on foundational contract/version-validation baseline; independent of graph rendering implementation.

### Recommended Completion Order

1. Setup + Foundational
2. US1 (MVP)
3. US2
4. US3
5. Polish

---

## Parallel Execution Examples

### User Story 1

```bash
Task: "T019 [P] [US1] Create shared hypermedia layout template in backend/resources/views/layout.edge"
Task: "T020 [P] [US1] Create reusable inventory fragment partial in backend/resources/views/partials/inventory_table.edge"
Task: "T017 [P] [US1] Implement fragment resolver controller in backend/src/infrastructure/controllers/fragments_controller.ts"
```

### User Story 2

```bash
Task: "T028 [P] [US2] Implement X6 adapter conversion in frontend/lib/x6-adapter.js"
Task: "T029 [P] [US2] Implement incident traversal utility in frontend/lib/incident-impact.js"
Task: "T032 [P] [US2] Implement graph page server template in backend/resources/views/graph/index.edge"
```

### User Story 3

```bash
Task: "T038 [P] [US3] Implement docker-compose normalization parser in frontend/lib/docker-compose-parser.js"
Task: "T039 [P] [US3] Implement docker-inspect normalization parser in frontend/lib/docker-inspect-parser.js"
Task: "T040 [P] [US3] Implement docker-ps normalization parser in frontend/lib/docker-ps-parser.js"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete US1 tasks (T016-T026).
3. Validate independent test criteria for US1 before expanding scope.

### Incremental Delivery

1. Foundation complete (Phases 1-2).
2. Deliver US1 and validate.
3. Deliver US2 and validate.
4. Deliver US3 and validate.
5. Finish polish and compliance checks.

### Parallel Team Strategy

1. Team completes Phases 1-2 together.
2. Then parallelize by story:
	- Developer A: US1
	- Developer B: US2
	- Developer C: US3

