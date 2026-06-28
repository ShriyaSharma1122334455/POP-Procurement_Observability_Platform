/**
 * controllers/alert.controller.ts
 * HTTP handlers for alert management.
 */

import type { Request, Response, NextFunction } from 'express'
import { z, ZodError } from 'zod'
import * as alertService from '../services/alert.service.js'
import * as aiService from '../services/ai.service.js'
import type { AlertStatus, AlertSeverity, AlertType } from '../db/types.js'

const listAlertsQuerySchema = z.object({
  status: z
    .enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'])
    .optional(),
  severity: z
    .enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .optional(),
})

const createAlertBodySchema = z.object({
  type: z.enum([
    'PRICE_SPIKE',
    'SUPPLIER_RISK',
    'CONTRACT_EXPIRY',
    'SPEND_CONCENTRATION',
    'MARKET_ANOMALY',
    'BUDGET_OVERRUN',
  ]),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  message: z.string().min(1, 'Message is required'),
  supplierId: z.string().optional(),
  title: z.string().optional(),
})

function formatZodError(err: ZodError) {
  return err.issues.map((e) => ({ field: e.path.join('.'), message: e.message }))
}

export async function listAlertsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = listAlertsQuerySchema.parse(req.query)
    const organizationId = req.user!.organizationId

    const alerts = await alertService.listAlerts(
      organizationId,
      query.status as AlertStatus | undefined,
      query.severity as AlertSeverity | undefined
    )

    res.status(200).json({ alerts })
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) })
      return
    }
    next(err)
  }
}

export async function createAlertHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = createAlertBodySchema.parse(req.body)
    const organizationId = req.user!.organizationId

    const alert = await alertService.createAlert({
      ...body,
      organizationId,
      type: body.type as AlertType,
      severity: body.severity as AlertSeverity,
    })

    res.status(201).json({
      message: 'Alert created successfully',
      alert,
    })
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) })
      return
    }
    next(err)
  }
}

const explainAlertParamsSchema = z.object({
  id: z.string().min(1, 'Alert ID is required'),
})

export async function explainAlertHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const params = explainAlertParamsSchema.parse(req.params)
    const organizationId = req.user!.organizationId

    const explanation = await aiService.explainAlert(params.id, organizationId)
    res.status(200).json({ explanation })
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(err) })
      return
    }
    next(err)
  }
}
