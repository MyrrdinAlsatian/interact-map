# Phase 0 Research

## Decision 1: Server-driven hypermedia baseline with AdonisJS + Unpoly
- **Decision**: Use AdonisJS server-rendered pages as primary delivery and Unpoly for fragment updates.
- **Rationale**: Satisfies non-SPA baseline and guarantees no-JS usability.
- **Alternatives considered**:
  - SPA router first: rejected because it conflicts with FR-003.
  - Client-only rendering islands without server baseline: rejected due to degraded progressive enhancement.

## Decision 2: Capability islands as native Web Components
- **Decision**: Implement graph and parser as independent custom elements.
- **Rationale**: Keeps islands framework-agnostic and embeddable in server-rendered pages.
- **Alternatives considered**:
  - React/Vue components: rejected for unnecessary runtime coupling.
  - Monolithic inline scripts: rejected for weaker encapsulation and testability.

## Decision 3: Versioned graph contract with dual-boundary validation
- **Decision**: Adopt a versioned JSON contract (`schemaVersion`, `nodes[]`, `edges[]`, `errors[]`) validated in backend and frontend boundaries.
- **Rationale**: Supports safe evolution across parser and graph islands with deterministic failures.
- **Alternatives considered**:
  - Unversioned schema: rejected due to high compatibility risk.
  - Build-time TypeScript-only contracts: rejected because runtime payloads still need validation.

## Decision 4: Schema compatibility policy
- **Decision**: Support only current and previous `schemaVersion`; reject older payloads with structured compatibility errors.
- **Rationale**: Balances backward compatibility with manageable maintenance.
- **Alternatives considered**:
  - Current-only support: rejected as too brittle during rollout.
  - Infinite historical support: rejected due to maintenance cost and complexity.

## Decision 5: Auth and authorization baseline
- **Decision**: Require authentication globally, allow read for authenticated users, and gate write/mutate operations by role.
- **Rationale**: Aligns least privilege with operational usability.
- **Alternatives considered**:
  - Public read/write: rejected for security and audit requirements.
  - Strict RBAC on every action from day one: rejected as unnecessary initial complexity.

## Decision 6: Missing fragment behavior
- **Decision**: Return `422` structured errors for missing Unpoly targets and trigger full-page fallback navigation.
- **Rationale**: Makes failures explicit while preserving user flow.
- **Alternatives considered**:
  - Silent fallback with `200`: rejected because errors become invisible.
  - Empty `204` fragment response: rejected due to ambiguous client behavior.

## Decision 7: Observability and audit logging
- **Decision**: Emit structured JSON logs and core metrics (`request_latency_ms`, `fragment_error_count`, `parse_error_count`) plus audit logs on write/mutate actions.
- **Rationale**: Provides minimum operational visibility with compliance traceability.
- **Alternatives considered**:
  - Logs only: rejected due to weak signal for regressions.
  - Full tracing stack immediately: deferred as unnecessary initial complexity.

## Decision 8: Hexagonal structure and test strategy
- **Decision**: Keep business logic in domain/use cases with infrastructure adapters, verified via unit tests, lint, typecheck, and manual progressive-enhancement checks.
- **Rationale**: Maintains boundaries and fast feedback loops.
- **Alternatives considered**:
  - Controller-centric business logic: rejected due to low cohesion.
  - End-to-end-only testing: rejected due to slower diagnostics.
