import { observabilityRepository } from '#repositories/observability_repository'

export default class UploadsController {
  async store({ response, auth }: { response: any; auth?: any }) {
    const actorId = auth?.user?.id ?? 'anonymous'
    const actorRole = auth?.user?.role ?? 'viewer'

    observabilityRepository.appendAuditLog({
      actorId,
      actorRole,
      action: 'uploads.store',
      resourceType: 'Upload',
      resourceId: 'scaffold-upload',
      outcome: 'success',
    })

    return response.ok({ status: 'uploaded', message: 'Upload endpoint scaffolded' })
  }
}
