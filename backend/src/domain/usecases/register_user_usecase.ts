import { randomUUID } from 'node:crypto'
import type { RegisterUserDto } from '#domain/contracts/dto/register_user_dto.js'
import type { UserRepository } from '#domain/contracts/repositories/user_repository.js'

export class RegisterUserUseCase {
  #repository: UserRepository

  constructor(repository: UserRepository) {
    this.#repository = repository
  }

  async execute(payload: RegisterUserDto) {
    const existing = await this.#repository.findByEmail(payload.email)
    if (existing) {
      throw new Error('User email already exists')
    }

    return this.#repository.create({
      ...payload,
      password: `${payload.password}:${randomUUID()}`,
    })
  }
}
