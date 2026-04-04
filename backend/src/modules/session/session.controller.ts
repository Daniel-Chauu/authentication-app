import { SessionService } from './session.service'

export class SessionController {
  private sessionService: SessionService
  constructor(sessionService: SessionService) {
    this.sessionService = sessionService
  }
}
