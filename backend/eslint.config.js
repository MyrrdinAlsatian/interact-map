import { configApp } from '@adonisjs/eslint-config'

export default [
  {
    ignores: ['database/migrations/**/*', '.adonisjs/**/*'],
  },
  ...configApp(),
]
