import { JwtPayload } from 'jsonwebtoken'
import { ObjectId } from 'mongoose'

export interface TokenPayload extends JwtPayload {
  userId: ObjectId
  sessionId: ObjectId
}
