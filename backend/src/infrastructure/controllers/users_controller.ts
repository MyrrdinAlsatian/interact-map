import { RegisterUserUseCase } from '#domain/usecases/register_user_usecase.js'
import { InMemoryUserRepository } from '#infrastructure/repositories/inmemory_user_repository.js'
import { observabilityRepository } from '#repositories/observability_repository.js'

export default class UsersController {
  async register({ request, response }: { request: any; response: any }) {
    const payload = request.only(['email', 'displayName', 'password'])
    const useCase = new RegisterUserUseCase(new InMemoryUserRepository())

    try {
      const result = await useCase.execute(payload)

      observabilityRepository.appendAuditLog({
        actorId: result.id,
        actorRole: 'viewer',
        action: 'users.register',
        resourceType: 'User',
        resourceId: result.id,
        outcome: 'success',
        metadata: { email: result.email },
      })

      return response.created(result)
    } catch (error: any) {
      observabilityRepository.appendAuditLog({
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
