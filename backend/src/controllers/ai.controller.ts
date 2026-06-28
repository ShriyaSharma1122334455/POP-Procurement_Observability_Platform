/**
 * controllers/ai.controller.ts
 * HTTP handlers for AI-powered endpoints.
 */

import type { Request, Response, NextFunction } from 'express'
import { z, ZodError } from 'zod'
import * as aiService from '../services/ai.service.js'

const savingsAgentBodySchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(500, 'Prompt too long'),
})

function formatZodError(err: ZodError) {
  return err.issues.map((e) => ({ field: e.path.join('.'), message: e.message }))
}

export async function savingsAgentHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = savingsAgentBodySchema.parse(req.body)
    const organizationId = req.user!.organizationId

    const result = await aiService.runSavingsAgent(body.prompt, organizationId)
    res.status(200).json(result)
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) })
      return
    }
    next(err)
  }
}
