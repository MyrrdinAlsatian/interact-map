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
| `editor` | 1 | Standard writes/imports (incident simulation, parser ingestion, contract validation) |
| `security` | 2 | Security and observability oversight, audit review |
| `admin` | 3 | All operations + privileged administration |

Role guard: `requireRole(minimumRole)` factory from `auth_middleware.ts`. Returns 403 if user level < required level.

**Route RBAC policy summary:**
- `GET /applications`, `/services`, `/servers`, `/containers`, `/interactions`, `/graph` — `viewer+`
- `GET /nodes/:id` — `viewer+`
- `POST /nodes/:id/archive`, `/restore`, `/purge` — `viewer+`
- `GET /imports/latest` — `viewer+`
- `POST /uploads` — `viewer+`
- `POST /graph/contract/validate` — `editor+`
- `POST /graph/simulate-incident` — `editor+`
- `POST /parser/ingest` — `editor+`
- `GET /audit/logs` — `security+`
- `GET /observability/metrics` — `security+`

## Audit Requirements (Feature 001)

All write/mutate operations emit an `AuditLogEntry` via `ObservabilityRepository.appendAuditLog()`:

```typescript
{
  id: string         // UUID
  actorId: string    // auth user id
  actorRole: string  // 'viewer' | 'security' | 'editor' | 'admin'
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
- `POST /users/register` — outcome: success | failure
- `POST /uploads` — outcome: success

### Write/Mutate Endpoint Audit Coverage Map

| Endpoint | Controller action | Audit action | Outcome coverage |
|---|---|---|---|
| `POST /users/register` | `UsersController.register` | `users.register` | success + failure |
| `POST /graph/contract/validate` | `GraphController.validate` | `graph.contract.validate` | success + failure |
| `POST /graph/simulate-incident` | `GraphSimulationController.simulate` | `graph.simulate-incident` | success |
| `POST /parser/ingest` | `ParserController.ingest` | `parser.ingest` | success + failure |
| `POST /parser/ingest` (dry-run) | `ParserController.ingest` | `parser.preview` | success |
| `POST /uploads` | `UploadsController.store` | `uploads.store` | success |
| `POST /uploads` (dry-run) | `UploadsController.store` | `uploads.preview` | success |
| `POST /nodes/:id/archive` | `NodeController.archive` | `node.archive` | success + failure |
| `POST /nodes/:id/restore` | `NodeController.restore` | `node.restore` | success + failure |
| `POST /nodes/:id/purge` | `NodeController.purge` | `node.purge` | success + failure |

Audit log is append-only. Query via `GET /audit/logs` (admin only).

