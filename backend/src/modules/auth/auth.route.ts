import { Router } from 'express'
import { authController } from './auth.module'

const authRoute = Router()

authRoute.post('/register', authController.register)

authRoute.post('/login', authController.login)

authRoute.get('/refresh-token', authController.refreshToken)

authRoute.post('/verify-email', authController.verifyEmail)

export default authRoute
