/**
 * routes/auth.routes.ts
 * Mounts all /auth endpoints and applies middleware per route.
 *
 *  POST   /auth/register  → public
 *  POST   /auth/login     → public
 *  GET    /auth/profile   → protected (any authenticated user)
 */

import { Router } from 'express'
import { registerHandler, loginHandler, profileHandler } from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

router.post('/register', registerHandler)
router.post('/login', loginHandler)
router.get('/profile', authenticate, profileHandler)

export default router
