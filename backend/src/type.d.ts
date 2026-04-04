import { Request } from 'express'
import { UserDocument } from './database/models/user.model'

declare global {
  namespace Express {
    type User = UserDocument
    interface Request {
      sessionId?: string
      user?: UserDocument
    }
  }
}
