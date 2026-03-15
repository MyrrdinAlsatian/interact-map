import assert from 'node:assert/strict'
import test from 'node:test'
import { InMemoryUserRepository } from '#infrastructure/repositories/inmemory_user_repository'

test('InMemoryUserRepository creates user', async () => {
  const repository = new InMemoryUserRepository()
  const user = await repository.register({
    email: 'test@example.com',
    displayName: 'Test',
    password: 'password',
  })

  assert.equal(user.email, 'test@example.com')
})
