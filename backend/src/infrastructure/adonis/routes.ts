import router from '@adonisjs/core/services/router'

// ─── Public routes ────────────────────────────────────────────────────────────
router.get('/health', 'HealthChecksController.handle')
router.post('/users/register', 'UsersController.register')

// ─── Authenticated read routes ────────────────────────────────────────────────
router.group(() => {
  // User management
  router.get('/users', 'GetAllUserController.handle')

  // Inventory navigation (US1)
  router.get('/applications', 'InventoryController.applications')
  router.get('/services', 'InventoryController.services')
  router.get('/servers', 'InventoryController.servers')
  router.get('/containers', 'InventoryController.containers')
  router.get('/interactions', 'InventoryController.interactions')

  // Hypermedia fragment resolver (US1)
  router.get('/fragments/:target', 'FragmentsController.resolve')

  // Graph capability island page (US2)
  router.get('/graph', 'GraphController.index')

  // Observability (admin read — role guard applied inside controller)
  router.get('/observability/metrics', 'MetricsController.index')
  router.get('/audit/logs', 'AuditLogsController.index')
}).middleware(['auth'])

// ─── Role-gated write routes ──────────────────────────────────────────────────
router.group(() => {
  // Graph contract validation (US2, analyst+)
  router.post('/graph/contract/validate', 'GraphController.validate')

  // Incident simulation (US2, analyst+)
  router.post('/graph/simulate-incident', 'GraphSimulationController.simulate')

  // Parser ingestion (US3, analyst+)
  router.post('/parser/ingest', 'ParserController.ingest')
}).middleware(['auth', 'requireRole:analyst'])

// ─── Legacy / uploads ────────────────────────────────────────────────────────
router.post('/uploads', 'UploadsController.store')
