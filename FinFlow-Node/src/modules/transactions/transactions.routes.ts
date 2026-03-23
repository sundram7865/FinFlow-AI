import { Router } from 'express'
import * as txController from './transactions.controller'
import { authenticate } from '../../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/summary',  txController.summary)
router.get('/',         txController.list)
router.post('/',        txController.create)
router.get('/:id',      txController.getOne)
router.patch('/:id',    txController.update)
router.delete('/:id',   txController.remove)

export default router