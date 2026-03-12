import { User } from '#entity/user.js'
import type { RegisterUserDto } from '#domain/contracts/dto/register_user_dto.js'

export interface UserRepository {
  getAll(): Promise<User[]>
  findByEmail(email: string): Promise<User | null>
  create(payload: RegisterUserDto): Promise<User>
}
