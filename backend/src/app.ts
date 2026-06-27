import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import logger from './utils/logger'

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

app.use((req, _res, next) => {
    logger.info({ method: req.method, url: req.url }, 'incoming request')
    next()
})

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' })
})

app.use((err: Error, _req: express.Request, res: express.Response) => {
    logger.error({ err }, err.message)
    res.status(500).json({ error: 'Internal server error' })
})

export default app