/**
 * Global error handler that reads `statusCode` from service-layer errors.
 * Known status codes (4xx) are logged at warn; unknown (5xx) at error.
 */
import type { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger.js'

interface AppError extends Error {
  statusCode?: number
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  // Express requires the 4-argument signature even if next is unused
  _next: NextFunction,
): void {
  const status = err.statusCode ?? 500

  if (status >= 500) {
    logger.error({ err }, err.message)
  } else {
    logger.warn({ err }, err.message)
  }

  res.status(status).json({ error: err.message })
}
