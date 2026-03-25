import { ErrorCode } from '~/common/enums/error-code.enum'
import { VerificationEnum } from '~/common/enums/verification-code.enum'
import { RegisterDto } from '~/common/interfaces/auth.interface'
import { BadRequestException } from '~/common/utils/catch-errors'
import { fortyFiveMinutesFromNow } from '~/common/utils/date-time'
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
}
