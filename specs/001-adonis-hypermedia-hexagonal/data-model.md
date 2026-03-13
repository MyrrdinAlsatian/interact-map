# Data Model

## 1) GraphNode
- **Fields**:
  - `id` (string, required, unique)
  - `type` (enum: `application | service | container | server | external`, required)
  - `label` (string, required)
  - `metadata` (object, optional)
- **Validation rules**:
  - `id` must be non-empty and stable across updates
  - `type` must be one of the supported enum values

## 2) GraphEdge
- **Fields**:
  - `id` (string, required, unique)
  - `source` (GraphNode.id, required)
  - `target` (GraphNode.id, required)
  - `criticality` (enum: `critical | high | medium | low`, required)
  - `dependencyType` (enum: `required | optional | async | cache`, optional, default `required`)
  - `protocol` (string, optional)
- **Validation rules**:
  - `source` and `target` must reference existing node ids
  - duplicate edge ids are rejected

## 3) GraphContract
- **Fields**:
  - `schemaVersion` (string, required)
  - `nodes` (GraphNode[], required)
  - `edges` (GraphEdge[], required)
  - `errors` (ContractError[], required; empty on success)
- **Validation rules**:
  - accepted versions are current and previous only
  - older versions return structured compatibility errors
  - payload remains visualization-library agnostic

## 4) ContractError
- **Fields**:
  - `code` (string, required)
  - `message` (string, required)
  - `path` (string, optional)
  - `severity` (enum: `error | warning`, required)
- **Validation rules**:
  - `code` must be stable for client error handling

## 5) ParserInput
- **Fields**:
  - `sourceType` (string, required)
  - `schemaVersion` (string, required)
  - `payload` (unknown, required)
- **Validation rules**:
  - parser adapter validates source-specific schema before normalization

## 6) ParserResult
- **Fields**:
  - `schemaVersion` (string, required)
  - `nodes` (GraphNode[], required)
  - `edges` (GraphEdge[], required)
  - `errors` (ContractError[], required)
  - `warnings` (ContractError[], required)
- **Validation rules**:
  - deterministic output for identical input
  - malformed input returns structured errors (no implicit crashes)

## 7) PageFragmentResponse
- **Fields**:
  - `target` (string, required)
  - `statusCode` (number, required)
  - `html` (string, optional)
  - `error` (ContractError, optional)
- **Validation rules**:
  - missing fragment target produces `statusCode = 422` with structured `error`
  - success responses must include `html`

## 8) AuditLogEntry
- **Fields**:
  - `id` (string, required, unique)
  - `actorId` (string, required)
  - `actorRole` (enum: `viewer | analyst | architect | admin`, required)
  - `action` (string, required)
  - `resourceType` (string, required)
  - `resourceId` (string, required)
  - `timestamp` (ISO-8601 string, required)
  - `outcome` (enum: `success | denied | failure`, required)
  - `metadata` (object, optional)
- **Validation rules**:
  - all write/mutate operations must emit one audit record
  - audit entries are append-only

## Relationships
- GraphContract has many GraphNodes and GraphEdges.
- GraphEdge references GraphNode ids (`source`, `target`).
- ParserInput is transformed into ParserResult, which is merged into GraphContract.
- PageFragmentResponse wraps server fragment output for Unpoly interactions.
- Write/mutate use cases emit AuditLogEntry records.

## State Transitions
1. **Requested**: authenticated user requests page, fragment, or parse operation.
2. **Validated**: auth/RBAC and `schemaVersion` checks run at boundary.
3. **Parsed/Normalized**: parser input produces deterministic ParserResult.
4. **Merged**: validated ParserResult updates GraphContract state.
5. **Rendered**: GraphContract is adapted to UI component state.
6. **Observed/Audited**: metrics/logs are emitted and audit entries are appended for write/mutate actions.
