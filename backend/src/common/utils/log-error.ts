import { Request } from 'express'

const logError = (err: any, req: Request) => {
  console.log(
    '--------------------------------------------------------------------------------------'
  )
  console.log('ERROR LOG ', new Date().toLocaleString())
  console.log('Request:', req.method, req.originalUrl)
  console.log('Params:', req.params)
  console.log('Body:', req.body)
  console.log('Query:', req.query)
  console.log('Path:', req.path)
  console.log('Error: ', err?.message)
  // console.log('Error stack: ', err.stack)
  console.log(
    '--------------------------------------------------------------------------------------'
  )
}

export default logError
