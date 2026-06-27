/**
 * controllers/supplier.controller.ts
 * HTTP handlers for supplier management.
 */

import type { Request, Response, NextFunction } from 'express'
import { z, ZodError } from 'zod'
import * as supplierService from '../services/supplier.service.js'
import type { SupplierCategory } from '../db/types.js'

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

    res.status(200).json({ suppliers })
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

    res.status(200).json({ supplier })
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) })
      return
    }
    next(err)
  }
}
