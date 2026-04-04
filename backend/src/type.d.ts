import { IUser } from './database/models/user.model'
import { Request } from 'express'

declare global {
  namespace Express {
    interface User extends IUser {
      id: string
    }
    interface Request {
      sessionId?: string
      user?: User
    }
  }
}
