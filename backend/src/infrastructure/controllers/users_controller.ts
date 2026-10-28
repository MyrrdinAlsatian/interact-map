import { RegisterUserUseCase } from '#domain/usecases/register_user_usecase'
import { LucidUserRepository } from '#infrastructure/repositories/lucid_user_repository'
import { observabilityRepository } from '#repositories/observability_repository'

export default class UsersController {
  async register({ request, response, view }: { request: any; response: any; view: any }) {
    const payload = request.only(['email', 'displayName', 'password'])
    const wantsJson = String(request.header('accept') ?? '').includes('application/json')
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

      const user = {
        id: result.id,
        email: result.email,
        displayName: result.displayName,
      }

      if (wantsJson) return response.created(user)
      return response.redirect('/login?registered=1')
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

      const message = String(error?.message ?? 'User registration failed')
      if (wantsJson) {
        return response.status(422).json({
          error: {
            code: 'USER_REGISTRATION_FAILED',
            message,
            severity: 'error',
          },
        })
      }

      const html = await view.render('auth/register', {
        error: message,
        email: payload.email ?? '',
        displayName: payload.displayName ?? '',
      })
      return response.status(422).header('Content-Type', 'text/html; charset=utf-8').send(html)
    }
  }
}
