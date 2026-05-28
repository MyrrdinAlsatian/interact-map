# Interactive Architecture Mapping

A platform for exploring infrastructure and architecture through server-rendered hypermedia pages, progressive enhancement with Unpoly, and isolated Web Component capabilities.

## Language

**GraphContract**:
A versioned JSON document that represents architecture graph state for interchange between backend and frontend capability islands. `schemaVersion`, `nodes[]`, and `edges[]` are mandatory on input; `errors[]` may be omitted and is normalized to an empty array when no diagnostics are present. When supplied as `base` to parser ingestion, it must be a complete, valid `GraphContract`; `base.errors` is not propagated and is ignored by the server during merge. Merge behaviour depends on the chosen `MergeStrategy`.
_Avoid_: graph payload, graph model without version

**MergeStrategy**:
A parameter accepted by `/uploads` and `/parser/ingest` that controls how incoming nodes and edges are reconciled with the current `GraphContract` base. Three values are supported: `skip` (default — existing nodes/edges take precedence on id collision), `update` (incoming values overwrite existing ones on collision), `archive-missing` (like `update`, plus any node not present in the incoming payload is soft-archived).
_Avoid_: replace mode, sync mode, overwrite mode

**GraphImportReport**:
A persisted JSON document (`shared/latest-import-report.json`) describing the outcome of the last successful import. Contains: `timestamp`, `sourceType`, `mergeStrategy`, `fileName`, `addedNodeIds`, `addedEdgeIds`, `skippedNodeIds`, `skippedEdgeIds`, `archivedNodeIds`, `modifiedNodes[]` (with field-level `changes[]`, `before`, `after`, `applied`), `modifiedEdges[]`, `totalNodes`, `totalEdges`.
_Avoid_: import log, change log without structure

**NodeLifecycle**:
A soft-delete pattern applied to `GraphNode` entries via metadata flags. A node is *active* by default; *archived* when `metadata.archived === true` (with `metadata.archivedAt` ISO-8601 timestamp); *purged* when physically removed from the `GraphContract` along with all its related `GraphEdge` entries. Archived nodes remain visible in the graph and inventory with a distinct badge, and can be restored.
_Avoid_: deleted node, removed node (which would imply physical removal), disabled node

**DryRun**:
A boolean flag (`dryRun: true`) accepted by `/uploads` and `/parser/ingest` that triggers a full parse → validate → merge → diff cycle without writing anything to disk. The response contains `persisted: false`, `dryRun: true`, and a `previewReport` (`GraphImportReport`) for inspection before committing the import.
_Avoid_: preview mode, simulation mode (reserved for incident simulation)

**ParserResult**:
A normalized parse output containing `schemaVersion`, canonical `nodes`, canonical `edges`, and diagnostics. If `parserResult.errors[]` contains any errors, ingestion is refused immediately with `PARSER_RESULT_INVALID`. Any `warnings[]` entry whose `severity` is `error` also blocks ingestion.
_Avoid_: parser response without stabilization

**ParserInput**:
A raw parser request envelope containing `sourceType`, `schemaVersion`, and `payload`.
_Avoid_: parser body, parser payload without version metadata

**ParserResult**:
A normalized parse output containing `schemaVersion`, canonical `nodes`, canonical `edges`, and diagnostics.
_Avoid_: parser response without stabilization

**GraphNode**:
A typed architecture node such as `application`, `service`, `server`, `container`, or `external`.
_Avoid_: generic node, entity

**GraphEdge**:
A dependency link between two `GraphNode` instances with criticality and dependency semantics.
_Avoid_: relationship, connection without semantics

**PageFragment**:
A server-rendered partial HTML target used for Unpoly fragment updates.
_Avoid_: SPA partial, client-rendered chunk

**UserRole**:
A role that governs access: `viewer`, `security`, `editor`, or `admin`.
_Avoid_: permission level, user group

**Analyst** / **Architect**:
Aliases used in some backend code for plan roles `editor` and `security` respectively; the plan prefers the business terms `editor` and `security`.
_Avoid_: viewer/admin replacements

## Relationships

- A **GraphContract** contains many **GraphNode** and many **GraphEdge** entries.
- A **GraphEdge** references exactly two **GraphNode** values: `source` and `target`.
- A **ParserInput** is transformed into a **ParserResult** before being consumed as part of a **GraphContract**.
- A **PageFragment** is served by the backend and may be substituted by Unpoly during progressive enhancement.

## Example dialogue

> **Dev:** "When a parser component receives `schemaVersion: '0.9'`, do we accept it or reject it?"
> **Domain expert:** "We accept it as the previous supported version, but only `'1.0'` is current. Anything older is rejected with a structured compatibility error."

## Flagged ambiguities

- `current` vs `schemaVersion` values: this project uses literal version strings like `1.0` and `0.9` while describing them abstractly as current/previous.
- `UserRole` labels are canonicalized to the feature plan values `viewer`, `security`, `editor`, and `admin`, even though some backend code currently refers to `analyst` and `architect` as aliases.
- `archived` node vs `missing` node in `archive-missing` strategy: a node absent from the incoming payload is archived (soft-delete), not purged. Purge is an explicit manual action via `POST /nodes/:id/purge`.
