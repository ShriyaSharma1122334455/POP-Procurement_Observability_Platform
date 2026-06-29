import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import logger from './utils/logger.js'
import authRoutes from './routes/auth.routes.js'
import spendRoutes from './routes/spend.routes.js'
import supplierRoutes from './routes/supplier.routes.js'
import alertRoutes from './routes/alert.routes.js'
import aiRoutes from './routes/ai.routes.js'
import agentRoutes from './routes/agent.routes.js'
import { errorHandler } from './middleware/error.middleware.js'

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '20mb' }))

// ── Request logging ────────────────────────────────────────────────────────
app.use((req, _res, next) => {
    logger.info({ method: req.method, url: req.url }, 'incoming request')
    next()
})

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Feature routes ─────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/spend', spendRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/agent', agentRoutes)

// ── 404 catch-all ──────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' })
})

// ── Global error handler (must be last) ───────────────────────────────────
app.use(errorHandler)

export default app