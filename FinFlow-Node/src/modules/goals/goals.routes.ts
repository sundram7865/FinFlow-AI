import { Router } from 'express'
import * as goalsController from './goals.controllers.js'
import { authenticate } from '../../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/',               goalsController.list)
router.post('/',              goalsController.create)
router.get('/:id',            goalsController.getOne)
router.get('/:id/progress',   goalsController.getProgress)
router.patch('/:id',          goalsController.update)
router.delete('/:id',         goalsController.remove)

export default router