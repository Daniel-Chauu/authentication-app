import { JwtPayload } from 'jsonwebtoken'

export interface AccessTokenPayload extends JwtPayload {
  userId: string
  sessionId: string
}

export interface RefreshTokenPayload extends JwtPayload {
  userId: string
  sessionId: string
}
