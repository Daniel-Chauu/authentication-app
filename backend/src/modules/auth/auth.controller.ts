import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { loginSchema, registerSchema } from '~/common/validators/auth.validator'
import { HTTP_STATUS } from '~/config/http.config'
import { RegisterDto } from '~/common/interfaces/auth.interface'
import wrapAsyncHandler from '~/middlewares/asyncHandler'
import { setAuthenticationCookies } from '~/common/utils/cookie'

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
}
