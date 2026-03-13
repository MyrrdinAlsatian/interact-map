import { User } from '#entity/user'
import type { RegisterUserDto } from '#domain/contracts/dto/register_user_dto'

export interface UserRepository {
  getAll(): Promise<User[]>
  findByEmail(email: string): Promise<User | null>
  create(payload: RegisterUserDto): Promise<User>
}
