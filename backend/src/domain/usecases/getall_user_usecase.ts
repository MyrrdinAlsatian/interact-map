import type { UserRepositoryContract } from '#domain/contracts/repositories/user_repository'

export class GetAllUserUseCase {
  #repository: UserRepositoryContract

  constructor(repository: UserRepositoryContract) {
    this.#repository = repository
  }

  async execute() {
    return this.#repository.getAll()
  }
}
