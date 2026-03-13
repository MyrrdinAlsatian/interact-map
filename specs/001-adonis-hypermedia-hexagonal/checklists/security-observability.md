# Security-Observability Checklist: Adonis Hypermedia Hexagonal Foundation

**Purpose**: Validate the quality of security and observability requirements for completeness, clarity, consistency, measurability, and traceability.
**Created**: 2026-03-13
**Feature**: `/specs/001-adonis-hypermedia-hexagonal/spec.md`

**Note**: This checklist evaluates requirement quality and readiness for author pre-PR refinement.

## Requirement Completeness

- [ ] CHK001 Are authentication requirements explicitly defined for every application entry path (full-page routes, fragment routes, and ingestion endpoints)? [Completeness, Spec §FR-009, Gap]
- [ ] CHK002 Are authorization requirements complete for all write/mutate capability classes, including who is allowed and who is denied? [Completeness, Spec §FR-009, Spec §FR-013]
- [ ] CHK003 Are observability requirements complete across all runtime surfaces (backend requests, fragment flows, graph island, parser island)? [Completeness, Spec §FR-012]
- [ ] CHK004 Are audit-log requirements complete for all mutation outcomes, including success and failure outcomes? [Completeness, Spec §FR-013, Gap]
- [ ] CHK005 Are requirements complete for contract-validation telemetry when payloads fail schema or version checks? [Completeness, Spec §FR-010, Spec §FR-014, Gap]

## Requirement Clarity

- [ ] CHK006 Is the phrase "read operations for authenticated users" clarified with explicit boundaries for read-like endpoints that can trigger stateful side effects? [Clarity, Ambiguity, Spec §FR-009]
- [ ] CHK007 Is "role-based authorization" defined with a concrete role matrix or equivalent normative mapping? [Clarity, Gap, Spec §FR-009]
- [ ] CHK008 Are "structured JSON logs" requirements explicit about mandatory fields needed for correlation, attribution, and incident triage? [Clarity, Spec §FR-012]
- [ ] CHK009 Are metric definitions clear enough to prevent inconsistent interpretation of `request_latency_ms`, `fragment_error_count`, and `parse_error_count`? [Clarity, Spec §FR-012]
- [ ] CHK010 Is "audit logs for all write/mutate operations" unambiguous about what qualifies as a mutate operation? [Clarity, Ambiguity, Spec §FR-013]
- [ ] CHK011 Are `422` structured fragment-error requirements explicit about security-sensitive fields that must be excluded from client-visible payloads? [Clarity, Spec §FR-011, Gap]

## Requirement Consistency

- [ ] CHK012 Do clarifications and FR-009 remain consistent on access policy (authenticated read baseline vs role-gated mutation)? [Consistency, Spec §Clarifications, Spec §FR-009]
- [ ] CHK013 Do FR-012 observability obligations align with success criteria and scenario statements without omissions or contradictions? [Consistency, Spec §FR-012, Spec §Success Criteria]
- [ ] CHK014 Do FR-013 audit requirements stay consistent with routes/controllers implied by user stories and tasks? [Consistency, Spec §FR-013, Tasks §T010, Tasks §T050, Tasks §T061]
- [ ] CHK015 Are security requirements consistent between fragment fallback behavior and authentication expectations during fallback navigation? [Consistency, Spec §FR-009, Spec §FR-011]

## Acceptance Criteria Quality

- [ ] CHK016 Is SC-005 measurable with objective counting rules (numerator, denominator, and exclusion rules)? [Acceptance Criteria, Measurability, Spec §SC-005]
- [ ] CHK017 Are acceptance criteria defined for observability signal quality (field presence, validity, and timeliness), not just existence? [Acceptance Criteria, Gap, Spec §FR-012]
- [ ] CHK018 Can each security requirement be objectively validated from written acceptance criteria without relying on inferred implementation detail? [Measurability, Traceability, Spec §FR-009, Spec §FR-013, Gap]
- [ ] CHK019 Are failure-path acceptance criteria present for unauthorized attempts and malformed payloads? [Acceptance Criteria, Exception Flow, Gap]

## Scenario Coverage

- [ ] CHK020 Are primary security scenarios specified for authenticated reads, authorized writes, and denied writes? [Coverage, Spec §FR-009]
- [ ] CHK021 Are alternate security scenarios defined for degraded client behavior (JavaScript off, Unpoly bypass) without weakening auth/authorization requirements? [Coverage, Spec §FR-003, Spec §FR-009, Spec §FR-011]
- [ ] CHK022 Are exception scenarios specified for missing fragment targets, schema validation failures, and unsupported schema versions with consistent observability expectations? [Coverage, Exception Flow, Spec §FR-011, Spec §FR-012, Spec §FR-014]
- [ ] CHK023 Are recovery scenarios defined for continuing operation after security-relevant failures (authorization deny, parser validation reject, fragment resolution failure)? [Coverage, Recovery Flow, Gap]

## Edge Case Coverage

- [ ] CHK024 Are edge-case requirements defined for missing or invalid actor identity during audit logging? [Edge Case, Gap, Spec §FR-013]
- [ ] CHK025 Are edge-case requirements defined for clock skew or timestamp normalization affecting audit-event ordering? [Edge Case, Assumption, Spec §FR-013, Gap]
- [ ] CHK026 Are requirements defined for metric emission behavior during partial failures (for example, error before normal completion path)? [Edge Case, Spec §FR-012, Gap]
- [ ] CHK027 Are boundary requirements defined for schema-version transition windows to ensure security controls do not drift between accepted versions? [Edge Case, Spec §FR-014]

## Non-Functional Requirements

- [ ] CHK028 Are security-related non-functional requirements specified for log/audit data retention, integrity, and access control boundaries? [Non-Functional, Gap, Spec §FR-012, Spec §FR-013]
- [ ] CHK029 Are non-functional latency expectations for auth/authorization checks specified to prevent hidden performance regressions under policy enforcement? [Non-Functional, Gap]
- [ ] CHK030 Are reliability requirements defined for observability pipelines (loss tolerance, backpressure behavior, and degradation mode)? [Non-Functional, Gap, Spec §FR-012]

## Dependencies & Assumptions

- [ ] CHK031 Are dependency assumptions documented for identity provider/session middleware and their impact on authorization semantics? [Dependencies, Assumption, Plan §Technical Context, Spec §FR-009]
- [ ] CHK032 Are assumptions documented for storage availability of audit and metrics persistence, including required behavior when persistence is unavailable? [Dependencies, Assumption, Spec §FR-012, Spec §FR-013, Gap]

## Ambiguities & Conflicts

- [ ] CHK033 Is the term "deterministic" in fallback/error handling defined with precise observable outcomes for security and monitoring contexts? [Ambiguity, Spec §FR-011]
- [ ] CHK034 Do any requirements conflict between broad authenticated-read access and protection of potentially sensitive observability/audit endpoints? [Conflict, Spec §FR-009, Spec §FR-012, Spec §FR-013]
- [ ] CHK035 Is a requirement-to-task traceability scheme explicit enough to detect future security/observability requirement drift? [Traceability, Gap, Tasks §Phase 2, Tasks §Phase 6]

## Notes

- Mark items as complete with `[x]` when the requirement text is sufficiently precise and testable.
- Resolve `[Gap]`, `[Ambiguity]`, `[Conflict]`, and `[Assumption]` items by updating source requirements and linking revisions.
- Keep this checklist as author pre-PR gate material for requirement quality hardening.
