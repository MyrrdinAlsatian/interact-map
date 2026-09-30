import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.text('actor_id').notNullable()
      table.string('actor_role', 32).notNullable()
      table.text('action').notNullable()
      table.text('resource_type').notNullable()
      table.text('resource_id').notNullable()
      table.string('timestamp', 32).notNullable()
      table.string('outcome', 16).notNullable()
      table.text('metadata').nullable()
      table.index(['timestamp', 'id'])
      table.index(['actor_id', 'timestamp'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
