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

// Transform AI service response → frontend AgentResponse shape
function transformSavingsResponse(prompt: string, raw: Record<string, unknown>) {
  const recommendations = (raw['recommendations'] as Record<string, unknown>[] | undefined) ?? []
  const opportunities = recommendations.map((r, i) => ({
    id: String(i + 1),
    title: String(r['title'] ?? ''),
    description: String(r['description'] ?? ''),
    estimatedSavings: Number(r['estimated_monthly_savings'] ?? 0),
    annualizedSavings: Number(r['estimated_annual_savings'] ?? 0),
    category: String(r['category'] ?? ''),
    confidence: String(r['confidence_level'] ?? 'MEDIUM').toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH',
    recommendedAction: String(r['recommended_action'] ?? ''),
    affectedSuppliers: (r['affected_supplier_ids'] as string[] | undefined) ?? [],
  }))

  const totalPotentialSavings = opportunities.reduce((sum, o) => sum + o.annualizedSavings, 0)

  return {
    query: prompt,
    summary: String(raw['analysis_summary'] ?? ''),
    totalPotentialSavings,
    opportunities,
    analysisSteps: [
      'Scanned active suppliers and purchase history',
      'Identified spend categories with highest variance',
      'Benchmarked supplier pricing against market data',
      'Calculated net savings after estimated switching costs',
    ],
    processingTime: 0,
  }
}

export async function savingsAgentHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = savingsAgentBodySchema.parse(req.body)
    const organizationId = req.user!.organizationId

    const raw = await aiService.runSavingsAgent(body.prompt, organizationId) as Record<string, unknown>
    const result = transformSavingsResponse(body.prompt, raw)
    res.status(200).json({ success: true, data: result })
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) })
      return
    }
    next(err)
  }
}
