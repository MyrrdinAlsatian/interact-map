import type { UserRepository } from '#domain/contracts/repositories/user_repository'

export class GetAllUserUseCase {
  #repository: UserRepository

  constructor(repository: UserRepository) {
    this.#repository = repository
  }

  async execute() {
    return this.#repository.getAll()
  }
}
