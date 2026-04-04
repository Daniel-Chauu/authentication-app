import { Router } from 'express'
import { authController } from './auth.module'

const authRoute = Router()

authRoute.post('/register', authController.register)

authRoute.post('/login', authController.login)

authRoute.get('/refresh-token', authController.refreshToken)

authRoute.post('/password/forgot', authController.forgotPassword)

authRoute.post('/password/reset', authController.resetPassword)

authRoute.post('/logout', authController.logout)

authRoute.post('/verify-email', authController.verifyEmail)

export default authRoute
