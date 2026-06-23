import { Router, Request, Response } from 'express'
import { createClient } from '../lib/supabase'
import { getSessions, getQR, disconnectSession, sendMessage, createSession, secretariaSessionId, sendMessageViaSecretaria } from '../whatsapp/manager'
import { getConnectionState, sessionToInstance } from '../whatsapp/evolutionClient'
import { handleEvolutionWebhook } from '../whatsapp/handlers'

const router = Router()

function authMiddleware(req: Request, res: Response, next: () => void) {
  if (req.headers['x-api-secret'] !== process.env.API_SECRET) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}

// ──────────────────────────────────────────────
// Rotas genéricas (por sessionId — profissional)
// ──────────────────────────────────────────────

router.get('/status/:sessionId', authMiddleware, async (req, res) => {
  const state = await getConnectionState(sessionToInstance(req.params.sessionId)).catch(() => 'close')
  res.json({ connected: state === 'open' })
})

router.get('/qr/:sessionId', authMiddleware, (req, res) => {
  const qr = getQR(req.params.sessionId)
  res.json({ qr: qr ?? null })
})

router.post('/connect/:sessionId', authMiddleware, async (req, res) => {
  const { sessionId } = req.params
  const existing = getSessions().get(sessionId)
  if (existing?.connected) {
    res.json({ ok: true, connected: true })
    return
  }
  await disconnectSession(sessionId)
  await createSession(sessionId, 'profissional')
  res.json({ ok: true })
})

router.post('/disconnect/:sessionId', authMiddleware, async (req, res) => {
  await disconnectSession(req.params.sessionId)
  res.json({ ok: true })
})

// ──────────────────────────────────────────────
// Rotas da secretária (por clinicaId)
// ──────────────────────────────────────────────

router.get('/secretaria/status/:clinicaId', authMiddleware, async (req, res) => {
  const sid = secretariaSessionId(req.params.clinicaId)
  const state = await getConnectionState(sessionToInstance(sid)).catch(() => 'close')
  res.json({ connected: state === 'open' })
})

router.get('/secretaria/qr/:clinicaId', authMiddleware, (req, res) => {
  const sid = secretariaSessionId(req.params.clinicaId)
  res.json({ qr: getQR(sid) ?? null })
})

router.post('/secretaria/connect/:clinicaId', authMiddleware, async (req, res) => {
  const { clinicaId } = req.params
  const sid = secretariaSessionId(clinicaId)
  const existing = getSessions().get(sid)
  if (existing?.connected) {
    res.json({ ok: true, connected: true })
    return
  }
  await disconnectSession(sid)
  await createSession(sid, 'secretaria')

  // Marcar no banco que a secretária está ativa para restaurar no próximo boot
  const supabase = createClient()
  await supabase.from('clinicas').update({ whatsapp_secretaria_ativo: true }).eq('id', clinicaId)

  res.json({ ok: true })
})

router.post('/secretaria/disconnect/:clinicaId', authMiddleware, async (req, res) => {
  const { clinicaId } = req.params
  await disconnectSession(secretariaSessionId(clinicaId))

  const supabase = createClient()
  await supabase.from('clinicas').update({ whatsapp_secretaria_ativo: false }).eq('id', clinicaId)

  res.json({ ok: true })
})

// ──────────────────────────────────────────────
// Enviar mensagem manual
// ──────────────────────────────────────────────

router.post('/send', authMiddleware, async (req, res) => {
  const { sessionId, to, text } = req.body
  if (!sessionId || !to || !text) {
    res.status(400).json({ error: 'sessionId, to e text são obrigatórios.' })
    return
  }
  await sendMessage(sessionId, to, text)
  res.json({ ok: true })
})

// Enviar com fallback para secretária (uso pelo frontend)
router.post('/send-via-secretaria', authMiddleware, async (req, res) => {
  const { clinicaId, fallbackTerapeutaId, to, text } = req.body
  if (!fallbackTerapeutaId || !to || !text) {
    res.status(400).json({ error: 'fallbackTerapeutaId, to e text são obrigatórios.' })
    return
  }
  await sendMessageViaSecretaria(clinicaId ?? null, fallbackTerapeutaId, to, text)
  res.json({ ok: true })
})

// ── Evolution API webhook (no auth — called directly by Evolution server) ──
router.post('/webhook/:sessionId', async (req, res) => {
  res.json({ ok: true }) // respond immediately so Evolution doesn't retry
  await handleEvolutionWebhook(req.params.sessionId, req.body).catch((err) =>
    console.error('[evolution] webhook error:', err.message)
  )
})

export default router
