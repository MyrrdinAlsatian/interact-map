import env from '#infrastructure/adonis/env'
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'
import { isAbsolute, resolve } from 'node:path'

const requestedConnection = env.get('DB_CONNECTION')?.trim()
const defaultConnection = 'better-sqlite3'

if (requestedConnection && !['postgres', 'better-sqlite3'].includes(requestedConnection)) {
  throw new Error('DB_CONNECTION must be either "postgres" or "better-sqlite3"')
}

const connection = requestedConnection || defaultConnection
const sqliteFilename =
  env.get('DB_SQLITE_FILENAME')?.trim() ||
  (env.get('NODE_ENV') === 'test'
    ? ':memory:'
    : `database/${env.get('NODE_ENV') === 'production' ? 'production' : 'development'}.sqlite3`)
const sqliteConnectionFilename =
  sqliteFilename === ':memory:'
    ? sqliteFilename
    : isAbsolute(sqliteFilename)
      ? resolve(sqliteFilename)
      : app.makePath(sqliteFilename)
const postgresConnection = {
  host: env.get('DB_HOST'),
  port: env.get('DB_PORT'),
  user: env.get('DB_USER'),
  password: env.get('DB_PASSWORD'),
  database: env.get('DB_DATABASE'),
}

if (
  connection === 'postgres' &&
  (!postgresConnection.host ||
    !postgresConnection.port ||
    !postgresConnection.user ||
    !postgresConnection.database)
) {
  throw new Error('PostgreSQL requires DB_HOST, DB_PORT, DB_USER, and DB_DATABASE')
}

const migrations = {
  naturalSort: true,
  paths: ['database/migrations'],
}

const dbConfig = defineConfig({
  connection,
  connections:
    connection === 'postgres'
      ? {
          postgres: {
            client: 'pg',
            connection: postgresConnection,
            migrations,
          },
        }
      : {
          'better-sqlite3': {
            client: 'better-sqlite3',
            connection: {
              filename: sqliteConnectionFilename,
            },
            useNullAsDefault: true,
            pool: { min: 1, max: 1 },
            migrations,
          },
        },
})

export default dbConfig
