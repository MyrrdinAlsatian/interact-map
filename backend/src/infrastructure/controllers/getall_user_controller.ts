import { InMemoryUserRepository } from '#infrastructure/repositories/inmemory_user_repository'
import { GetAllUserUseCase } from '#domain/usecases/getall_user_usecase'

export default class GetAllUserController {
  async handle({ response }: { response: any }) {
    const useCase = new GetAllUserUseCase(new InMemoryUserRepository())
    const users = await useCase.execute()
    return response.ok(users)
  }
}
