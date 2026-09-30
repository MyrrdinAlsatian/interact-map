import { randomUUID } from 'node:crypto'
import { User } from '#entity/user'
import type { RegisterUserDto } from '#domain/contracts/dto/register_user_dto'
import type { UserRepositoryContract } from '#domain/contracts/repositories/user_repository'
import LucidUser from '#infrastructure/orm/Lucid/models/user'

function toDomainUser(record: LucidUser): User {
  return new User({
    id: record.id,
    email: record.email,
    displayName: record.displayName,
    passwordHash: record.passwordHash,
  })
}

export class LucidUserRepository implements UserRepositoryContract {
  async getAll() {
    const records = await LucidUser.all()
    return records.map(toDomainUser)
  }

  async findByEmail(email: string) {
    const record = await LucidUser.findBy('email', email)
    return record ? toDomainUser(record) : null
  }

  async register(payload: RegisterUserDto) {
    const record = await LucidUser.create({
      id: randomUUID(),
      email: payload.email,
      displayName: payload.displayName,
      passwordHash: payload.password,
    })
    return toDomainUser(record)
  }
}
