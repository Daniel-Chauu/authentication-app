import { ErrorRequestHandler } from 'express'
import { AppError } from '~/common/utils/AppError'
import logError from '~/common/utils/log-error'
import { HTTP_STATUS } from '~/config/http.config'

export const errorHandler: ErrorRequestHandler = (error, req, res, next): any => {
  logError(error, req)

  if (error instanceof SyntaxError) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ message: 'Invalid JSON format, please check your request body.' })
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ errorCode: error.errorCode, message: error.message })
  }

  return res
    .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    .json({ message: 'Internal Server Error', error: error?.message || 'Unknown error occurred' })
}
