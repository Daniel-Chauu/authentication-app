import { Request } from 'express'
import { ExtractJwt, StrategyOptionsWithRequest, Strategy } from 'passport-jwt'
import { UnauthorizedException } from '../utils/catch-errors'
import { config } from '~/config/app.config'
import passport, { PassportStatic } from 'passport'
import { userService } from '~/modules/user/auth.module'

interface JwtPayload {
  sessionId: string
  userId: string
}

const options: StrategyOptionsWithRequest = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    (req: Request) => {
      const accessToken = req.cookies.accessToken
      if (!accessToken)
        throw new UnauthorizedException('Unauthorized access token')
      return accessToken
    }
  ]),
  secretOrKey: config.JWT.SECRET,
  audience: ['user'],
  algorithms: ['HS256'],
  passReqToCallback: true
}

export const setupJwtStrategy = (passport: PassportStatic) => {
  passport.use(
    new Strategy(options, async (req, payload: JwtPayload, done) => {
      try {
        const user = await userService.findUserById(payload.userId)
        if (!user) done(null, false)
        req.sessionId = payload.sessionId
        return done(null, user)
      } catch (error) {
        done(null, false)
      }
    })
  )
}

export const authenticateJWT = passport.authenticate('jwt', { session: false })
