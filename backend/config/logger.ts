/**
 * Structured logger configuration.
 *
 * Fields emitted on every log record:
 *   - level     — debug | info | warn | error
 *   - timestamp — ISO-8601
 *   - feature   — constant tag for this feature branch
 *
 * Application code emits structured events using ctx.logger or the global pino instance.
 * Key events:
 *   - request.received  — { method, url, actorId }
 *   - fragment.resolved — { target, statusCode }
 *   - fragment.error    — { target, code }
 *   - contract.valid    — { schemaVersion }
 *   - contract.invalid  — { schemaVersion, errorCount }
 *   - incident.simulated — { projectId, failedNodeId, traversal, impactedCount }
 *   - parser.success    — { sourceType, nodeCount, edgeCount }
 *   - parser.error      — { sourceType, errorCount }
 */
export default {
  enabled: true,
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: process.env.LOG_FORMAT === 'json' ? 'json' : 'pretty',
  timestamp: true,
  prettyPrint: process.env.NODE_ENV === 'development',
  defaultMeta: {
    feature: '001-adonis-hypermedia-hexagonal',
    service: 'interact-map-backend',
  },
}

