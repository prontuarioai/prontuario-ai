// @whiskeysockets/baileys can be removed from package.json — no longer used
import { createClient } from '../lib/supabase'
import {
  createEvolutionInstance,
  getQRCode,
  sendTextMessage,
  sendPresence,
  logoutInstance,
  sessionToInstance,
} from './evolutionClient'

// Compatibility shim — routes call getSessions() but don't use the result critically
export function getSessions() { return new Map() }
export function getSession(_sessionId: string) { return null }

export function secretariaSessionId(clinicaId: string): string {
  return `sec-${clinicaId}`
}

export async function initWhatsApp() {
  const supabase = createClient()

  const { data: terapeutas } = await supabase
    .from('terapeutas')
    .select('id, whatsapp_number')
    .not('whatsapp_number', 'is', null)

  for (const t of terapeutas ?? []) {
    await createSession(t.id, 'profissional').catch((err) =>
      console.error(`[evolution] init profissional ${t.id}:`, err.message)
    )
  }

  const { data: clinicas } = await supabase
    .from('clinicas')
    .select('id')
    .eq('whatsapp_secretaria_ativo', true)

  for (const c of clinicas ?? []) {
    await createSession(secretariaSessionId(c.id), 'secretaria').catch((err) =>
      console.error(`[evolution] init secretaria ${c.id}:`, err.message)
    )
  }
}

export async function createSession(
  sessionId: string,
  _type: 'profissional' | 'secretaria' = 'profissional',
): Promise<{ ok: boolean }> {
  await createEvolutionInstance(sessionId)
  return { ok: true }
}

export async function getQR(sessionId: string): Promise<string | null> {
  const instanceName = sessionToInstance(sessionId)
  return getQRCode(instanceName)
}

export async function disconnectSession(sessionId: string): Promise<void> {
  const instanceName = sessionToInstance(sessionId)
  await logoutInstance(instanceName)
}

export async function sendText(
  sessionId: string,
  to: string,
  text: string,
): Promise<string | null> {
  const instanceName = sessionToInstance(sessionId)
  try {
    const phone = to.includes('@') ? to.replace(/@.*/, '') : to.replace(/\D/g, '')
    const { waMessageId } = await sendTextMessage(instanceName, phone, text)
    return waMessageId
  } catch (err) {
    console.error(`[evolution] sendText ${sessionId} → ${to}:`, (err as Error).message)
    return null
  }
}

export async function sendTyping(sessionId: string, to: string, ms: number): Promise<void> {
  const instanceName = sessionToInstance(sessionId)
  const phone = to.includes('@') ? to.replace(/@.*/, '') : to.replace(/\D/g, '')
  await sendPresence(instanceName, phone, ms)
  await new Promise((r) => setTimeout(r, Math.min(ms, 800)))
}

export async function sendMessage(sessionId: string, to: string, text: string) {
  await sendText(sessionId, to, text)
}

export async function sendMessageViaSecretaria(
  clinicaId: string | null,
  fallbackTerapeutaId: string,
  to: string,
  text: string,
) {
  if (clinicaId) {
    const sid = secretariaSessionId(clinicaId)
    try {
      await sendText(sid, to, text)
      return
    } catch {
      // fall through to profissional
    }
  }
  await sendText(fallbackTerapeutaId, to, text)
}
