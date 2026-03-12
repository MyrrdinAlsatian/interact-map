import { getHealthStatus } from '#infrastructure/adonis/health.js'

export default class HealthChecksController {
  async handle({ response }: { response: any }) {
    return response.ok(getHealthStatus())
  }
}
