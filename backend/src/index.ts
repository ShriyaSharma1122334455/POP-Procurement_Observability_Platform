// Load env vars FIRST — before any other import evaluates config/env.ts
import 'dotenv/config'

import app from './app.js'
import logger from './utils/logger.js'
import { env } from './config/env.js'

app.listen(env.PORT, () => {
    logger.info(`POP backend running on port ${env.PORT} [${env.NODE_ENV}]`)
})