# System Architecture Mapping Platform - Overview

## Purpose
The platform documents applications, services, infrastructure, and runtime dependencies to support architecture visualization, incident impact analysis, and offline Docker infrastructure exploration.

## Architectural Style
- Hypermedia-first, server-rendered HTML for primary navigation and data views.
- Progressive enhancement with Unpoly for partial page updates and form interactions.
- Client-side capability islands via Web Components for complex interactions:
  - Graph visualization
  - Docker source parsing
  - Incident simulation

## High-Level Components
1. Presentation Layer (server-driven)
   - AdonisJS routes/controllers render HTML views.
   - Inventory pages (applications, services, servers, containers, interactions) remain server-rendered.
   - Unpoly progressively enhances filters, pagination, and partial updates.
2. Capability Islands (browser)
   - `architecture-graph` Web Component renders and interacts with graph data using X6.
   - Parsing modules import Docker files client-side.
   - Offline store persists projects and graph snapshots in IndexedDB.
3. Application Layer
   - Use cases orchestrate domain operations (import, map, analyze, export).
4. Domain Layer
   - Framework-agnostic entities and domain services.
   - Canonical graph model independent from visualization engine.
5. Infrastructure Layer
   - PostgreSQL persistence adapters.
   - AES-256 crypto services and key management integration.
   - Authentication integration adapters (SSO in production, local account in development).

## Core Flows
- Architecture mapping: import manual records or Docker files → normalize to graph model → save project.
- Visualization: load graph model from backend or local cache → convert through X6 adapter → render interactive graph.
- Incident simulation: pick failing node → run impact traversal (BFS/DFS) → highlight impacted edges/nodes.
- Offline analysis: import Docker sources client-side → build and explore graph in browser → export JSON project bundle.

## Security and Access
- Encryption at rest and in transit required on backend and client-side project payloads.
- AES-256 envelope encryption model with key rotation policy.
- RBAC enforced on project/resources (viewer, analyst, architect, admin).
- SSO target for production, local username/password for development.

## Progressive Enhancement Rules
- Baseline UX must function without JavaScript for navigation and inventory reading.
- JavaScript adds:
  - partial updates (Unpoly)
  - graph interactions (Web Component)
  - local parsing and offline operations

## Non-Functional Priorities
- Simplicity: explicit boundaries and small modules.
- Maintainability: hexagonal architecture and framework-agnostic domain model.
- Framework independence: graph model and algorithms decoupled from UI libraries.
- Evolvability: adapter pattern for graph engines and infrastructure sources.
