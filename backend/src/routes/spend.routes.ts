/**
 * routes/spend.routes.ts
 * All /spend endpoints are JWT-protected.
 *
 *  GET  /spend/summary    → total spend + MoM change
 *  GET  /spend/trends     → monthly spend for last 12 months
 *  GET  /spend/categories → spend grouped by category
 *  GET  /spend/suppliers  → spend per supplier (paginated, sorted desc)
 */

import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import {
  summaryHandler,
  trendsHandler,
  categoriesHandler,
  suppliersHandler,
} from '../controllers/spend.controller.js'

const router = Router()

// All spend routes require a valid JWT
router.use(authenticate)

router.get('/summary', summaryHandler)
router.get('/trends', trendsHandler)
router.get('/categories', categoriesHandler)
router.get('/suppliers', suppliersHandler)

export default router
