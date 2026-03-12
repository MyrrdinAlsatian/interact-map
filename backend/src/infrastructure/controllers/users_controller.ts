import { RegisterUserUseCase } from '#domain/usecases/register_user_usecase.js'
import { InMemoryUserRepository } from '#infrastructure/repositories/inmemory_user_repository.js'

export default class UsersController {
  async register({ request, response }: { request: any; response: any }) {
    const payload = request.only(['email', 'displayName', 'password'])
    const useCase = new RegisterUserUseCase(new InMemoryUserRepository())
    const result = await useCase.execute(payload)
    return response.created(result)
  }
}
