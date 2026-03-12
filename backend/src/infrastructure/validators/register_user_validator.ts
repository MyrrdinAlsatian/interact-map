export function validateRegisterUser(payload: Record<string, unknown>) {
  if (!payload.email || !payload.displayName || !payload.password) {
    throw new Error('email, displayName and password are required')
  }

  return {
    email: String(payload.email),
    displayName: String(payload.displayName),
    password: String(payload.password),
  }
}
