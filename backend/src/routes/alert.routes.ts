/**
 * routes/alert.routes.ts
 * Alert endpoints. All require JWT authentication.
 */

import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import {
  listAlertsHandler,
  createAlertHandler,
  explainAlertHandler,
} from '../controllers/alert.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', listAlertsHandler)
router.post('/', createAlertHandler)
router.get('/:id/explain', explainAlertHandler)

export default router
