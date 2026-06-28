/**
 * routes/ai.routes.ts
 * AI-powered endpoints exposed to the frontend.
 * All routes require JWT authentication.
 */

import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import { savingsAgentHandler } from '../controllers/ai.controller.js'

const router = Router()

router.use(authenticate)

router.post('/savings-agent', savingsAgentHandler)

export default router
