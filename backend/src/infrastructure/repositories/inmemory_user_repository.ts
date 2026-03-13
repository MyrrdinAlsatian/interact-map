import { randomUUID } from 'node:crypto'
import { User } from '#entity/user'
import type { RegisterUserDto } from '#domain/contracts/dto/register_user_dto'
import type { UserRepository } from '#domain/contracts/repositories/user_repository'

const users: User[] = []

export class InMemoryUserRepository implements UserRepository {
  async getAll() {
    return [...users]
  }

  async findByEmail(email: string) {
    return users.find((user) => user.email === email) || null
  }

  async create(payload: RegisterUserDto) {
    const user = new User({
      id: randomUUID(),
      email: payload.email,
      displayName: payload.displayName,
      passwordHash: payload.password,
    })
    users.push(user)
    return user
  }
}
