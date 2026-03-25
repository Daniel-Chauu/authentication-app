import jwt from 'jsonwebtoken'
import { TokenPayload } from '../interfaces/jwt.interface'

const signToken = ({
  payload,
  secretKey,
  options
}: {
  payload: string | Buffer | object
  secretKey: string
  options?: jwt.SignOptions
}) =>
  new Promise<string>((res, rej) => {
    jwt.sign(
      payload,
      secretKey,
      { algorithm: 'HS256', ...options },
      function (error, encoded) {
        if (error) {
          return rej(error)
        }
        res(encoded as string)
      }
    )
  })

const verifyToken = ({
  token,
  secretKey,
  options
}: {
  token: string
  secretKey: string
  options?: jwt.VerifyOptions
}) =>
  new Promise<TokenPayload>((res, rej) => {
    jwt.verify(token, secretKey, options, function (error, decoded) {
      if (error) {
        return rej(error)
      }

      res(decoded as TokenPayload)
    })
  })

export { signToken, verifyToken }
