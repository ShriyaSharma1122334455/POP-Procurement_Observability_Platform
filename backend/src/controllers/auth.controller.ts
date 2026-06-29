/**
 * controllers/auth.controller.ts
 * Thin HTTP layer — validates input, delegates to service, formats responses.
 */

import type { Request, Response, NextFunction } from 'express'
import { z, ZodError } from 'zod'
import * as authService from '../services/auth.service.js'
import type { UserItem } from '../db/types.js'

function mapUser(user: Omit<UserItem, 'passwordHash'>) {
  return {
    id: user.userId,
    name: user.name,
    email: user.email,
    role: user.role.toLowerCase() as string,
    createdAt: user.createdAt,
  }
}

// ── Input schemas (Zod) ───────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: z
    .enum(['ADMIN', 'PROCUREMENT_MANAGER', 'CFO', 'OPERATIONS_MANAGER', 'VIEWER'])
    .optional(),
  organizationId: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatZodError(err: ZodError) {
  return err.issues.map((e) => ({ field: e.path.join('.'), message: e.message }))
}

// ── Handlers ──────────────────────────────────────────────────────────────────

/**
 * POST /auth/register
 * Body: { email, password, name, role?, organizationId? }
 */
export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = registerSchema.parse(req.body)
    const result = await authService.register(body)
    res.status(201).json({
      success: true,
      data: {
        user: mapUser(result.user),
        token: result.accessToken,
        expiresIn: 28800,
      },
    })
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) })
      return
    }
    next(err)
  }
}

/**
 * POST /auth/login
 * Body: { email, password }
 */
export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = loginSchema.parse(req.body)
    const result = await authService.login(body)
    res.status(200).json({
      success: true,
      data: {
        user: mapUser(result.user),
        token: result.accessToken,
        expiresIn: 28800,
      },
    })
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) })
      return
    }
    next(err)
  }
}

/**
 * GET /auth/profile
 * Requires: authenticate middleware (attaches req.user)
 */
export async function profileHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // req.user is guaranteed by authenticate middleware
    const user = await authService.getProfile(req.user!.sub)
    res.status(200).json({ success: true, data: mapUser(user) })
  } catch (err) {
    next(err)
  }
}
