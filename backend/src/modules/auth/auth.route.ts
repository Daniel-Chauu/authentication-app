import { Router } from 'express'
import { authController } from './auth.module'
import wrapAsyncHandler from '~/middlewares/asyncHandler'

const authRoute = Router()

authRoute.post('/register', authController.register)

authRoute.post('/login', authController.login)

export default authRoute
