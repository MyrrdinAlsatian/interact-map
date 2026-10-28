import { args, BaseCommand } from '@adonisjs/core/ace'
import type { ActorRole } from '#domain/contracts/dto/graph_contract_dto'
import User from '#infrastructure/orm/Lucid/models/user'
import { observabilityRepository } from '#repositories/observability_repository'

const roles: ActorRole[] = ['viewer', 'editor', 'security', 'admin']

export default class SetUserRole extends BaseCommand {
  static commandName = 'users:set-role'
  static description = 'Set a registered account role from the trusted server CLI'
  static options = { startApp: true }

  @args.string({ description: 'Email address of the registered account' })
  declare email: string

  @args.string({ description: 'Role to assign: viewer, editor, security, or admin' })
  declare role: string

  async run() {
    const email = this.email.trim().toLowerCase()
    const role = this.role.trim().toLowerCase() as ActorRole

    if (!roles.includes(role)) {
      this.logger.error(`Invalid role "${this.role}". Choose from: ${roles.join(', ')}`)
      this.exitCode = 1
      return
    }

    const user = await User.findBy('email', email)
    if (!user) {
      this.logger.error(`No account found for ${email}`)
      this.exitCode = 1
      return
    }

    const previousRole = user.role
    user.role = role
    await user.save()
    await observabilityRepository.appendAuditLog({
      actorId: `cli:${process.env.USER ?? 'operator'}`,
      actorRole: 'admin',
      action: 'users.role_change',
      resourceType: 'User',
      resourceId: user.id,
      outcome: 'success',
      metadata: { email, previousRole, role },
    })

    this.logger.success(`Updated ${email}: ${previousRole} → ${role}`)
  }
}
