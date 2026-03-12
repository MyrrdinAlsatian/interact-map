# Data Model

## 1) GraphNode
- **Fields**:
  - `id` (string, required, unique)
  - `type` (enum: `application | service | container | server | external`, required)
  - `label` (string, required)
  - `metadata` (object, optional)
- **Validation rules**:
  - `id` must be stable and non-empty
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
  - `source` and `target` must exist in current graph node set
  - self-loop handling must be explicit (allowed or rejected by use case)

## 3) GraphModel
- **Fields**:
  - `nodes` (GraphNode[])
  - `edges` (GraphEdge[])
- **Validation rules**:
  - duplicate ids are rejected
  - orphan edges are rejected
  - model stays library-agnostic (no X6-specific fields)

## 4) ParserInput
- **Fields**:
  - `sourceType` (string, required)
  - `payload` (unknown, required)
  - `version` (string, optional)
- **Validation rules**:
  - source-specific schema validation by parser adapter

## 5) ParserResult
- **Fields**:
  - `nodes` (GraphNode[])
  - `edges` (GraphEdge[])
  - `errors` ({ code: string; message: string; path?: string }[])
  - `warnings` ({ code: string; message: string; path?: string }[])
- **Validation rules**:
  - deterministic output for identical input
  - malformed input returns typed `errors`, not implicit crashes

## 6) PageFragment
- **Fields**:
  - `target` (string, required; Unpoly target selector/id)
  - `html` (string, required)
  - `status` (enum: `ok | validation_error | failure`, required)
- **Validation rules**:
  - target must map to an existing template fragment id in rendered page

## Relationships
- GraphModel has many GraphNodes and GraphEdges.
- GraphEdge references two GraphNodes.
- ParserResult contributes nodes/edges into GraphModel merge flow.
- PageFragment carries rendered partial UI state for hypermedia interactions.

## State Transitions
1. **Initial**: empty graph + server-rendered pages.
2. **Parsed**: ParserInput -> ParserResult.
3. **Merged**: ParserResult merged into GraphModel.
4. **Rendered**: GraphModel adapted to X6 visual state in Web Component.
5. **Simulated**: incident traversal marks impacted nodes/edges for visualization.
