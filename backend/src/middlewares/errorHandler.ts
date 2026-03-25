import { ErrorRequestHandler, Response } from 'express'
import { ZodError } from 'zod'
import { ErrorCode } from '~/common/enums/error-code.enum'
import { AppError } from '~/common/utils/AppError'
import { clearAuthenticationCookies, REFRESH_PATH } from '~/common/utils/cookie'
import logError from '~/common/utils/log-error'
import { HTTP_STATUS } from '~/config/http.config'

const formatZodError = (res: Response, error: ZodError) => {
  const errors = error?.issues?.map((err) => ({
    message: err.message,
    field: err.path.join('.')
  }))

  return res.status(HTTP_STATUS.BAD_REQUEST).json({
    message: 'Validation failed',
    errors: errors,
    errorCode: ErrorCode.VALIDATION_ERROR
  })
}

export const errorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  next
): any => {
  logError(error, req)

  if (req.path === REFRESH_PATH) {
    clearAuthenticationCookies(res)
  }

  if (error instanceof SyntaxError) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ message: 'Invalid JSON format, please check your request body.' })
  }

  if (error instanceof ZodError) {
    return formatZodError(res, error)
  }

  if (error instanceof AppError) {
    return res
      .status(error.statusCode)
      .json({ errorCode: error.errorCode, message: error.message })
  }

  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: 'Internal Server Error',
    error: error?.message || 'Unknown error occurred'
  })
}
