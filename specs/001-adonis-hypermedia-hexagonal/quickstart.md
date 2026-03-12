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

## 4. Verify hypermedia behavior
- Open primary route and navigate inventory pages as full server responses.
- Enable JavaScript and confirm Unpoly updates target fragments without full reload.

## 5. Verify capability islands
- Load sample graph into `architecture-graph` component.
- Trigger node focus/highlight and incident simulation.
- Validate parser component output with known fixtures.

## 6. Architecture verification checklist
- Domain layer has no direct framework dependencies.
- Infrastructure layer adapts framework/runtime concerns.
- Canonical graph model is independent from AntV X6 structures.
