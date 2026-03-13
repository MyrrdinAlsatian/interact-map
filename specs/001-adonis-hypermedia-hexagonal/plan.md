# Implementation Plan: Adonis Hypermedia Hexagonal Foundation

**Branch**: `001-adonis-hypermedia-hexagonal` | **Date**: 2026-03-13 | **Spec**: `/specs/001-adonis-hypermedia-hexagonal/spec.md`
**Input**: Feature specification from `/specs/001-adonis-hypermedia-hexagonal/spec.md`

## Summary

Deliver a hypermedia-first AdonisJS foundation where server-rendered pages remain the baseline, Unpoly provides partial updates, and complex graph/parser behavior runs in isolated Web Component capability islands. Preserve hexagonal boundaries, enforce authenticated read plus role-gated writes, and standardize interoperability through a versioned graph contract with explicit validation, observability, and audit logging.

## Technical Context

**Language/Version**: TypeScript 5.9 (backend), JavaScript ES modules (frontend), Node.js 20+  
**Primary Dependencies**: AdonisJS 6 (`@adonisjs/core`, `@adonisjs/auth`, `@adonisjs/lucid`), `pg`, Unpoly 3.8, AntV X6 adapter layer, native Web Components  
**Storage**: PostgreSQL (backend persistence), IndexedDB/Dexie (browser offline snapshots)  
**Testing**: Node built-in test runner for unit tests, ESLint, `tsc --noEmit`, manual progressive-enhancement checks in browser  
**Target Platform**: Linux backend runtime + modern desktop browsers (Chrome/Firefox/Edge)  
**Project Type**: Web application (server-rendered backend + frontend capability islands)  
**Performance Goals**: Graph component renders sample graph in <2s locally; at least 3 key interactions update via Unpoly fragments without full reload  
**Constraints**: Non-SPA baseline, no-JS full-page fallback, authenticated access with RBAC on writes, versioned contract validation, structured `422` fragment errors with deterministic fallback, audit and metrics coverage  
**Scale/Scope**: Initial foundation for architecture inventory + graph + parser flows; optimized for iterative feature expansion with clear domain/infrastructure separation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Scope-first: PASS. Plan maps directly to three user stories (server navigation, graph island, parser island).
- Standards baseline: PASS. Server-rendered HTML remains default; JS enhances rather than replaces.
- Verification: PASS. Verification includes lint, typecheck, unit tests, and explicit manual no-JS/Unpoly behavior checks.
- Documentation: PASS. `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, and `quickstart.md` updated.
- Simplicity: PASS with justified complexity. Added dependencies (Unpoly, X6) are explicitly tied to capability-island requirements.

## Phase 0 Research Output

Research decisions and alternatives are documented in `/specs/001-adonis-hypermedia-hexagonal/research.md`.
All prior clarifications are resolved; no `NEEDS CLARIFICATION` items remain.

## Phase 1 Design Output

- Data model: `/specs/001-adonis-hypermedia-hexagonal/data-model.md`
- Interface contracts: `/specs/001-adonis-hypermedia-hexagonal/contracts/http-endpoints.yaml`, `/specs/001-adonis-hypermedia-hexagonal/contracts/web-components.md`
- Quickstart and verification: `/specs/001-adonis-hypermedia-hexagonal/quickstart.md`

## Project Structure

### Documentation (this feature)

```text
specs/001-adonis-hypermedia-hexagonal/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── http-endpoints.yaml
│   └── web-components.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── domain/
│   │   ├── contracts/
│   │   ├── models/
│   │   └── usecases/
│   └── infrastructure/
│       ├── adonis/
│       ├── controllers/
│       ├── middleware/
│       ├── orm/
│       ├── repositories/
│       └── validators/
└── tests/
    └── unit/

frontend/
├── components/
└── lib/

docs/
examples/
database/
index.html
```

**Structure Decision**: Use the existing web-application split (`backend/` + `frontend/`) while preserving hexagonal layering inside `backend/src` and keeping capability islands in `frontend/components` and `frontend/lib`.

## Post-Design Constitution Check

- Scope-first: PASS. Data model and contracts only cover behavior in accepted user stories and FR-001..FR-014.
- Standards baseline: PASS. Contracts preserve server-rendered baseline and explicit progressive enhancement semantics.
- Verification: PASS. Quickstart includes reproducible validation for auth/RBAC, contract versioning, fallback handling, and observability/audit expectations.
- Documentation: PASS. Design artifacts are present and synchronized.
- Simplicity: PASS. No additional architectural layers beyond declared hexagonal boundaries.

## Post-Implementation Constitution Check

- Scope-first: PASS. Implementation delivered server-rendered inventory navigation (US1), graph capability island with incident simulation and contract validation (US2), and parser capability island with structured ingestion flow (US3).
- Standards baseline: PASS. Primary navigation remains server-rendered HTML; Unpoly is progressive enhancement; capability islands are isolated Web Components.
- Verification: PASS. Full quickstart validation run was executed and recorded in `quickstart.md`; backend quality gate (`lint`, `typecheck`, `test`) passes after toolchain remediation.
- Documentation: PASS. Design and operational documentation were updated in `docs/security-and-auth.md`, `docs/system-architecture-overview.md`, and `docs/frontend-architecture.md`, with quickstart validation evidence appended.
- Simplicity: PASS. Hexagonal boundaries are preserved (`domain` remains framework-agnostic; framework concerns remain in `infrastructure`) and shared contract validation is centralized.

## Final Compliance Notes

- Task execution status: all tasks T001-T056 are implemented and tracked in `tasks.md`.
- RBAC policy implemented with explicit role hierarchy (`viewer`, `analyst`, `architect`, `admin`) and route-level enforcement through `requireRole(minimumRole)`.
- Audit policy implemented for write/mutate operations via `ObservabilityRepository.appendAuditLog(...)`, with admin-gated retrieval endpoint.
- Observability baseline implemented with latency and error counters exposed by `/observability/metrics`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
