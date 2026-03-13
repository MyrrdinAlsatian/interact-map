import {UserRepository  } from '#domain/contracts/repositories/user_repository'
import {InMemoryUserRepository} from '#infrastructure/repositories/inmemory_user_repository'
import type { ApplicationService } from '@adonisjs/core/types'

export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {}

  /**
   * The container bindings have booted
   */
  async boot() {
    // We bind "InMemoryUserRepository" class to the "UserRepository" contract so it could be swap easily
    this.app.container.bind(InMemoryUserRepository, () => new InMemoryUserRepository())
    // this.app.container.bind(WebsurgAuthorRepository, () => {
    //   //si l'environnement est de type test, on utilise le repository en mémoire
    //   // if (this.app.getEnvironment() === 'test') {
    //   //   return new InMemoryWebsurgAuthorRepository()
    //   // } else {
    //   //   //sinon on utilise le repository API
    //   //   return new ApiWebsurgAuthorRepository()
    //   // }
    // })
  }

  /**
   * The application has been booted
   */
  async start() {}

  /**
   * The process has been started
   */
  async ready() {}

  /**
   * Preparing to shutdown the app
   */
  async shutdown() {}
}
