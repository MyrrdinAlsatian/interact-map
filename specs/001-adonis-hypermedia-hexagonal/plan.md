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
**Performance Goals**: Graph component renders sample graph in <2s on a Linux x86-64 developer workstation (>=8 GB RAM) using a modern Chromium-based browser; `applications`, `services`, and `servers` inventory fragment interactions update via Unpoly without full reload  
**Constraints**: Non-SPA baseline, no-JS full-page fallback, authenticated access with RBAC on writes, versioned contract validation, structured `422` fragment errors followed by a full-page `GET` to the originating target URL, audit and metrics coverage  
**Scale/Scope**: Initial foundation for architecture inventory + graph + parser flows; optimized for iterative feature expansion with clear domain/infrastructure separation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Scope-first: PASS. Plan maps directly to three user stories (server navigation, graph island, parser island).
- Standards baseline: PASS. Server-rendered HTML remains default; JavaScript enhances rather than replaces.
- Verification: PASS. Verification includes lint, typecheck, unit tests, and explicit manual no-JS/Unpoly behavior checks.
- Documentation: PASS. `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, and `quickstart.md` are included.
- Simplicity: PASS with justified complexity. Added dependencies (Unpoly, X6) are explicitly tied to capability-island requirements.

## Phase 0 Research Output

Research decisions and alternatives are documented in `/specs/001-adonis-hypermedia-hexagonal/research.md`.
All clarifications in the current spec are resolved; no `NEEDS CLARIFICATION` items remain.

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

- Scope-first: PASS. Data model and contracts cover behavior in accepted user stories and FR-001..FR-015.
- Standards baseline: PASS. Contracts preserve server-rendered baseline and explicit progressive enhancement semantics.
- Verification: PASS. Quickstart includes reproducible validation for auth/RBAC, contract versioning, fallback handling, and observability/audit expectations.
- Documentation: PASS. Design artifacts are present and synchronized.
- Simplicity: PASS. No additional architectural layers beyond declared hexagonal boundaries.

## Clarification Alignment Verification

- FR-009 alignment verified: role model and route policy clarified to `viewer` / `editor` / `security` / `admin` and propagated to data model, security blueprint, and task coverage.
- FR-011 alignment verified: missing-fragment behavior standardized to `422` followed by full-page `GET` to originating target URL.
- FR-012 alignment verified: metric trigger semantics explicitly defined for `request_latency_ms`, `fragment_error_count`, and `parse_error_count`.
- FR-014 alignment verified: schema window pinned to `current` and `current-1`; `current-2` and older rejected.
- FR-015 alignment verified: accessibility baseline and keyboard-focused checks incorporated in implementation and quickstart verification.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
