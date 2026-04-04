import { passwordResetTemplate } from './../../mailers/templates/template'
import { ObjectId, Types } from 'mongoose'
import { ErrorCode } from '~/common/enums/error-code.enum'
import { VerificationEnum } from '~/common/enums/verification-code.enum'
import {
  LoginDto,
  RegisterDto,
  ResetPasswordDto
} from '~/common/interfaces/auth.interface'
import { RefreshTokenPayload } from '~/common/interfaces/jwt.interface'
import { compareValue, hashValue } from '~/common/utils/bcrypt'
import {
  BadRequestException,
  HttpExeption,
  InternalServerException,
  NotFoundException,
  UnauthorizedException
} from '~/common/utils/catch-errors'
import {
  A_DAY_IN_MS,
  anHourFromNow,
  calculateExpirationDate,
  fortyFiveMinutesFromNow,
  threeMinutesAgo
} from '~/common/utils/date-time'
import { signToken, verifyToken } from '~/common/utils/jwt'
import { config } from '~/config/app.config'
import { HTTP_STATUS } from '~/config/http.config'
import SessionModel from '~/database/models/session.model'
import UserModel from '~/database/models/user.model'
import VerificationCodeModel from '~/database/models/verification.model'
import { sendEmail } from '~/mailers/mailer'
import { verifyEmailTemplate } from '~/mailers/templates/template'

export class AuthService {
  public generateRefreshToken(payload: { sessionId: Types.ObjectId }) {
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
  public generateAccessToken(payload: {
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

    if (user.userPreferences.enable2FA) {
      return {
        user: null,
        mfaRequired: true,
        accessToken: '',
        refreshToken: ''
      }
    }

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

  public async forgotPassword(email: string) {
    const user = await UserModel.findOne({ email })

    if (!user) throw new NotFoundException('User not found')

    const timeAgo = threeMinutesAgo()
    const maxAttempts = 2

    const count = await VerificationCodeModel.countDocuments({
      userId: user._id,
      type: VerificationEnum.PASSWORD_RESET,
      createdAt: { $gt: timeAgo }
    })

    if (count >= maxAttempts) {
      throw new HttpExeption(
        'Too many request, try again later',
        HTTP_STATUS.TOO_MANY_REQUESTS,
        ErrorCode.AUTH_TOO_MANY_ATTEMPTS
      )
    }

    const expiredAt = anHourFromNow()
    const validCode = await VerificationCodeModel.create({
      userId: user._id,
      type: VerificationEnum.PASSWORD_RESET,
      expiredAt
    })

    const resetLink = `${config.APP_ORIGIN}/reset-password?code=${validCode.code}&exp=${expiredAt.getTime()}`

    const { data, error } = await sendEmail({
      to: user.email,
      ...passwordResetTemplate(resetLink)
    })

    if (!data?.id) {
      throw new InternalServerException(`${error?.name} ${error?.message}`)
    }

    return {
      url: resetLink,
      emailId: data.id
    }
  }

  public async resetPassword({ code, password }: ResetPasswordDto) {
    const validCode = await VerificationCodeModel.findOne({ code })

    if (!validCode)
      throw new NotFoundException('Invalid or expired verification code')

    const hashedPassword = await hashValue(password)

    const updatedUser = await UserModel.findByIdAndUpdate(
      validCode.userId,
      { password: hashedPassword },
      { new: true }
    )

    if (!updatedUser) throw new BadRequestException('Fail to reset password')

    await validCode.deleteOne()
    await SessionModel.deleteMany({ userId: updatedUser._id })

    return { user: updatedUser }
  }

  public async logout(sessionId: string) {
    return await SessionModel.findByIdAndDelete(sessionId)
  }
}
