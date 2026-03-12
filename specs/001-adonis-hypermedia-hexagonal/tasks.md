# Tasks: Adonis Hypermedia Hexagonal Foundation

**Input**: Design documents from `/specs/001-adonis-hypermedia-hexagonal/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No explicit TDD request in spec; tasks focus on implementation plus independent validation steps.
**Organization**: Tasks are grouped by user story to enable independent implementation and validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`) for story-phase tasks only
- Every task includes a concrete file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align project scaffolding with the feature architecture and contracts.

- [ ] T001 Align backend project metadata and scripts in backend/package.json
- [ ] T002 [P] Finalize Adonis project config baselines in backend/adonisrc.ts
- [ ] T003 [P] Configure TypeScript path aliasing and compiler options in backend/tsconfig.json
- [ ] T004 [P] Add feature architecture decisions to backend/ARCHITECTURE.md
- [ ] T005 [P] Ensure feature quickstart consistency in specs/001-adonis-hypermedia-hexagonal/quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish domain contracts and infrastructure base required by all stories.

**⚠️ CRITICAL**: User story work starts only after this phase is complete.

- [ ] T006 Create canonical graph domain types in backend/src/domain/models/graph_model.ts
- [ ] T007 [P] Define parser result domain contract in backend/src/domain/contracts/dto/parser_result_dto.ts
- [ ] T008 [P] Define graph repository contract in backend/src/domain/contracts/repositories/graph_repository.ts
- [ ] T009 Implement graph validation use case in backend/src/domain/usecases/validate_graph_model_usecase.ts
- [ ] T010 [P] Register baseline route map for feature endpoints in backend/src/infrastructure/adonis/routes.ts
- [ ] T011 [P] Add global JSON/fragment middleware composition in backend/src/infrastructure/adonis/kernel.ts
- [ ] T012 Create HTTP contract snapshot alignment note in specs/001-adonis-hypermedia-hexagonal/contracts/http-endpoints.yaml

**Checkpoint**: Foundational graph contracts and request pipeline are ready.

---

## Phase 3: User Story 1 - Server-driven navigation foundation (Priority: P1) 🎯 MVP

**Goal**: Deliver server-rendered hypermedia navigation with Unpoly progressive enhancement and non-JS fallback.

**Independent Test**: With and without JS, navigate graph and inventory pages; verify full HTML fallback and fragment updates.

### Implementation for User Story 1

- [ ] T013 [US1] Implement inventory page route handlers in backend/src/infrastructure/controllers/inventory_controller.ts
- [ ] T014 [P] [US1] Implement health and base navigation controller in backend/src/infrastructure/controllers/health_checks_controller.ts
- [ ] T015 [P] [US1] Add Unpoly-safe fragment response helper in backend/src/infrastructure/controllers/fragment_response_controller.ts
- [ ] T016 [US1] Build server route wiring for graph and inventory navigation in backend/src/infrastructure/adonis/routes.ts
- [ ] T017 [P] [US1] Add Edge layout shell for hypermedia navigation in backend/resources/views/layout.edge
- [ ] T018 [P] [US1] Add inventory table partial target template in backend/resources/views/partials/inventory_table.edge
- [ ] T019 [US1] Add applications inventory page template in backend/resources/views/applications/index.edge
- [ ] T020 [US1] Add services inventory page template in backend/resources/views/services/index.edge
- [ ] T021 [US1] Add servers inventory page template in backend/resources/views/servers/index.edge
- [ ] T022 [US1] Add containers inventory page template in backend/resources/views/containers/index.edge
- [ ] T023 [US1] Add interactions inventory page template in backend/resources/views/interactions/index.edge
- [ ] T024 [US1] Document US1 verification procedure in specs/001-adonis-hypermedia-hexagonal/quickstart.md

**Checkpoint**: Server-driven navigation is independently usable and progressively enhanced.

---

## Phase 4: User Story 2 - Graph capability island (Priority: P2)

**Goal**: Provide graph visualization and interaction as an isolated Web Component using AntV X6.

**Independent Test**: Load sample graph JSON and verify zoom/pan/selection/highlight/simulation behavior in the component.

### Implementation for User Story 2

- [ ] T025 [US2] Implement canonical graph model validation utility in frontend/lib/graph-model.js
- [ ] T026 [P] [US2] Implement X6 adapter from canonical model in frontend/lib/x6-adapter.js
- [ ] T027 [US2] Implement incident traversal algorithm for visualization overlays in frontend/lib/incident-impact.js
- [ ] T028 [US2] Implement architecture graph Web Component with interaction API in frontend/components/architecture-graph.js
- [ ] T029 [P] [US2] Add graph page server template integration for capability island in backend/resources/views/graph/index.edge
- [ ] T030 [P] [US2] Add graph simulation endpoint wiring in backend/src/infrastructure/adonis/routes.ts
- [ ] T031 [US2] Implement simulation endpoint controller handler in backend/src/infrastructure/controllers/graph_controller.ts
- [ ] T032 [US2] Add graph component contract references in specs/001-adonis-hypermedia-hexagonal/contracts/web-components.md
- [ ] T033 [US2] Add sample graph fixture for independent verification in examples/project-dataset.json

**Checkpoint**: Graph capability island is independently functional and contract-aligned.

---

## Phase 5: User Story 3 - Parser capability island (Priority: P3)

**Goal**: Provide parser Web Component/module flow that transforms supported input into normalized graph fragments.

**Independent Test**: Parse valid and invalid sample payloads and verify deterministic normalized output plus structured errors.

### Implementation for User Story 3

- [ ] T034 [US3] Implement parser input validation contract in frontend/lib/parser-contract.js
- [ ] T035 [P] [US3] Implement docker-compose parser module in frontend/lib/docker-compose-parser.js
- [ ] T036 [P] [US3] Implement docker inspect parser module in frontend/lib/docker-inspect-parser.js
- [ ] T037 [P] [US3] Implement docker ps JSON parser module in frontend/lib/docker-ps-parser.js
- [ ] T038 [US3] Implement parser capability island Web Component in frontend/components/parser-island.js
- [ ] T039 [US3] Add parser-to-graph merge use case in backend/src/domain/usecases/import_parser_result_usecase.ts
- [ ] T040 [US3] Add parser ingestion endpoint controller in backend/src/infrastructure/controllers/parser_controller.ts
- [ ] T041 [US3] Wire parser ingestion route in backend/src/infrastructure/adonis/routes.ts
- [ ] T042 [US3] Add parser fixture set for malformed and valid payloads in examples/parser-fixtures.json
- [ ] T043 [US3] Update parser contracts and validation errors in specs/001-adonis-hypermedia-hexagonal/contracts/web-components.md

**Checkpoint**: Parser capability island independently produces normalized graph fragments and structured parse diagnostics.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final alignment across stories, docs, and constitution requirements.

- [ ] T044 [P] Update feature architecture summary in docs/system-architecture-overview.md
- [ ] T045 [P] Update frontend layering and capability-island notes in docs/frontend-architecture.md
- [ ] T046 Reconcile backend structure notes with final implementation in backend/ARCHITECTURE.md
- [ ] T047 [P] Run and document quickstart validation results in specs/001-adonis-hypermedia-hexagonal/quickstart.md
- [ ] T048 Verify constitution gates and record any exceptions in specs/001-adonis-hypermedia-hexagonal/plan.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2; MVP delivery.
- **Phase 4 (US2)**: Depends on Phase 2; may proceed in parallel with US1 after foundation, but recommended after US1 baseline views.
- **Phase 5 (US3)**: Depends on Phase 2; can proceed after canonical graph contracts are stable.
- **Phase 6 (Polish)**: Depends on completion of desired user stories.

### User Story Dependencies

- **US1 (P1)**: No dependency on US2/US3.
- **US2 (P2)**: Uses canonical graph model from Phase 2; independent from parser implementation.
- **US3 (P3)**: Uses canonical graph model and may integrate with US2 graph consumption path, but remains independently testable.

### Within Each User Story

- Domain contracts/utilities before controllers/components that consume them.
- Route/controller integration after core story modules exist.
- Story-specific docs/contracts updated within the same phase.

---

## Parallel Execution Examples

### US1 Parallel Example

```bash
Task: "T017 [P] [US1] Add Unpoly-safe layout shell in backend/resources/views/layout.edge"
Task: "T018 [P] [US1] Add inventory partial in backend/resources/views/partials/inventory_table.edge"
Task: "T014 [P] [US1] Implement health/base nav controller in backend/src/infrastructure/controllers/health_checks_controller.ts"
```

### US2 Parallel Example

```bash
Task: "T026 [P] [US2] Implement X6 adapter in frontend/lib/x6-adapter.js"
Task: "T029 [P] [US2] Integrate graph page template in backend/resources/views/graph/index.edge"
Task: "T030 [P] [US2] Wire simulation endpoint route in backend/src/infrastructure/adonis/routes.ts"
```

### US3 Parallel Example

```bash
Task: "T035 [P] [US3] Implement docker-compose parser in frontend/lib/docker-compose-parser.js"
Task: "T036 [P] [US3] Implement docker inspect parser in frontend/lib/docker-inspect-parser.js"
Task: "T037 [P] [US3] Implement docker ps parser in frontend/lib/docker-ps-parser.js"
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Setup + Foundational phases.
2. Complete all US1 tasks (T013–T024).
3. Validate server-driven navigation with and without JS.
4. Demo MVP before continuing.

### Incremental Delivery

1. Add US2 graph island on top of validated US1 shell.
2. Add US3 parser island and ingestion flow.
3. Run cross-cutting polish and constitution validation.

### Team Parallelization

- Developer A: US1 hypermedia templates/controllers.
- Developer B: US2 graph model + Web Component + adapter.
- Developer C: US3 parser modules + parser island + ingestion endpoint.

---

## Notes

- `[P]` tasks are safe for concurrent work in different files.
- Story labels ensure traceability from spec priorities to implementation.
- Every story phase includes independent validation criteria.
- Avoid introducing SPA routing or coupling domain contracts to UI libraries.
