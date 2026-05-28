import router from '@adonisjs/core/services/router'
import HealthChecksController from '#infrastructure/controllers/health_checks_controller'
import UsersController from '#infrastructure/controllers/users_controller'
import GetAllUserController from '#infrastructure/controllers/getall_user_controller'
import DashboardController from '#infrastructure/controllers/dashboard_controller'
import InventoryController from '#infrastructure/controllers/inventory_controller'
import FragmentsController from '#infrastructure/controllers/fragments_controller'
import GraphController from '#infrastructure/controllers/graph_controller'
import MetricsController from '#infrastructure/controllers/metrics_controller'
import AuditLogsController from '#infrastructure/controllers/audit_logs_controller'
import UploadsController from '#infrastructure/controllers/uploads_controller'
import ParserController from '#infrastructure/controllers/parser_controller'
import NodeController from '#infrastructure/controllers/node_controller'
import ImportReportController from '#infrastructure/controllers/import_report_controller'

router.get('/', [DashboardController, 'index'])

// ─── Public routes ────────────────────────────────────────────────────────────

router.get('/health', [HealthChecksController, 'handle'])
router.post('/users/register', [UsersController, 'register'])

const inventoryController = new InventoryController()
const fragmentsController = new FragmentsController()
const graphController = new GraphController()
const parserController = new ParserController()
const nodeController = new NodeController()
const importReportController = new ImportReportController()

// ─── Authenticated read routes ────────────────────────────────────────────────
router.group(() => {
  // User management
  router.get('/users/all', [GetAllUserController, 'handle'])

  // Inventory navigation (US1)
  router.get('/applications', (ctx) => inventoryController.applications(ctx as any))
  router.get('/services', (ctx) => inventoryController.services(ctx as any))
  router.get('/servers', (ctx) => inventoryController.servers(ctx as any))
  router.get('/containers', (ctx) => inventoryController.containers(ctx as any))
  router.get('/interactions', (ctx) => inventoryController.interactions(ctx as any))

  // Hypermedia fragment resolver (US1)
  router.get('/fragments/:target', (ctx) => fragmentsController.resolve(ctx as any))

  // Graph capability island page (US2)
  router.get('/graph', (ctx) => graphController.index(ctx as any))
  router.get('/imports/latest', (ctx) => importReportController.show(ctx as any))

  // Node details and lifecycle actions
  router.get('/nodes/:id', (ctx) => nodeController.show(ctx as any))
  router.post('/nodes/:id/archive', (ctx) => nodeController.archive(ctx as any))
  router.post('/nodes/:id/restore', (ctx) => nodeController.restore(ctx as any))
  router.post('/nodes/:id/purge', (ctx) => nodeController.purge(ctx as any))

  // Parser ingestion (US3) — active JSON merge+persist flow
  router.post('/parser/ingest', (ctx) => parserController.ingest(ctx as any))

  // Observability (admin read — role guard applied inside controller)
  router.get('/observability/metrics', [MetricsController, 'index'])
  router.get('/audit/logs', [AuditLogsController, 'index'])
})

// // ─── Role-gated write routes ──────────────────────────────────────────────────
// router.group(() => {
//   // Graph contract validation (US2, security+)
//   router.post('/graph/contract/validate', [GraphController, 'validate'])

//   // Incident simulation (US2, security+)
//   router.post('/graph/simulate-incident', [GraphSimulationController, 'simulate'])
// }).middleware(['auth', 'requireRole:security'])

// ─── Legacy / uploads ────────────────────────────────────────────────────────
router.post('/uploads', [UploadsController, 'store'])
