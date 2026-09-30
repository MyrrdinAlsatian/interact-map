import { LucidUserRepository } from '#infrastructure/repositories/lucid_user_repository'
import { GetAllUserUseCase } from '#domain/usecases/getall_user_usecase'

export default class GetAllUserController {
  async handle({ response }: { response: any }) {
    const useCase = new GetAllUserUseCase(new LucidUserRepository())
    const users = await useCase.execute()
    return response.ok(users.map(({ id, email, displayName }) => ({ id, email, displayName })))
  }
}
