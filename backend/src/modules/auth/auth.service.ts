import { ErrorCode } from '~/common/enums/error-code.enum'
import { VerificationEnum } from '~/common/enums/verification-code.enum'
import { LoginDto, RegisterDto } from '~/common/interfaces/auth.interface'
import { compareValue } from '~/common/utils/bcrypt'
import {
  BadRequestException,
  NotFoundException
} from '~/common/utils/catch-errors'
import { fortyFiveMinutesFromNow } from '~/common/utils/date-time'
import { signToken } from '~/common/utils/jwt'
import { config } from '~/config/app.config'
import SessionModel from '~/database/models/session.model'
import UserModel from '~/database/models/user.model'
import VerificationCodeModel from '~/database/models/verification.model'

export class AuthService {
  public async register({
    email,
    password,
    name,
    userAgent
  }: RegisterDto & { userAgent?: string }) {
    const isExistingEmail = await UserModel.exists({ email })

    if (isExistingEmail) {
      throw new BadRequestException(
        'Email already exists with this email',
        ErrorCode.AUTH_EMAIL_ALREADY_EXISTS
      )
    }

    const newUser = new UserModel({ email, password, name, userAgent })
    await newUser.save()

    const userId = newUser._id

    const verificationCode = new VerificationCodeModel({
      userId,
      type: VerificationEnum.EMAIL_VERIFICATION,
      expiredAt: fortyFiveMinutesFromNow()
    })
    verificationCode.save()

    // Sending email

    return { user: newUser }
  }

  public async login({
    email,
    password,
    userAgent
  }: LoginDto & { userAgent?: string }) {
    const user = await UserModel.findOne({ email })

    if (!user) {
      throw new BadRequestException(
        'Invalid email or password provided',
        ErrorCode.AUTH_USER_NOT_FOUND
      )
    }

    const isMatchedPassword = await user.comparePassword(password)

    if (!isMatchedPassword) {
      throw new BadRequestException(
        'Invalid email or password provided',
        ErrorCode.AUTH_USER_NOT_FOUND
      )
    }

    // Check if the user enable 2fa return user = null

    const userId = user._id
    const session = await SessionModel.create({
      userId,
      userAgent
    })
    const sessionId = session._id

    const accessToken = await signToken({
      payload: { userId, sessionId },
      secretKey: config.JWT.SECRET,
      options: {
        audience: ['user'],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expiresIn: config.JWT.EXPIRES_IN as any
      }
    })

    const refreshToken = await signToken({
      payload: { userId, sessionId },
      secretKey: config.JWT.REFRESH_SECRET,
      options: {
        audience: ['user'],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expiresIn: config.JWT.REFRESH_EXPIRES_IN as any
      }
    })

    return {
      user,
      accessToken,
      refreshToken
    }
  }
}
