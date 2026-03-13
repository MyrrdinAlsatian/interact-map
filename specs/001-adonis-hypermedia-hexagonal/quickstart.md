# Quickstart

## Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL (for runtime integration phase)

## 1. Install backend dependencies
```bash
cd backend
npm install
```

## 2. Run quality checks
```bash
npm run lint
npm run typecheck
npm test
```

## 3. Start backend (scaffold mode)
```bash
npm run dev
```

## 4. Verify hypermedia baseline and progressive enhancement
- Disable JavaScript and confirm inventory/navigation routes render as complete HTML pages.
- Enable JavaScript and validate at least three Unpoly fragment interactions (filter, pagination, detail switch) without full reload.
- Trigger a missing fragment target and verify `422` structured error with fallback to full-page navigation.

## 5. Verify capability islands and contract policy
- Load sample graph into `architecture-graph` and confirm render completes under 2 seconds on local hardware.
- Execute incident simulation (`bfs` and `dfs`) and verify impacted node/edge highlighting.
- Run parser with current and previous `schemaVersion` fixtures and verify normalized deterministic output.
- Run parser with an older schema and verify structured compatibility error response.

## 6. Verify authentication, authorization, and audit behavior
- Confirm unauthenticated access is rejected.
- Confirm authenticated users can perform read operations.
- Confirm write/mutate operations are role-gated and denied when role is insufficient.
- Confirm each write/mutate operation emits an audit log entry with actor, action, target, timestamp, and outcome.

## 7. Verify observability signals
- Confirm structured JSON log events for route handling and parser execution.
- Confirm metrics emission for `request_latency_ms`, `fragment_error_count`, and `parse_error_count`.

## 8. Architecture verification checklist
- Domain layer has no direct framework dependencies.
- Infrastructure layer adapts framework/runtime concerns.
- Canonical graph contract remains independent from AntV X6 structures.
