import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initWhatsApp } from './whatsapp/manager'
import { initSchedulers } from './scheduler'
import whatsappRoutes from './routes/whatsapp'
import healthRoutes from './routes/health'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: process.env.APP_URL }))
app.use(express.json())

app.use('/health', healthRoutes)
app.use('/whatsapp', whatsappRoutes)

app.listen(PORT, async () => {
  console.log(`API Prontuario.ai rodando na porta ${PORT}`)
  await initWhatsApp()
  initSchedulers()
})
