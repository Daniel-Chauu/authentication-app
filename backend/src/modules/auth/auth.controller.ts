import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import {
  emailSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifycationEmailSchema
} from '~/common/validators/auth.validator'
import { HTTP_STATUS } from '~/config/http.config'
import { RegisterDto } from '~/common/interfaces/auth.interface'
import wrapAsyncHandler from '~/middlewares/asyncHandler'
import {
  clearAuthenticationCookies,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  setAuthenticationCookies
} from '~/common/utils/cookie'
import {
  NotFoundException,
  UnauthorizedException
} from '~/common/utils/catch-errors'
import { ErrorCode } from '~/common/enums/error-code.enum'

export class AuthController {
  private authService: AuthService

  constructor(authService: AuthService) {
    this.authService = authService
  }

  public register = wrapAsyncHandler(
    async (req: Request<any, any, RegisterDto>, res: Response) => {
      const userAgent = req.headers['user-agent']

      const body = await registerSchema.parseAsync({
        ...req.body,
        userAgent
      })

      const response = await this.authService.register(body)

      res.status(HTTP_STATUS.CREATED).json({
        message: 'User registered successfully',
        data: response
      })
    }
  )

  public login = wrapAsyncHandler(async (req: Request, res: Response) => {
    const userAgent = req.headers['user-agent']

    const body = loginSchema.parse({
      ...req.body,
      userAgent
    })

    const response = await this.authService.login(body)

    setAuthenticationCookies({
      res,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken
    })
      .status(HTTP_STATUS.OK)
      .json({
        message: 'User logged in successfully',
        data: response
      })
  })

  public refreshToken = wrapAsyncHandler(
    async (req: Request, res: Response) => {
      const refreshToken = req.cookies['refreshToken']
      if (!refreshToken)
        throw new UnauthorizedException(
          'Missing refresh token',
          ErrorCode.ACCESS_UNAUTHORIZED
        )

      const { accessToken, newRefreshToken } =
        await this.authService.refreshToken(refreshToken)

      if (newRefreshToken) {
        res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions())
      }

      res
        .cookie('accessToken', accessToken, getAccessTokenCookieOptions())
        .status(HTTP_STATUS.OK)
        .json({
          message: 'Refresh token successfully',
          data: {
            accessToken,
            refreshToken: newRefreshToken
          }
        })
    }
  )

  public verifyEmail = wrapAsyncHandler(async (req: Request, res: Response) => {
    const { code } = verifycationEmailSchema.parse(req.body)

    const response = await this.authService.verifyEmail(code)

    res.status(HTTP_STATUS.OK).json({
      message: 'Email verified  successfully',
      data: response
    })
  })

  public forgotPassword = wrapAsyncHandler(
    async (req: Request, res: Response) => {
      const { email } = forgotPasswordSchema.parse(req.body)

      const response = await this.authService.forgotPassword(email)

      res.status(HTTP_STATUS.OK).json({
        message: 'Password reset email sent',
        data: response
      })
    }
  )

  public resetPassword = wrapAsyncHandler(
    async (req: Request, res: Response) => {
      const body = resetPasswordSchema.parse(req.body)

      const response = await this.authService.resetPassword(body)

      clearAuthenticationCookies(res).status(HTTP_STATUS.OK).json({
        message: 'Reset password successfully',
        data: response
      })
    }
  )

  public logout = wrapAsyncHandler(async (req: Request, res: Response) => {
    const sessionId = req.sessionId

    if (!sessionId) throw new NotFoundException('Session is invalid')

    await this.authService.logout(sessionId)

    clearAuthenticationCookies(res).status(HTTP_STATUS.OK).json({
      message: 'User logout successfully'
    })
  })
}
