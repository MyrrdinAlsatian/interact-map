import type { ActorRole } from '#domain/contracts/dto/graph_contract_dto'

export class User {
  id: string
  email: string
  displayName: string
  passwordHash: string | null
  role: ActorRole

  constructor(payload: {
    id: string
    email: string
    displayName: string
    passwordHash: string | null
    role?: ActorRole
  }) {
    this.id = payload.id
    this.email = payload.email
    this.displayName = payload.displayName
    this.passwordHash = payload.passwordHash
    this.role = payload.role ?? 'viewer'
  }
}
