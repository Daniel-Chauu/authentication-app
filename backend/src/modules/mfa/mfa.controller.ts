import wrapAsyncHandler from '~/middlewares/asyncHandler'
import { MfaService } from './mfa.service'
import { Request, Response } from 'express'
import { HTTP_STATUS } from '~/config/http.config'
import {
  verifyMfaLoginSchema,
  verifyMfaSchema
} from '~/common/validators/mfa.validator'
import { setAuthenticationCookies } from '~/common/utils/cookie'

export class MfaController {
  private mfaService: MfaService
  constructor(mfaService: MfaService) {
    this.mfaService = mfaService
  }

  public generateMFASetup = wrapAsyncHandler(
    async (req: Request, res: Response) => {
      const response = await this.mfaService.generateMFASetup(req)

      res.status(HTTP_STATUS.OK).json(response)
    }
  )

  public verifyMFASetup = wrapAsyncHandler(
    async (req: Request, res: Response) => {
      const { code, secretKey } = verifyMfaSchema.parse({
        ...req.body
      })

      const response = await this.mfaService.verifyMFASetup(
        req,
        code,
        secretKey
      )

      res.status(HTTP_STATUS.OK).json(response)
    }
  )

  public revokeMFA = wrapAsyncHandler(async (req: Request, res: Response) => {
    const response = await this.mfaService.revokeMFA(req)

    res.status(HTTP_STATUS.OK).json(response)
  })

  public verifyMFAForLogin = wrapAsyncHandler(
    async (req: Request, res: Response) => {
      const { code, email, userAgent } = verifyMfaLoginSchema.parse({
        ...req.body,
        userAgent: req.headers['user-agent']
      })

      const { accessToken, refreshToken, user } =
        await this.mfaService.verifyMFAForLogin(code, email, userAgent)

      setAuthenticationCookies({ res, accessToken, refreshToken })
        .status(HTTP_STATUS.OK)
        .json({
          message: 'Verified & login successfully',
          data: { user, accessToken, refreshToken }
        })
    }
  )
}
