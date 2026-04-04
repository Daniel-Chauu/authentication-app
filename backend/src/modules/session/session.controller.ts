import wrapAsyncHandler from '~/middlewares/asyncHandler'
import { SessionService } from './session.service'
import { Request, Response } from 'express'
import { HTTP_STATUS } from '~/config/http.config'
import z from 'zod'

export class SessionController {
  private sessionService: SessionService

  constructor(sessionService: SessionService) {
    this.sessionService = sessionService
  }

  public getAllSessions = wrapAsyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.id as string
      const sessionId = req.sessionId

      const { sessions } = await this.sessionService.getAllSessions(userId)

      const modifySessions = sessions.map((session) => {
        return {
          ...session.toObject(),
          ...(session.id === sessionId && { isCurrent: true })
        }
      })

      res.status(HTTP_STATUS.OK).json({
        message: 'Retrieve all sessions successfully',
        data: { sessions: modifySessions }
      })
    }
  )
  public getSession = wrapAsyncHandler(async (req: Request, res: Response) => {
    const sessionId = req.sessionId

    const { user } = await this.sessionService.getSession(sessionId)

    res.status(HTTP_STATUS.OK).json({
      message: 'Retrieve session successfully',
      data: { user }
    })
  })

  public deleteSession = wrapAsyncHandler(
    async (req: Request, res: Response) => {
      const sessionId = z.string().parse(req.params.id)
      const userId = req.user?.id as string
      await this.sessionService.deleteSession(sessionId, userId)

      res.status(HTTP_STATUS.OK).json({
        message: 'Remove session successfully'
      })
    }
  )
}
