/**
 * middleware/auth.middleware.ts
 * JWT Bearer token validation + role-based access control (RBAC).
 *
 * Usage:
 *   router.get('/profile', authenticate, handler)
 *   router.delete('/user', authenticate, authorize('ADMIN'), handler)
 *   router.get('/orders', authenticate, authorize('ADMIN', 'PROCUREMENT_MANAGER'), handler)
 */

import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { JwtPayload } from '../services/auth.service.js'
import type { UserRole } from '../db/types.js'

// ── Augment Express Request ───────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Decoded JWT payload attached by `authenticate` middleware. */
      user?: JwtPayload
    }
  }
}

// ── authenticate ──────────────────────────────────────────────────────────────

/**
 * Validates the `Authorization: Bearer <token>` header.
 * On success attaches `req.user` and calls `next()`.
 * On failure responds immediately with 401.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization']

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header missing or malformed' })
    return
  }

  const token = authHeader.slice(7) // strip "Bearer "

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    req.user = payload
    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' })
    } else {
      res.status(401).json({ error: 'Invalid token' })
    }
  }
}

// ── authorize ─────────────────────────────────────────────────────────────────

/**
 * Role-based access control guard. Must be used *after* `authenticate`.
 *
 * @param roles One or more UserRole values allowed to access the route.
 *
 * @example
 *   router.get('/admin', authenticate, authorize('ADMIN'), handler)
 *   router.get('/dashboard', authenticate, authorize('ADMIN', 'PROCUREMENT_MANAGER', 'CFO'), handler)
 */
export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      // Should not happen if `authenticate` ran first, but guard anyway
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Required role: ${roles.join(' | ')}. Your role: ${req.user.role}`,
      })
      return
    }

    next()
  }
}
