export class User {
  id: string
  email: string
  displayName: string
  passwordHash: string

  constructor(payload: { id: string; email: string; displayName: string; passwordHash: string }) {
    this.id = payload.id
    this.email = payload.email
    this.displayName = payload.displayName
    this.passwordHash = payload.passwordHash
  }
}
