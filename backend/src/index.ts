import dotenv from 'dotenv'
dotenv.config()

import app from './app.ts'

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`POP backend running on port ${PORT}`)
})