import { Router } from 'express'
import { sessionController } from './session.module'

const sessionRoute = Router()

sessionRoute.get('/all', sessionController.getAllSessions)

sessionRoute.get('/', sessionController.getSession)

sessionRoute.delete('/:id', sessionController.deleteSession)

export default sessionRoute
