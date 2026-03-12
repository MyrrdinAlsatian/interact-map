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

## Authentication
- Production target: SSO (OIDC/SAML via identity provider).
- Development fallback: local account authentication with secure password hash.

## Authorization (RBAC)
Suggested roles:
- Viewer: read-only access.
- Analyst: run incident simulations and offline imports.
- Architect: manage graph topology and inventory mappings.
- Admin: tenant/user/role and key policy administration.

## Audit Requirements
- Record imports, graph updates, role changes, and incident simulations with actor/time.
- Maintain immutable audit trail for security-sensitive operations.
