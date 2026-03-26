import { CookieOptions, Response } from 'express'
import { config } from '~/config/app.config'
import { calculateExpirationDate } from './date-time'

interface CookiePayload {
  res: Response
  accessToken: string
  refreshToken: string
}

export const REFRESH_PATH = `${config.BASE_PATH}/auth/refresh-token`

const defaults: CookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production' ? true : false,
  sameSite: config.NODE_ENV === 'production' ? 'strict' : 'lax'
}

export const getAccessTokenCookieOptions = (): CookieOptions => {
  const expiresIn = config.JWT.EXPIRES_IN
  const expires = calculateExpirationDate(expiresIn)

  return {
    ...defaults,
    expires,
    path: '/'
  }
}
export const getRefreshTokenCookieOptions = (): CookieOptions => {
  const expiresIn = config.JWT.REFRESH_EXPIRES_IN
  const expires = calculateExpirationDate(expiresIn)

  return {
    ...defaults,
    expires,
    path: REFRESH_PATH
  }
}

export const setAuthenticationCookies = ({
  res,
  accessToken,
  refreshToken
}: CookiePayload): Response => {
  return res
    .cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions())
    .cookie('accessToken', accessToken, getAccessTokenCookieOptions())
}

export const clearAuthenticationCookies = (res: Response): Response => {
  return res
    .clearCookie('accessToken')
    .clearCookie('refreshToken', { path: REFRESH_PATH })
}
