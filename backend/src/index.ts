import dotenv from 'dotenv'
dotenv.config()

<<<<<<< HEAD
import app from './app.js'
import logger from './utils/logger.js'
=======
import app from './app'
import logger from './utils/logger'
>>>>>>> e7edd36ba28bd15e419092aff086f035d210fd88

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    logger.info(`POP backend running on port ${PORT}`)
})