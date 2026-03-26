import { JwtPayload } from 'jsonwebtoken'
import { ObjectId } from 'mongoose'

export interface AccessTokenPayload extends JwtPayload {
  userId: string
  sessionId: string
}

export interface RefreshTokenPayload extends JwtPayload {
  userId: string
  sessionId: string
}
