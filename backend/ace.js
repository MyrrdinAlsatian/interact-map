import 'reflect-metadata'
import { Ignitor } from '@adonisjs/core'

new Ignitor(import.meta.url).tap((app) => {
  app.booting(async () => {
    await import('./src/infrastructure/adonis/routes.js')
  })
}).ace()
