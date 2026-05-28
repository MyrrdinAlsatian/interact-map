import { observabilityRepository } from '#repositories/observability_repository'
import {
  archiveNodeById,
  getNodeCategoryPath,
  purgeNodeById,
  restoreNodeById,
} from '#infrastructure/services/graph_store_service'
import { getNodeDetailViewModel } from '#infrastructure/services/inventory_data_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class NodeController {
  async show({ params, view, response }: HttpContext & { params: any; view: any }) {
    const start = Date.now()
    const nodeId = decodeURIComponent(params.id)
    const model = await getNodeDetailViewModel(nodeId)

    if (!model) {
      return response.status(404).send('Node not found')
    }

    const html = await view.render('nodes/show', model)
    observabilityRepository.recordLatency(Date.now() - start)
    response.header('Content-Type', 'text/html; charset=utf-8')
    return response.ok(html)
  }

  async archive({ params, response, auth }: HttpContext & { params: any; auth: any }) {
    const result = await archiveNodeById(decodeURIComponent(params.id))
    if (!result || !result.node || !result.category) {
      return response.status(404).json({ error: 'Node not found' })
    }

    observabilityRepository.appendAuditLog({
      actorId: String(auth?.user?.id ?? 'anonymous'),
      actorRole: auth?.user?.role ?? 'viewer',
      action: 'node.archive',
      resourceType: 'GraphNode',
      resourceId: result.node.id,
      outcome: 'success',
    })

    return response.redirect(getNodeCategoryPath(result.category))
  }

  async restore({ params, response, auth }: HttpContext & { params: any; auth: any }) {
    const result = await restoreNodeById(decodeURIComponent(params.id))
    if (!result || !result.node || !result.category) {
      return response.status(404).json({ error: 'Node not found' })
    }

    observabilityRepository.appendAuditLog({
      actorId: String(auth?.user?.id ?? 'anonymous'),
      actorRole: auth?.user?.role ?? 'viewer',
      action: 'node.restore',
      resourceType: 'GraphNode',
      resourceId: result.node.id,
      outcome: 'success',
    })

    return response.redirect(getNodeCategoryPath(result.category))
  }

  async purge({ params, response, auth }: HttpContext & { params: any; auth: any }) {
    const result = await purgeNodeById(decodeURIComponent(params.id))
    if (!result || !result.node || !result.category) {
      return response.status(404).json({ error: 'Node not found' })
    }

    observabilityRepository.appendAuditLog({
      actorId: String(auth?.user?.id ?? 'anonymous'),
      actorRole: auth?.user?.role ?? 'viewer',
      action: 'node.purge',
      resourceType: 'GraphNode',
      resourceId: result.node.id,
      outcome: 'success',
      metadata: { removedEdgeCount: result.removedEdgeCount },
    })

    return response.redirect(getNodeCategoryPath(result.category))
  }
}
