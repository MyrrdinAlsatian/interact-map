import { RegisterUserUseCase } from '#domain/usecases/register_user_usecase'
import { LucidUserRepository } from '#infrastructure/repositories/lucid_user_repository'
import { observabilityRepository } from '#repositories/observability_repository'

export default class UsersController {
  async register({ request, response }: { request: any; response: any }) {
    const payload = request.only(['email', 'displayName', 'password'])
    const useCase = new RegisterUserUseCase(new LucidUserRepository())

    try {
      const result = await useCase.execute(payload)

      await observabilityRepository.appendAuditLog({
        actorId: result.id,
        actorRole: 'viewer',
        action: 'users.register',
        resourceType: 'User',
        resourceId: result.id,
        outcome: 'success',
        metadata: { email: result.email },
      })

      return response.created({
        id: result.id,
        email: result.email,
        displayName: result.displayName,
      })
    } catch (error: any) {
      await observabilityRepository.appendAuditLog({
        actorId: 'anonymous',
        actorRole: 'viewer',
        action: 'users.register',
        resourceType: 'User',
        resourceId: payload.email ?? 'unknown',
        outcome: 'failure',
        metadata: { reason: String(error?.message ?? error) },
      })

      return response.status(422).json({
        error: {
          code: 'USER_REGISTRATION_FAILED',
          message: String(error?.message ?? 'User registration failed'),
          severity: 'error',
        },
      })
    }
  }
}
