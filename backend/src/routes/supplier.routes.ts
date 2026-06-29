/**
 * routes/supplier.routes.ts
 * Supplier endpoints. All require JWT authentication.
 */

import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import {
  listSuppliersHandler,
  getSupplierByIdHandler,
  getSupplierSummaryHandler,
  getSupplierSpendHandler,
} from '../controllers/supplier.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', listSuppliersHandler)
router.get('/:id/summary', getSupplierSummaryHandler)
router.get('/:id/spend', getSupplierSpendHandler)
router.get('/:id', getSupplierByIdHandler)

export default router
