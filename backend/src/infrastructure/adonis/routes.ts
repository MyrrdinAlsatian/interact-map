import Route from '@ioc:Adonis/Core/Route'

// ─── Public routes ────────────────────────────────────────────────────────────
Route.get('/health', 'HealthChecksController.handle')
Route.post('/users/register', 'UsersController.register')

// ─── Authenticated read routes ────────────────────────────────────────────────
Route.group(() => {
  // User management
  Route.get('/users', 'GetAllUserController.handle')

  // Inventory navigation (US1)
  Route.get('/applications', 'InventoryController.applications')
  Route.get('/services', 'InventoryController.services')
  Route.get('/servers', 'InventoryController.servers')
  Route.get('/containers', 'InventoryController.containers')
  Route.get('/interactions', 'InventoryController.interactions')

  // Hypermedia fragment resolver (US1)
  Route.get('/fragments/:target', 'FragmentsController.resolve')

  // Graph capability island page (US2)
  Route.get('/graph', 'GraphController.index')

  // Observability (admin read — role guard applied inside controller)
  Route.get('/observability/metrics', 'MetricsController.index')
  Route.get('/audit/logs', 'AuditLogsController.index')
}).middleware(['auth'])

// ─── Role-gated write routes ──────────────────────────────────────────────────
Route.group(() => {
  // Graph contract validation (US2, analyst+)
  Route.post('/graph/contract/validate', 'GraphController.validate')

  // Incident simulation (US2, analyst+)
  Route.post('/graph/simulate-incident', 'GraphSimulationController.simulate')

  // Parser ingestion (US3, analyst+)
  Route.post('/parser/ingest', 'ParserController.ingest')
}).middleware(['auth', 'requireRole:analyst'])

// ─── Legacy / uploads ────────────────────────────────────────────────────────
Route.post('/uploads', 'UploadsController.store')

