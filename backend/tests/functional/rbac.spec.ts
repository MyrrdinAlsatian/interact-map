import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import type { ActorRole } from '#domain/contracts/dto/graph_contract_dto'
import User from '#infrastructure/orm/Lucid/models/user'
import { observabilityRepository } from '#repositories/observability_repository'

async function makeUser(role: ActorRole) {
  return User.create({
    id: randomUUID(),
    displayName: `RBAC ${role}`,
    email: `rbac-${role}-${randomUUID()}@example.com`,
    role,
    passwordHash: null,
  })
}

test.group('RBAC', () => {
  test('enforces the route matrix for viewer, editor, security, and admin', async ({ client }) => {
    const viewer = await makeUser('viewer')
    const editor = await makeUser('editor')
    const security = await makeUser('security')
    const admin = await makeUser('admin')

    const request = (path: string, user: User) =>
      client.get(path).withGuard('web').loginAs(user).accept('json')

    assert.equal((await request('/users/all', viewer)).status(), 403)
    assert.equal((await request('/observability/metrics', viewer)).status(), 403)
    assert.equal((await request('/audit/logs', viewer)).status(), 403)

    assert.equal((await request('/users/all', editor)).status(), 403)
    assert.equal((await request('/observability/metrics', editor)).status(), 403)
    assert.equal((await request('/audit/logs', editor)).status(), 403)
    assert.equal((await request('/users/all', security)).status(), 403)
    assert.equal((await request('/users/all', admin)).status(), 200)

    assert.equal((await request('/observability/metrics', security)).status(), 200)
    assert.equal((await request('/audit/logs', security)).status(), 200)
    assert.equal((await request('/observability/metrics', admin)).status(), 200)
    assert.equal((await request('/audit/logs', admin)).status(), 200)

    for (const user of [viewer, editor, security, admin]) {
      const archive = await client
        .post('/nodes/rbac-missing-node/archive')
        .withGuard('web')
        .loginAs(user)
        .accept('json')
      const restore = await client
        .post('/nodes/rbac-missing-node/restore')
        .withGuard('web')
        .loginAs(user)
        .accept('json')
      const purge = await client
        .post('/nodes/rbac-missing-node/purge')
        .withGuard('web')
        .loginAs(user)
        .accept('json')

      assert.equal(archive.status(), user.role === 'viewer' ? 403 : 404)
      assert.equal(restore.status(), user.role === 'viewer' ? 403 : 404)
      assert.equal(purge.status(), user.role === 'admin' ? 404 : 403)
    }

    for (const user of [viewer, editor, security, admin]) {
      const upload = await client
        .post('/uploads')
        .withGuard('web')
        .loginAs(user)
        .accept('json')
        .field('dryRun', 'true')
        .file('file', Buffer.from('services: {}'), {
          filename: 'rbac.yml',
          contentType: 'application/x-yaml',
        })

      assert.equal(upload.status() === 403, user.role === 'viewer')
    }
  })

  test('records role-denial details in the audit log', async ({ client }) => {
    const viewer = await makeUser('viewer')
    const response = await client.get('/users/all').withGuard('web').loginAs(viewer).accept('json')

    assert.equal(response.status(), 403)

    const entries = await observabilityRepository.queryAuditLogs()
    const denial = entries.find(
      (entry) =>
        entry.actorId === viewer.id && entry.action === 'users.list' && entry.outcome === 'denied'
    )

    assert.ok(denial)
    assert.equal(denial.actorRole, 'viewer')
    assert.deepEqual(denial.metadata, { requiredRole: 'admin' })
  })

  test('hides privileged controls from roles that cannot use them', async ({ client }) => {
    const viewer = await makeUser('viewer')
    const editor = await makeUser('editor')
    const admin = await makeUser('admin')

    const viewerDashboard = await client.get('/').withGuard('web').loginAs(viewer).accept('html')
    const editorDashboard = await client.get('/').withGuard('web').loginAs(editor).accept('html')
    const viewerGraph = await client.get('/graph').withGuard('web').loginAs(viewer).accept('html')
    const editorGraph = await client.get('/graph').withGuard('web').loginAs(editor).accept('html')

    assert.equal(viewerDashboard.text().includes('action="/uploads"'), false)
    assert.equal(editorDashboard.text().includes('action="/uploads"'), true)
    assert.equal(viewerGraph.text().includes('id="graphToolbar"'), false)
    assert.equal(editorGraph.text().includes('id="graphToolbar"'), true)

    const viewerInventory = await client
      .get('/applications')
      .withGuard('web')
      .loginAs(viewer)
      .accept('html')
    const adminInventory = await client
      .get('/applications')
      .withGuard('web')
      .loginAs(admin)
      .accept('html')

    assert.equal(viewerInventory.text().includes('/archive"'), false)
    assert.equal(adminInventory.text().includes('/archive"'), true)
  })
})
