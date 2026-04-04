import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import dns from 'node:dns/promises'
import { config } from './config/app.config'
import connectDatabase from './database/database'
import { errorHandler } from './middlewares/errorHandler'
import authRoute from './modules/auth/auth.route'
import { authenticateJWT } from './common/strategies/jwt.strategy'
import passport from './middlewares/passport'
import sessionRoute from './modules/session/session.route'

const app = express()
const { BASE_PATH, PORT, NODE_ENV } = config
dns.setServers(['1.1.1.1', '1.0.0.1'])

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({ origin: process.env.APP_ORIGIN, credentials: true }))
app.use(cookieParser())

app.use(passport.initialize())

app.use(`${BASE_PATH}/auth`, authRoute)

app.use(`${BASE_PATH}/session`, authenticateJWT, sessionRoute)

app.use(errorHandler)

connectDatabase()
app.listen(PORT, async () => {
  console.log(
    `Server is running on port ${PORT} : http://localhost:${PORT} in ${NODE_ENV}`
  )
})
