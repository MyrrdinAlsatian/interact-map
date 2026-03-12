# Implementation Plan: Adonis Hypermedia Hexagonal Foundation

**Branch**: `001-adonis-hypermedia-hexagonal` | **Date**: 2026-03-13 | **Spec**: `/specs/001-adonis-hypermedia-hexagonal/spec.md`
**Input**: Feature specification from `/specs/001-adonis-hypermedia-hexagonal/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build a server-driven hypermedia foundation with AdonisJS where navigation remains HTML-first, Unpoly adds progressive enhancement, and complex interactions are isolated as native Web Components (graph visualization and parser islands). The implementation enforces hexagonal architecture and clean code boundaries, with a framework-agnostic graph contract and adapter-based integration with AntV X6.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (Node.js 20+)  
**Primary Dependencies**: AdonisJS, Unpoly, AntV X6, native Web Components  
**Storage**: PostgreSQL (runtime integration) + file-based fixtures for parser/graph contract testing  
**Testing**: Node test runner for unit-level domain/repository checks; contract fixture validation for graph/parser  
**Target Platform**: Web browser + Node.js server
**Project Type**: Web application (server-rendered + progressive enhancement islands)  
**Performance Goals**: First graph render in under 2s on local dev dataset; fragment updates without full page reload for key flows  
**Constraints**: No SPA-first routing; domain must remain framework-agnostic; capability islands isolated from server navigation concerns  
**Scale/Scope**: Foundation architecture, baseline routes/fragments, graph + parser island contracts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Pre-Phase 0 Gate Review**
  - Scope-first: PASS (stories map to navigation, graph, parser user outcomes)
  - Standards baseline: PASS (server-rendered default with progressive enhancement)
  - Verification: PASS (defined in spec and quickstart)
  - Documentation: PASS (`research.md`, `data-model.md`, `quickstart.md`, `contracts/`)
  - Simplicity: PASS with justification for Unpoly + AntV X6 + Web Components
- **Post-Phase 1 Re-check**
  - PASS: Design artifacts preserve framework-agnostic domain model and capability-island boundaries.

## Project Structure

### Documentation (this feature)

```text
specs/001-adonis-hypermedia-hexagonal/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

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
│       ├── repositories/
│       └── validators/
├── config/
├── database/
├── providers/
└── tests/
  └── unit/

frontend/
├── components/
└── lib/
```

**Structure Decision**: Use the web application layout with a hexagonal backend (`backend/src/domain`, `backend/src/infrastructure`) and frontend capability-island modules (`frontend/components`, `frontend/lib`) embedded in server-rendered pages.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Adapter for AntV X6 | Keep canonical graph model framework-agnostic | Direct X6 model would couple domain logic to visualization library |
| Unpoly + Web Components split | Preserve hypermedia-first UX while enabling rich interactions | SPA router/components would violate non-SPA requirement |
