import jwt, { JwtPayload } from 'jsonwebtoken'
import {
  AccessTokenPayload,
  RefreshTokenPayload
} from '../interfaces/jwt.interface'

const defaults = {
  audience: ['user']
}

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
      { algorithm: 'HS256', ...defaults, ...options },
      function (error, encoded) {
        if (error) {
          return rej(error)
        }
        res(encoded as string)
      }
    )
  })

const verifyToken = <T extends JwtPayload>({
  token,
  secretKey,
  options
}: {
  token: string
  secretKey: string
  options?: jwt.VerifyOptions
}) =>
  new Promise<T>((res, rej) => {
    jwt.verify(
      token,
      secretKey,
      { audience: ['user'], ...options },
      function (error, decoded) {
        if (error) {
          return rej(error)
        }

        res(decoded as T)
      }
    )
  })

export { signToken, verifyToken }
