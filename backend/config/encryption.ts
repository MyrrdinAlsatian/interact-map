import env from '#infrastructure/adonis/env'
import { defineConfig, drivers } from '@adonisjs/core/encryption'

const appKey = env.get('APP_KEY')

export default defineConfig({
  default: 'legacy',
  list: {
    legacy: drivers.legacy({
      keys: [appKey.length >= 16 ? appKey : '0123456789abcdef0123456789abcdef'],
    }),
  },
})
