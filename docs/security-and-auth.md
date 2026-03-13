# Security and Authentication Blueprint

## Encryption Requirements
- Client side: AES-256-GCM for project payload encryption before local persistence/export.
- Backend side: AES-256-GCM for sensitive project payload fields and imported source snapshots.
- In transit: TLS required for all browser/API communication.

## Key Management Strategy
- Envelope model:
  - Data Encryption Key (DEK) encrypts payloads.
  - Key Encryption Key (KEK) managed by key management service wraps DEK.
- Key references stored as metadata (`key_ref`) with encrypted payload.
- Rotation policy:
  - Scheduled KEK rotation.
  - On-demand rotation after incidents.
- Access control:
  - Only backend crypto adapters and audited jobs can unwrap keys.

## Authentication (Feature 001)

- Development baseline: Bearer token authentication via `authMiddleware` in `backend/src/infrastructure/middleware/auth_middleware.ts`.
- Authenticated user is available on `ctx.auth.user` with fields: `id`, `role`.
- Public routes (no auth): `GET /health`, `POST /users/register`.
- All other routes require valid authenticated user.

## Authorization / RBAC (Feature 001)

Role hierarchy implemented in `backend/src/infrastructure/adonis/kernel.ts`:

| Role | Level | Write permissions |
|------|-------|-------------------|
| `viewer` | 0 | Read only |
| `analyst` | 1 | Incident simulation, parser ingestion, contract validation |
| `architect` | 2 | All analyst operations + topology edits |
| `admin` | 3 | All operations + audit log access |

Role guard: `requireRole(minimumRole)` factory from `auth_middleware.ts`. Returns 403 if user level < required level.

**Route RBAC policy summary:**
- `GET /applications`, `/services`, `/servers`, `/containers`, `/interactions`, `/graph` — `viewer+`
- `POST /graph/contract/validate` — `analyst+`
- `POST /graph/simulate-incident` — `analyst+`
- `POST /parser/ingest` — `analyst+`
- `GET /audit/logs` — `admin` (inline check in `AuditLogsController`)
- `GET /observability/metrics` — `viewer+` (any authenticated)

## Audit Requirements (Feature 001)

All write/mutate operations emit an `AuditLogEntry` via `ObservabilityRepository.appendAuditLog()`:

```typescript
{
  id: string         // UUID
  actorId: string    // auth user id
  actorRole: string  // 'viewer' | 'analyst' | 'architect' | 'admin'
  action: string     // e.g. 'graph.simulate-incident'
  resourceType: string
  resourceId: string
  timestamp: string  // ISO-8601
  outcome: 'success' | 'denied' | 'failure'
  metadata?: object
}
```

Operations that emit audit entries:
- `POST /graph/contract/validate` — outcome: success | failure
- `POST /graph/simulate-incident` — outcome: success
- `POST /parser/ingest` — outcome: success | failure

Audit log is append-only. Query via `GET /audit/logs` (admin only).

