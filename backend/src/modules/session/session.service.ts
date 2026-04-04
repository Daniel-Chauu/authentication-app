import {
  NotFoundException,
  UnauthorizedException
} from '~/common/utils/catch-errors'
import SessionModel from '~/database/models/session.model'

export class SessionService {
  async getAllSessions(userId: string) {
    const sessions = await SessionModel.find(
      {
        userId,
        expiredAt: { $gt: Date.now() }
      },
      {
        _id: 1,
        userId: 1,
        userAgent: 1,
        createdAt: 1,
        expiredAt: 1
      },
      {
        sort: { createdAt: -1 }
      }
    )

    return { sessions }
  }
  async getSession(sessionId?: string) {
    if (!sessionId)
      throw new NotFoundException('Session ID not found. Please log in.')

    const session = await SessionModel.findById(sessionId)
      .populate('userId')
      .select('-expiresAt')

    if (!session) {
      throw new NotFoundException('Session not found')
    }

    const { userId: user } = session

    return {
      user
    }
  }

  public async deleteSession(sessionId: string, userId: string) {
    const deletedSession = await SessionModel.findByIdAndDelete({
      _id: sessionId,
      userId: userId
    })
    if (!deletedSession) {
      throw new NotFoundException('Session not found')
    }
    return
  }
}
