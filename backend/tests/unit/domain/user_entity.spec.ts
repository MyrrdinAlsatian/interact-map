import assert from 'node:assert/strict'
import test from 'node:test'
import { User } from '#entity/user.js'

test('User entity keeps payload', () => {
  const user = new User({
    id: 'u1',
    email: 'dev@example.com',
    displayName: 'Dev',
    passwordHash: 'secret',
  })

  assert.equal(user.email, 'dev@example.com')
})
