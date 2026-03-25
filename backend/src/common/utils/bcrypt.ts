import bcrypt from 'bcrypt'

const hashValue = async (value: string, saltRounds: number = 10) => {
  return await bcrypt.hash(value, saltRounds)
}

const compareValue = async (value: string, hashedValue: string) => {
  return await bcrypt.compare(value, hashedValue)
}

export { hashValue, compareValue }
