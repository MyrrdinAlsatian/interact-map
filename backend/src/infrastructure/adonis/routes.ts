import Route from '@ioc:Adonis/Core/Route'

Route.get('/health', 'HealthChecksController.handle')
Route.get('/users', 'GetAllUserController.handle')
Route.post('/users/register', 'UsersController.register')
Route.post('/uploads', 'UploadsController.store')
