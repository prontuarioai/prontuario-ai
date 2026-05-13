import { Router, Request, Response } from 'express'
import { getSessions, getQR, disconnectSession } from '../whatsapp/manager'

const router = Router()

function authMiddleware(req: Request, res: Response, next: () => void) {
  if (req.headers['x-api-secret'] !== process.env.API_SECRET) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}

router.get('/status/:terapeutaId', authMiddleware, (req, res) => {
  const sessions = getSessions()
  const session = sessions.get(req.params.terapeutaId)
  res.json({ connected: session?.connected ?? false })
})

router.get('/qr/:terapeutaId', authMiddleware, (req, res) => {
  const qr = getQR(req.params.terapeutaId)
  if (!qr) {
    res.json({ qr: null })
    return
  }
  res.json({ qr })
})

router.post('/disconnect/:terapeutaId', authMiddleware, async (req, res) => {
  await disconnectSession(req.params.terapeutaId)
  res.json({ ok: true })
})

router.post('/send', authMiddleware, async (req, res) => {
  const { terapeutaId, to, text } = req.body
  if (!terapeutaId || !to || !text) {
    res.status(400).json({ error: 'terapeutaId, to e text são obrigatórios.' })
    return
  }
  await sendMessage(terapeutaId, to, text)
  res.json({ ok: true })
})

export default router
