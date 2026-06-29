/**
 * controllers/supplier.controller.ts
 * HTTP handlers for supplier management.
 */

import type { Request, Response, NextFunction } from 'express'
import { z, ZodError } from 'zod'
import * as supplierService from '../services/supplier.service.js'
import * as aiService from '../services/ai.service.js'
import type { SupplierCategory, SupplierItem } from '../db/types.js'

function mapSupplier(s: SupplierItem) {
  return {
    id: s.supplierId,
    name: s.name,
    category: s.category,
    reliabilityScore: s.reliabilityScore,
    competitivenessScore: s.competitivenessScore,
    riskScore: s.riskScore,
    relationshipScore: s.relationshipScore,
    recommendation: s.recommendation,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }
}

const listSuppliersQuerySchema = z.object({
  category: z
    .enum([
      'FOOD_BEVERAGE',
      'RAW_MATERIALS',
      'LOGISTICS',
      'TECHNOLOGY',
      'PROFESSIONAL_SERVICES',
      'UTILITIES',
      'OTHER',
    ])
    .optional(),
})

const getSupplierParamsSchema = z.object({
  id: z.string().min(1, 'Supplier ID is required'),
})

function formatZodError(err: ZodError) {
  return err.issues.map((e) => ({ field: e.path.join('.'), message: e.message }))
}

export async function listSuppliersHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = listSuppliersQuerySchema.parse(req.query)
    const organizationId = req.user!.organizationId

    const suppliers = await supplierService.listSuppliers(
      organizationId,
      query.category as SupplierCategory | undefined
    )

    const mapped = suppliers.map(mapSupplier)
    res.status(200).json({
      success: true,
      data: {
        data: mapped,
        total: mapped.length,
        page: 1,
        limit: mapped.length,
        hasMore: false,
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

export async function getSupplierByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const params = getSupplierParamsSchema.parse(req.params)
    const organizationId = req.user!.organizationId

    const supplier = await supplierService.getSupplierById(
      params.id,
      organizationId
    )

    if (!supplier) {
      res.status(404).json({ error: 'Supplier not found' })
      return
    }

    res.status(200).json({ success: true, data: mapSupplier(supplier) })
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) })
      return
    }
    next(err)
  }
}

const getSupplierSummaryParamsSchema = z.object({
  id: z.string().min(1, 'Supplier ID is required'),
})

export async function getSupplierSummaryHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const params = getSupplierSummaryParamsSchema.parse(req.params)
    const organizationId = req.user!.organizationId

    const summary = await aiService.getSupplierSummary(params.id, organizationId)
    res.status(200).json({ success: true, data: summary })
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) })
      return
    }
    next(err)
  }
}

// GET /api/suppliers/:id/spend — returns spend trend data for a supplier
export async function getSupplierSpendHandler(
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  // Spend-per-supplier aggregation not yet implemented; return empty array
  // so the frontend falls back to its mock gracefully
  res.status(200).json({ success: true, data: [] })
}
