import router from '@adonisjs/core/services/router'

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

// ─── Public routes ────────────────────────────────────────────────────────────
const HealthChecksController = () => import('#infrastructure/controllers/health_checks_controller')
const UsersController = () => import('#infrastructure/controllers/users_controller')
const GetAllUserController = () => import('#infrastructure/controllers/getall_user_controller')
const InventoryController = () => import('#infrastructure/controllers/inventory_controller')
const FragmentsController = () => import('#infrastructure/controllers/fragments_controller')
const GraphController = () => import('#infrastructure/controllers/graph_controller')
const GraphSimulationController = () => import('#infrastructure/controllers/graph_simulation_controller')
const MetricsController = () => import('#infrastructure/controllers/metrics_controller')
const AuditLogsController = () => import('#infrastructure/controllers/audit_logs_controller')
const ParserController = () => import('#infrastructure/controllers/parser_controller')
const UploadsController = () => import('#infrastructure/controllers/uploads_controller')

router.get('/health', [HealthChecksController, 'handle'])
router.post('/users/register', [UsersController, 'register'])

// ─── Authenticated read routes ────────────────────────────────────────────────
router.group(() => {
  // User management
  router.get('/users/all', [GetAllUserController, 'handle'])

  // Inventory navigation (US1)
  router.get('/applications', [InventoryController, 'applications'])
  router.get('/services', [InventoryController, 'services'])
  router.get('/servers', [InventoryController, 'servers'])
  router.get('/containers', [InventoryController, 'containers'])
  router.get('/interactions', [InventoryController, 'interactions'])

  // Hypermedia fragment resolver (US1)
  router.get('/fragments/:target', [FragmentsController, 'resolve'])

  // Graph capability island page (US2)
  router.get('/graph', [GraphController, 'index'])

  // Observability (admin read — role guard applied inside controller)
  router.get('/observability/metrics', [MetricsController, 'index'])
  router.get('/audit/logs', [AuditLogsController, 'index'])
})

// // ─── Role-gated write routes ──────────────────────────────────────────────────
// router.group(() => {
//   // Graph contract validation (US2, analyst+)
//   router.post('/graph/contract/validate', [GraphController, 'validate'])

//   // Incident simulation (US2, analyst+)
//   router.post('/graph/simulate-incident', [GraphSimulationController, 'simulate'])

//   // Parser ingestion (US3, analyst+)
//   router.post('/parser/ingest', [ParserController, 'ingest'])
// }).middleware(['auth', 'requireRole:analyst'])

// ─── Legacy / uploads ────────────────────────────────────────────────────────
router.post('/uploads', [UploadsController, 'store'])
