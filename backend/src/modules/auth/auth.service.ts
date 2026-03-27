import { ObjectId, Types } from 'mongoose'
import { ErrorCode } from '~/common/enums/error-code.enum'
import { VerificationEnum } from '~/common/enums/verification-code.enum'
import { LoginDto, RegisterDto } from '~/common/interfaces/auth.interface'
import { RefreshTokenPayload } from '~/common/interfaces/jwt.interface'
import { compareValue } from '~/common/utils/bcrypt'
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException
} from '~/common/utils/catch-errors'
import {
  A_DAY_IN_MS,
  calculateExpirationDate,
  fortyFiveMinutesFromNow
} from '~/common/utils/date-time'
import { signToken, verifyToken } from '~/common/utils/jwt'
import { config } from '~/config/app.config'
import SessionModel from '~/database/models/session.model'
import UserModel from '~/database/models/user.model'
import VerificationCodeModel from '~/database/models/verification.model'
import { sendEmail } from '~/mailers/mailer'
import { verifyEmailTemplate } from '~/mailers/templates/template'

export class AuthService {
  private generateRefreshToken(payload: { sessionId: Types.ObjectId }) {
    return signToken({
      payload,
      secretKey: config.JWT.REFRESH_SECRET,
      options: {
        audience: ['user'],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expiresIn: config.JWT.REFRESH_EXPIRES_IN as any
      }
    })
  }
  private generateAccessToken(payload: {
    userId: Types.ObjectId
    sessionId: Types.ObjectId
  }) {
    return signToken({
      payload,
      secretKey: config.JWT.SECRET,
      options: {
        audience: ['user'],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expiresIn: config.JWT.EXPIRES_IN as any
      }
    })
  }

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

    const verificationUrl = `${config.APP_ORIGIN}/confirm-account?code=${verificationCode.code}`
    await sendEmail({
      to: newUser.email,

      ...verifyEmailTemplate(verificationUrl)
    })

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

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken({ userId, sessionId }),
      this.generateRefreshToken({ sessionId })
    ])

    return {
      user,
      accessToken,
      refreshToken
    }
  }

  public async refreshToken(refreshToken: string) {
    const payload = await verifyToken<RefreshTokenPayload>({
      token: refreshToken,
      secretKey: config.JWT.REFRESH_SECRET
    })

    if (!payload)
      throw new UnauthorizedException(
        'Invalid refresh token',
        ErrorCode.ACCESS_UNAUTHORIZED
      )

    const session = await SessionModel.findById(payload.sessionId)

    if (!session) {
      throw new BadRequestException('Session does not exist')
    }

    const now = Date.now()

    if (session.expiredAt.getTime() <= now)
      throw new UnauthorizedException('Session expired')

    const requiredRefresh = session.expiredAt.getTime() - now <= A_DAY_IN_MS

    if (requiredRefresh) {
      session.expiredAt = calculateExpirationDate(config.JWT.REFRESH_EXPIRES_IN)
      await session.save()
    }

    const [newRefreshToken, accessToken] = await Promise.all([
      requiredRefresh
        ? await this.generateRefreshToken({ sessionId: session._id })
        : undefined,
      this.generateAccessToken({
        sessionId: session._id,
        userId: session.userId
      })
    ])

    return {
      newRefreshToken,
      accessToken
    }
  }

  public async verifyEmail(code: string) {
    const validCode = await VerificationCodeModel.findOne({ code })

    if (!validCode)
      throw new BadRequestException('Invalid or expired verification code')

    const updatedUser = await UserModel.findByIdAndUpdate(
      {
        _id: validCode.userId
      },
      {
        isEmailVerified: true
      },
      { new: true }
    )

    if (!updatedUser)
      throw new BadRequestException(
        'Unable to verify email address',
        ErrorCode.VALIDATION_ERROR
      )

    await validCode.deleteOne()

    return {
      user: updatedUser
    }
  }
}
