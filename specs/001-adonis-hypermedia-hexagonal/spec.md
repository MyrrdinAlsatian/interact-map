# Feature Specification: Adonis Hypermedia Hexagonal Foundation

**Feature Branch**: `001-adonis-hypermedia-hexagonal`  
**Created**: 2026-03-13  
**Status**: Draft  
**Input**: User description: "AdonisJS backend for hypermedia app with Unpoly, Web Components islands (AntV X6 and parser), hexagonal architecture and clean code"

## Clarifications

### Session 2026-03-13

- Q: What baseline access-control model should apply to pages and APIs? → A: Authentication required; read access for all authenticated users, write/mutate actions restricted by role.
- Q: Which contract strategy should backend and capability islands use for graph/parser payloads? → A: Versioned JSON contract (`schemaVersion`, `nodes[]`, `edges[]`, `errors[]`) validated on both backend and frontend.
- Q: How should the system handle Unpoly requests that target a missing fragment? → A: Return structured fragment error (`422` + error payload) and trigger fallback to full-page navigation.
- Q: What baseline observability should the system provide? → A: Structured JSON logs + core metrics (`request_latency_ms`, `fragment_error_count`, `parse_error_count`) and audit logging for write/mutate actions.
- Q: What schema-version compatibility policy should parser and graph contract support? → A: Support current and previous `schemaVersion`; reject older versions with structured error.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Server-driven navigation foundation (Priority: P1)

As a user, I can navigate architecture pages rendered by the server and progressively enhanced with Unpoly, so the app remains usable without full SPA behavior.

**Why this priority**: This is the baseline product behavior and enables all other capabilities.

**Independent Test**: Open pages with JavaScript disabled (full reload) and with JavaScript enabled (Unpoly partial updates) and confirm both flows work.

**Acceptance Scenarios**:

1. **Given** the user is on the graph page, **When** they navigate to inventory pages, **Then** the server returns full HTML pages.
2. **Given** JavaScript and Unpoly are enabled, **When** the user applies table filters, **Then** only target fragments update.

---

### User Story 2 - Graph capability island (Priority: P2)

As an architect, I can interact with the architecture graph via a dedicated Web Component powered by AntV X6.

**Why this priority**: Graph visualization is the core interaction but can be layered on top of server-driven pages.

**Independent Test**: Load graph JSON into the Web Component and verify zoom, pan, selection, dependency highlight, and incident simulation.

**Acceptance Scenarios**:

1. **Given** a valid graph model, **When** the component loads, **Then** nodes and edges render correctly.
2. **Given** a selected failed node, **When** simulation runs, **Then** impacted nodes/edges are highlighted.

---

### User Story 3 - Parser capability island (Priority: P3)

As an operator, I can parse infrastructure input through a custom Web Component parser and transform it into graph-ready data.

**Why this priority**: Parsing accelerates onboarding infrastructure data but depends on graph model conventions.

**Independent Test**: Provide parser input payload and verify normalized output graph fragment and validation errors.

**Acceptance Scenarios**:

1. **Given** supported parser input, **When** parsing runs, **Then** normalized nodes/edges are produced.
2. **Given** malformed input, **When** parsing runs, **Then** structured validation errors are returned.

### Edge Cases

- Missing Unpoly fragment target returns `422` with structured error payload and client fallback to full-page navigation.
- How does the graph component behave on invalid or partially missing node/edge payloads?
- Parser accepts current and previous `schemaVersion`; older versions are rejected with structured compatibility errors.
- What happens when JavaScript is unavailable (degrade to server-only navigation)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST use AdonisJS as backend framework for server-rendered hypermedia pages.
- **FR-002**: System MUST use Unpoly for progressive enhancement of navigation and form/fragment updates.
- **FR-003**: System MUST avoid SPA-first architecture; full-page server responses MUST remain valid.
- **FR-004**: System MUST implement graph interactions as a Web Component using AntV X6.
- **FR-005**: System MUST implement custom parsing as a Web Component isolated from server rendering concerns.
- **FR-006**: System MUST follow hexagonal architecture boundaries (`domain` vs `infrastructure`).
- **FR-007**: System MUST follow clean code principles (small modules, explicit dependencies, testable use cases).
- **FR-008**: System MUST define a framework-agnostic graph contract shared by backend and capability islands.
- **FR-009**: System MUST require authentication for application access, allow read operations for authenticated users, and restrict write/mutate operations through role-based authorization.
- **FR-010**: System MUST expose and consume a versioned JSON contract with `schemaVersion`, `nodes[]`, `edges[]`, and `errors[]`, with runtime schema validation on backend and frontend boundaries.
- **FR-011**: System MUST return `422` structured fragment errors for missing Unpoly targets and provide deterministic client fallback to full-page navigation.
- **FR-012**: System MUST emit structured JSON logs and core metrics (`request_latency_ms`, `fragment_error_count`, `parse_error_count`) for backend and capability-island interactions.
- **FR-013**: System MUST produce audit logs for all write/mutate operations including actor identity, action, target resource, timestamp, and outcome.
- **FR-014**: System MUST support current and previous `schemaVersion` values for graph/parser contracts and MUST reject older versions with structured compatibility errors.

### Constitution Alignment *(mandatory)*

- **CA-001 Scope Mapping**: Stories map to concrete user-visible outcomes (navigation, graph interaction, parsing).
- **CA-002 Runtime Boundaries**: Backend and frontend expansions remain explicit and justified.
- **CA-003 Verification Plan**: Each story includes independent verification criteria.
- **CA-004 Documentation Impact**: Architecture and quickstart docs update with implementation.
- **CA-005 Complexity Justification**: Added dependencies (Unpoly, AntV X6) are justified by capability-island requirements.

### Key Entities *(include if feature involves data)*

- **GraphNode**: A typed architecture node (`application`, `service`, `container`, `server`, `external`) with metadata.
- **GraphEdge**: A dependency link between nodes with criticality and dependency semantics.
- **ParserInput**: Raw source payload consumed by custom parser components.
- **ParserResult**: Normalized graph fragment plus structured parse diagnostics.
- **GraphContract**: Versioned JSON document containing `schemaVersion`, `nodes[]`, `edges[]`, and `errors[]` used as canonical interchange between backend and capability islands.
- **PageFragment**: Server-rendered partial HTML target used by Unpoly updates.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of primary page routes work as full server-rendered HTML without JavaScript.
- **SC-002**: At least 3 key interactions (filter, pagination, detail switch) update via Unpoly without full reload.
- **SC-003**: Graph component renders and interacts with a sample graph under 2 seconds on local dev hardware.
- **SC-004**: Parser component transforms supported input into valid graph fragments with deterministic output schema.
- **SC-005**: 100% of write/mutate operations generate audit log entries with actor, action, target, timestamp, and outcome.
