import express, { Request, Response } from 'express'
import 'dotenv/config'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { config } from './config/app.config'
import connectDatabase from './database/database'
import dns from 'node:dns/promises'
import { errorHandler } from './middlewares/errorHandler'
import asyncHandler from './middlewares/asyncHandler'
import { BadRequestException } from './common/utils/catch-errors'
import { ErrorCode } from './common/enums/error-code.enum'
import authRoute from './modules/auth/auth.route'

const app = express()
const { BASE_PATH, PORT, NODE_ENV } = config
dns.setServers(['1.1.1.1', '1.0.0.1'])

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({ origin: process.env.APP_ORIGIN, credentials: true }))
app.use(cookieParser())

app.use(`${BASE_PATH}/auth`, authRoute)
app.use(errorHandler)

connectDatabase()
app.listen(PORT, async () => {
  console.log(
    `Server is running on port ${PORT} : http://localhost:${PORT} in ${NODE_ENV}`
  )
})
