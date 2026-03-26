import z from 'zod'
import VerificationCodeModel from '~/database/models/verification.model'

const emailSchema = z.string().trim().email().min(1).max(255)
const passwordSchema = z.string().trim().min(6).max(255)
const verifycationCodeSchema = z.string().trim().min(1).max(255)

export const registerSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
    userAgent: z.string().optional()
  })
  .refine((val) => val.password === val.confirmPassword, {
    message: 'Confirm password does not match',
    path: ['confirmPassword']
  })

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  userAgent: z.string().optional()
})

export const verifycationEmailSchema = z.object({
  code: verifycationCodeSchema
})
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  code: verifycationCodeSchema
})
