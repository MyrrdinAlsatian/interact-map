# Phase 0 Research

## Decision 1: Server-driven hypermedia baseline with AdonisJS + Edge + Unpoly
- **Decision**: Use AdonisJS server-rendered pages (Edge templates) as primary UI delivery, with Unpoly for partial updates.
- **Rationale**: Aligns with non-SPA requirement, preserves progressive enhancement, and keeps navigation resilient.
- **Alternatives considered**:
  - SPA with client router: rejected because it violates the requested architecture style.
  - HTMX-only: rejected to stay aligned with explicit Unpoly requirement.

## Decision 2: Capability islands implemented as native Web Components
- **Decision**: Implement graph and parser interactions as isolated Custom Elements.
- **Rationale**: Framework independence, clear encapsulation, and compatibility with server-rendered pages.
- **Alternatives considered**:
  - Framework components (React/Vue): rejected for unnecessary coupling and larger runtime footprint.
  - Inline script widgets: rejected due to weaker encapsulation and maintainability.

## Decision 3: Framework-agnostic graph domain model + adapter pattern
- **Decision**: Keep canonical graph model (`nodes`, `edges`) independent from AntV X6 and add a conversion adapter.
- **Rationale**: Protects domain logic from visualization library lock-in and simplifies parser/test integration.
- **Alternatives considered**:
  - Native X6 model as source of truth: rejected due to vendor coupling.
  - Multiple competing graph schemas: rejected to avoid fragmentation.

## Decision 4: Hexagonal architecture with domain-first use cases
- **Decision**: Place business logic in `src/domain` and framework/IO in `src/infrastructure`.
- **Rationale**: Enforces clean boundaries, improves testability, and supports long-term maintainability.
- **Alternatives considered**:
  - Controller-heavy architecture: rejected due to low cohesion and test difficulty.
  - Monolithic service layer without ports/contracts: rejected for weak separation of concerns.

## Decision 5: Validation and testing strategy
- **Decision**: Keep domain tests and repository tests independent from HTTP stack; validate parser/graph contracts via deterministic fixtures.
- **Rationale**: Fast feedback loops and confidence in core logic independent of UI/runtime concerns.
- **Alternatives considered**:
  - End-to-end-only tests: rejected due to slower diagnostics and weaker unit-level guarantees.

## Decision 6: Parser contract and error model
- **Decision**: Parser Web Components must emit normalized graph fragments with explicit structured errors.
- **Rationale**: Enables predictable integration and reliable user feedback in progressive enhancement flows.
- **Alternatives considered**:
  - Throw-only parser errors: rejected because unstructured errors are harder to surface in UI fragments.
