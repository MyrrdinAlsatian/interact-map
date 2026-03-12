# API Architecture

This backend follows a hexagonal architecture under `src/`.

- `src/domain`: entities, contracts, and use cases.
- `src/infrastructure`: Adonis bindings, HTTP controllers, middleware, repositories, and validators.

Primary requirement: keep domain independent from framework details.
