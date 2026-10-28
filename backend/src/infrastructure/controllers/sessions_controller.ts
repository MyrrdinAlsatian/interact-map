import type { HttpContext } from '@adonisjs/core/http'
import { observabilityRepository } from '#repositories/observability_repository'
import User from '#infrastructure/orm/Lucid/models/user'

function wantsJson(request: HttpContext['request']) {
  return String(request.header('accept') ?? '').includes('application/json')
}

export default class SessionsController {
  async showLogin({ view, request, response }: HttpContext) {
    const html = await view.render('auth/login', {
      email: '',
      error: null,
      registered: request.input('registered') === '1',
    })
    response.header('Content-Type', 'text/html; charset=utf-8')
    return response.send(html)
  }

  async login({ request, response, auth, view }: HttpContext) {
    const email = String(request.input('email') ?? '').trim().toLowerCase()
    const password = String(request.input('password') ?? '')
    const json = wantsJson(request)

    if (!email || !password) {
      const message = 'Enter your email and password.'
      if (json) {
        return response.status(422).json({
          error: { code: 'LOGIN_FIELDS_REQUIRED', message, severity: 'error' },
        })
      }

      const html = await view.render('auth/login', { email, error: message })
      return response.status(422).header('Content-Type', 'text/html; charset=utf-8').send(html)
    }

    let user: User
    try {
      user = await User.verifyCredentials(email, password)
    } catch {
      await observabilityRepository.appendAuditLog({
        actorId: 'anonymous',
        actorRole: 'viewer',
        action: 'users.login',
        resourceType: 'Session',
        resourceId: email,
        outcome: 'failure',
        metadata: { reason: 'invalid_credentials' },
      })

      const message = 'Email or password is incorrect.'
      if (json) {
        return response.unauthorized({
          error: { code: 'INVALID_CREDENTIALS', message, severity: 'error' },
        })
      }

      const html = await view.render('auth/login', { email, error: message })
      return response.status(401).header('Content-Type', 'text/html; charset=utf-8').send(html)
    }

    await auth.use('web').login(user)
    await observabilityRepository.appendAuditLog({
      actorId: String(user.id),
      actorRole: 'viewer',
      action: 'users.login',
      resourceType: 'Session',
      resourceId: String(user.id),
      outcome: 'success',
    })

    if (json) {
      return response.ok({
        user: { id: user.id, email: user.email, displayName: user.displayName },
      })
    }

    return response.redirect('/')
  }

  async logout({ request, response, auth }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized()

    await auth.use('web').logout()
    await observabilityRepository.appendAuditLog({
      actorId: String(user.id),
      actorRole: 'viewer',
      action: 'users.logout',
      resourceType: 'Session',
      resourceId: String(user.id),
      outcome: 'success',
    })

    if (wantsJson(request)) return response.ok({ loggedOut: true })
    return response.redirect('/login')
  }
}
