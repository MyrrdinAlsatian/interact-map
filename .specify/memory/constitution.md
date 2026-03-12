<!--
Sync Impact Report
- Version change: N/A → 1.0.0
- Modified principles:
  - Initial adoption (no prior titles)
- Added sections:
  - Core Principles
  - Project Guardrails
  - Delivery Workflow
  - Governance
- Removed sections:
  - None
- Templates requiring updates:
  - ✅ updated: .specify/templates/plan-template.md
  - ✅ updated: .specify/templates/spec-template.md
  - ✅ updated: .specify/templates/tasks-template.md
  - ⚠ pending: .specify/templates/commands/*.md (directory not present)
  - ✅ updated: README.md
- Follow-up TODOs:
  - None
-->

# Interactive Map Constitution

## Core Principles

### I. Scope-First Delivery
All work MUST map to an explicitly stated user-visible outcome in the active spec.
Non-essential features, UX flourishes, and speculative architecture MUST be deferred.
Rationale: this project started as a minimal scaffold and must preserve fast, focused
iteration.

### II. Standards-Based Web Baseline
The project MUST remain runnable as static web assets unless a spec explicitly approves
runtime expansion. HTML, CSS, and JavaScript MUST use broadly supported web standards.
Rationale: static portability keeps setup friction low and enables simple validation.

### III. Verifiable Changes
Every code change MUST include a verification step proportional to scope (at minimum:
manual browser load check; when present: lint/tests/build checks). Changes that cannot
be verified MUST be blocked or explicitly documented as risk.
Rationale: repeatable verification prevents regressions in a lightweight codebase.

### IV. Documentation and Traceability
User-facing behavior changes MUST update relevant documentation (`README.md`, feature
specs, or quickstart notes) in the same change set. Plans, specs, and tasks MUST stay
internally consistent.
Rationale: documentation drift is a primary failure mode in fast-moving small projects.

### V. Simplicity and Maintainability
Implementations MUST choose the simplest approach that satisfies current requirements.
New dependencies, patterns, or layers MUST include a written justification in the plan
or complexity tracking section.
Rationale: controlled complexity keeps the project understandable and easy to evolve.

## Project Guardrails

- Default stack is static web (`index.html` and related assets).
- Any introduction of backend services, databases, or external SDKs MUST be approved in
  spec requirements before implementation.
- Accessibility baseline MUST include semantic structure, readable text contrast, and
  keyboard-reachable primary interactions for new UI work.
- Security baseline MUST avoid embedding secrets in client code and MUST document any
  external API usage.

## Delivery Workflow

- Specifications MUST define independent user stories with acceptance scenarios.
- Plans MUST pass a Constitution Check before research/design completion and again before
  implementation starts.
- Tasks MUST be grouped by user story, identify dependencies, and include verification
  tasks for each delivered story.
- Pull requests/reviews MUST confirm constitution compliance and call out any justified
  exceptions in Complexity Tracking.

## Governance

This constitution supersedes conflicting local conventions for planning, specification,
and task generation in this repository.

Amendment process:
- Amendments MUST be proposed through a documented change to this file.
- Each amendment MUST include rationale and impact on templates/runtime guidance.
- Ratification requires maintainer approval in repository review workflow.

Versioning policy:
- MAJOR for backward-incompatible governance changes or principle removals/redefinitions.
- MINOR for new principles/sections or materially expanded guidance.
- PATCH for clarifications, wording improvements, and non-semantic edits.

Compliance review expectations:
- Every plan/spec/tasks artifact MUST include a constitution compliance check.
- Reviewers MUST block merges on unresolved constitution violations.
- Exceptions MUST be explicit, time-bounded, and tracked in writing.

**Version**: 1.0.0 | **Ratified**: 2026-03-12 | **Last Amended**: 2026-03-12
