import { getHealthStatus } from '#infrastructure/adonis/health'

export default class HealthChecksController {
  async handle({ response }: { response: any }) {
    return response.ok(getHealthStatus())
  }
}
