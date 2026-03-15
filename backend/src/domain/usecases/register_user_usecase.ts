import { randomUUID } from 'node:crypto'
import type { RegisterUserDto } from '#domain/contracts/dto/register_user_dto'
import type { UserRepositoryContract } from '#domain/contracts/repositories/user_repository'

export class RegisterUserUseCase {
  #repository: UserRepositoryContract

  constructor(repository: UserRepositoryContract) {
    this.#repository = repository
  }

  async execute(payload: RegisterUserDto) {
    const existing = await this.#repository.findByEmail(payload.email)
    if (existing) {
      throw new Error('User email already exists')
    }

    return this.#repository.register({
      ...payload,
      password: `${payload.password}:${randomUUID()}`,
    })
  }
}
