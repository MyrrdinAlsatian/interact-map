export function validateRegisterUser(payload: Record<string, unknown>) {
  if (!payload.email || !payload.displayName || !payload.password) {
    throw new Error('email, displayName and password are required')
  }

  if (typeof payload.password !== 'string' || payload.password.length < 8) {
    throw new Error('password must contain at least 8 characters')
  }

  return {
    email: String(payload.email),
    displayName: String(payload.displayName),
    password: String(payload.password),
  }
}
