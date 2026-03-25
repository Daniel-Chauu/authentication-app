import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { registerSchema } from '~/common/validators/auth.validator'
import { HTTP_STATUS } from '~/config/http.config'
import { RegisterDto } from '~/common/interfaces/auth.interface'
import wrapAsyncHandler from '~/middlewares/asyncHandler'

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
}
