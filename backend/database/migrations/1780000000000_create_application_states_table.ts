import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'application_states'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('state_key', 64).primary()
      table.text('payload').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
