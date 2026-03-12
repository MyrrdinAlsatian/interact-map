import assert from 'node:assert/strict'
import test from 'node:test'
import { GetAllUserUseCase } from '#domain/usecases/getall_user_usecase.js'
import { InMemoryUserRepository } from '#infrastructure/repositories/inmemory_user_repository.js'

test('GetAllUserUseCase returns list', async () => {
  const useCase = new GetAllUserUseCase(new InMemoryUserRepository())
  const users = await useCase.execute()
  assert.ok(Array.isArray(users))
})
