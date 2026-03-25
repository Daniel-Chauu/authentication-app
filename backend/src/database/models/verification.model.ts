import mongoose, { Document, Schema } from 'mongoose'
import { VerificationEnum } from '~/common/enums/verification-code.enum'
import { generateUniqueCode } from '~/common/utils/uuid'

export interface VerificationCodeDocument extends Document {
  userId: mongoose.Types.ObjectId
  code: string
  type: VerificationEnum
  expiredAt: Date
  createdAt: Date
}

const verificationSchema = new Schema<VerificationCodeDocument>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: true
  },
  code: {
    type: String,
    unique: true,
    required: true,
    default: generateUniqueCode
  },
  type: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiredAt: {
    type: Date,
    required: true
  }
})

const VerificationCodeModel = mongoose.model<VerificationCodeDocument>(
  'VerificationCode',
  verificationSchema,
  'verification_codes'
)

export default VerificationCodeModel
