import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import logger from './utils/logger.js'
import authRoutes from './routes/auth.routes.js'
import { errorHandler } from './middleware/error.middleware.js'

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

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
app.use('/auth', authRoutes)

// ── 404 catch-all ──────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' })
})

// ── Global error handler (must be last) ───────────────────────────────────
app.use(errorHandler)

export default app