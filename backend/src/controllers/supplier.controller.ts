/**
 * controllers/supplier.controller.ts
 * HTTP handlers for supplier management.
 */

import type { Request, Response, NextFunction } from 'express'
import { z, ZodError } from 'zod'
import * as supplierService from '../services/supplier.service.js'
import * as aiService from '../services/ai.service.js'
import * as spendService from '../services/spend.service.js'
import type { SupplierCategory, SupplierItem } from '../db/types.js'

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])

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

const SUPPLIER_CATEGORIES = [
  'FOOD_BEVERAGE',
  'RAW_MATERIALS',
  'LOGISTICS',
  'TECHNOLOGY',
  'PROFESSIONAL_SERVICES',
  'UTILITIES',
  'OTHER',
] as const

const createSupplierBodySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  category: z.enum(SUPPLIER_CATEGORIES),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  country: z.string().max(100).optional(),
  contractExpiry: z.string().optional(),
})

export async function createSupplierHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = createSupplierBodySchema.parse(req.body)
    const organizationId = req.user!.organizationId
    const supplier = await supplierService.createSupplier({
      ...body,
      website: body.website || undefined,
      organizationId,
    })
    res.status(201).json({ success: true, data: mapSupplier(supplier) })
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) })
      return
    }
    next(err)
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
  search: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
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
      query.category as SupplierCategory | undefined,
      query.search
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

const extractDocBodySchema = z.object({
  file_base64: z.string().min(1, 'file_base64 is required'),
  mime_type: z.string().refine((v) => ALLOWED_MIME_TYPES.has(v), {
    message: 'Only JPEG, PNG, and WebP files are supported',
  }),
})

export async function extractSupplierDocHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { file_base64, mime_type } = extractDocBodySchema.parse(req.body)
    const fileBuffer = Buffer.from(file_base64, 'base64')
    const result = await aiService.extractSupplierFromDoc(fileBuffer, mime_type)
    res.status(200).json({ success: true, data: result })
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) })
      return
    }
    next(err)
  }
}

const extractTextBodySchema = z.object({
  text: z.string().min(1, 'text is required'),
})

export async function extractSupplierTextHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { text } = extractTextBodySchema.parse(req.body)
    const result = await aiService.extractSupplierFromText(text)
    res.status(200).json({ success: true, data: result })
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) })
      return
    }
    next(err)
  }
}

const PERIOD_DAYS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 }

// GET /api/suppliers/:id/spend — returns daily spend trend for a supplier
export async function getSupplierSpendHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const params = getSupplierParamsSchema.parse(req.params)
    const organizationId = req.user!.organizationId
    const period = (req.query['period'] as string) ?? '90d'
    const days = PERIOD_DAYS[period] ?? 90
    const endDate = new Date().toISOString().slice(0, 10)
    const startDate = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)

    const trends = await spendService.getSpendTrends({
      organizationId,
      startDate,
      endDate,
      supplierId: params.id,
    })

    res.status(200).json({ success: true, data: trends })
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) })
      return
    }
    next(err)
  }
}
