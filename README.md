# Interactive Map

System Architecture Mapping Platform scaffold aligned with hypermedia-first, progressive enhancement principles.

## Run

Serve the folder with a static server and open `index.html`:

- `npx serve .`
- or any equivalent static server

## Backend Runtime

The backend requires Node.js `>=20.6.0` (AdonisJS engine requirement).

Recommended workflow:

- `nvm use` at repository root (uses `.nvmrc`)
- `cd backend && nvm use`

Enforcement:

- `backend/package.json` defines `engines.node` and `engines.npm`
- `backend/.npmrc` sets `engine-strict=true` so unsupported versions fail early

## Delivered Outputs

- Architecture overview: `docs/system-architecture-overview.md`
- Frontend architecture: `docs/frontend-architecture.md`
- SQL schema: `database/schema.sql`
- Backend AdonisJS hexagonal scaffold: `backend/`
- Graph Web Component: `frontend/components/architecture-graph.js`
- X6 adapter: `frontend/lib/x6-adapter.js`
- Docker parsers:
	- `frontend/lib/docker-compose-parser.js`
	- `frontend/lib/docker-inspect-parser.js`
	- `frontend/lib/docker-ps-parser.js`
- Incident impact algorithm: `frontend/lib/incident-impact.js`
- Offline store (IndexedDB/Dexie): `frontend/lib/offline-store.js`
- Example dataset: `examples/project-dataset.json`

## Governance

Project governance and delivery rules are defined in `.specify/memory/constitution.md`.
