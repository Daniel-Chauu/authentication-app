import passport from 'passport'
import { setupJwtStrategy } from '~/common/strategies/jwt.strategy'

const initializePassport = () => {
  console.log('INITIALIZE')
  setupJwtStrategy(passport)
}

initializePassport()

export default passport
