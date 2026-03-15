import { User } from '#entity/user'
import type { RegisterUserDto } from '#domain/contracts/dto/register_user_dto'

export abstract class UserRepositoryContract {
  abstract getAll(): Promise<User[]>
  abstract findByEmail(email: string): Promise<User | null>
  abstract register(payload: RegisterUserDto): Promise<User>
}
