import { HTTP_STATUS, HttpStatusCode } from '~/config/http.config'
import { ErrorCode } from '../enums/error-code.enum'
import { AppError } from './AppError'

export class NotFoundException extends AppError {
  constructor(message = 'Resource not found', errorCode?: ErrorCode) {
    super(
      message,
      HTTP_STATUS.NOT_FOUND,
      errorCode || ErrorCode.RESOURCE_NOT_FOUND
    )
  }
}

export class BadRequestException extends AppError {
  constructor(message = 'Bad Request', errorCode?: ErrorCode) {
    super(message, HTTP_STATUS.BAD_REQUEST, errorCode)
  }
}

export class UnauthorizedException extends AppError {
  constructor(message = 'Unauthorized Access', errorCode?: ErrorCode) {
    super(
      message,
      HTTP_STATUS.UNAUTHORIZED,
      errorCode || ErrorCode.ACCESS_UNAUTHORIZED
    )
  }
}

export class InternalServerException extends AppError {
  constructor(message = 'Internal Server Error', errorCode?: ErrorCode) {
    super(
      message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      errorCode || ErrorCode.INTERNAL_SERVER_ERROR
    )
  }
}

export class HttpExeption extends AppError {
  constructor(
    message = 'Http Exeption Error',
    statusCode: HttpStatusCode,
    errorCode?: ErrorCode
  ) {
    super(message, statusCode, errorCode)
  }
}
