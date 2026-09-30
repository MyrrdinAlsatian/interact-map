import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import LucidUser from '#infrastructure/orm/Lucid/models/user'
import { LucidUserRepository } from '#infrastructure/repositories/lucid_user_repository'

test.group('HTTP contracts', () => {
  test('protects authenticated routes and returns JSON errors', async ({ client }) => {
    const response = await client.get('/users/all').accept('json')

    assert.equal(response.status(), 401)
    assert.equal(response.type(), 'application/json')
  })

  test('returns JSON for an unknown route when requested', async ({ client }) => {
    const response = await client.get('/does-not-exist').accept('json')

    assert.equal(response.status(), 404)
    assert.equal(response.type(), 'application/json')
  })

  test('keeps user registration public and validates its payload', async ({ client }) => {
    const response = await client.post('/users/register').accept('json').json({})

    assert.equal(response.status(), 422)
    assert.equal(response.type(), 'application/json')
    assert.equal(response.body().error.code, 'USER_REGISTRATION_FAILED')
  })

  test('persists registrations and never exposes password hashes', async ({ client }) => {
    const password = 'test-password-123'
    const email = `sqlite-${randomUUID()}@example.com`
    const response = await client.post('/users/register').accept('json').json({
      email,
      displayName: 'SQLite User',
      password,
    })

    assert.equal(response.status(), 201)
    assert.deepEqual(response.body(), {
      id: response.body().id,
      email,
      displayName: 'SQLite User',
    })
    assert.equal('passwordHash' in response.body(), false)

    const repository = new LucidUserRepository()
    const savedUser = await repository.findByEmail(email)
    const lucidUser = await LucidUser.findBy('email', email)
    assert.ok(savedUser)
    assert.ok(lucidUser)
    assert.notEqual(savedUser.passwordHash, password)
    assert.equal(await lucidUser.verifyPassword(password), true)
  })

  test('requires authentication for multipart uploads', async ({ client }) => {
    const response = await client
      .post('/uploads')
      .accept('json')
      .field('dryRun', 'true')
      .file('file', Buffer.from('services: {}'), {
        filename: 'stack.yml',
        contentType: 'application/x-yaml',
      })

    assert.equal(response.status(), 401)
    assert.equal(response.type(), 'application/json')
  })
})
