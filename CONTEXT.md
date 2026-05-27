# Interactive Architecture Mapping

A platform for exploring infrastructure and architecture through server-rendered hypermedia pages, progressive enhancement with Unpoly, and isolated Web Component capabilities.

## Language

**GraphContract**:
A versioned JSON document that represents architecture graph state for interchange between backend and frontend capability islands. `schemaVersion`, `nodes[]`, and `edges[]` are mandatory on input; `errors[]` may be omitted and is normalized to an empty array when no diagnostics are present. When supplied as `base` to parser ingestion, it must be a complete, valid `GraphContract`; `base.errors` is not propagated and is ignored by the server during merge. Merge collisions preserve existing `base` nodes/edges by id.
_Avoid_: graph payload, graph model without version

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
