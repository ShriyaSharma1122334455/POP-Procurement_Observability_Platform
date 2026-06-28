/**
 * controllers/spend.controller.ts
 * HTTP layer for spend analytics endpoints.
 * Parses and validates query params, delegates to spend.service, returns typed responses.
 */

import type { Request, Response, NextFunction } from 'express'
import { z, ZodError } from 'zod'
import * as spendService from '../services/spend.service.js'
import type { DateRangeFilter } from '../services/spend.service.js'

// ── Shared query-param schemas ────────────────────────────────────────────────

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .optional()

const dateRangeSchema = z.object({
  startDate: isoDate,
  endDate: isoDate,
})

const paginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(Math.max(parseInt(v ?? '20', 10) || 20, 1), 100)),
  offset: z
    .string()
    .optional()
    .transform((v) => Math.max(parseInt(v ?? '0', 10) || 0, 0)),
})

// ── Helper ────────────────────────────────────────────────────────────────────

function buildFilter(req: Request, extra?: Partial<DateRangeFilter>): DateRangeFilter {
  const parsed = dateRangeSchema.parse(req.query)
  return {
    startDate: parsed.startDate,
    endDate: parsed.endDate,
    // Scope to the authenticated user's org; admins can override via query param
    organizationId:
      (req.query['organizationId'] as string | undefined) ??
      req.user?.organizationId,
    ...extra,
  }
}

function formatZodError(err: ZodError) {
  return err.issues.map((e) => ({ field: e.path.join('.'), message: e.message }))
}

// ── Handlers ──────────────────────────────────────────────────────────────────

/**
 * GET /spend/summary
 * Query params: startDate?, endDate?, organizationId?
 */
export async function summaryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const filter = buildFilter(req)
    const data = await spendService.getSpendSummary(filter)
    res.json(data)
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) })
      return
    }
    next(err)
  }
}

/**
 * GET /spend/trends
 * Query params: startDate?, endDate?, organizationId?
 * Defaults to last 12 months.
 */
export async function trendsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const filter = buildFilter(req)
    const data = await spendService.getSpendTrends(filter)
    res.json(data)
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) })
      return
    }
    next(err)
  }
}

/**
 * GET /spend/categories
 * Query params: startDate?, endDate?, organizationId?
 * Aggregates spend from line items grouped by category.
 */
export async function categoriesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const filter = buildFilter(req)
    const data = await spendService.getSpendByCategories(filter)
    res.json(data)
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) })
      return
    }
    next(err)
  }
}

/**
 * GET /spend/suppliers
 * Query params: startDate?, endDate?, organizationId?, limit?, offset?
 * Returns spend per supplier sorted by totalSpend desc with pagination.
 */
export async function suppliersHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const filter = buildFilter(req)
    const { limit, offset } = paginationSchema.parse(req.query)
    const data = await spendService.getSpendBySuppliers(filter, { limit, offset })
    res.json(data)
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) })
      return
    }
    next(err)
  }
}
