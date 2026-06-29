/**
 * routes/agent.routes.ts
 * Frontend-facing agent endpoints.
 * POST /api/agent/query   → proxies to AI savings agent
 * GET  /api/agent/history → returns empty (history stored client-side)
 */

import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import { savingsAgentHandler } from '../controllers/ai.controller.js'

const router = Router()

router.use(authenticate)

// Maps frontend POST /agent/query → savingsAgentHandler
router.post('/query', savingsAgentHandler)

// History is persisted client-side in localStorage; backend returns empty
router.get('/history', (_req, res) => {
  res.status(200).json({ success: true, data: [] })
})

export default router
