import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import path from 'path'
import { createClient } from '../lib/supabase'
import { handleIncomingMessage } from './handlers'

interface SessionData {
  socket: ReturnType<typeof makeWASocket> | null
  connected: boolean
  qr: string | null
}

const sessions = new Map<string, SessionData>()
const pendingQRs = new Map<string, string>()

export function getSessions() { return sessions }
export function getQR(terapeutaId: string) { return pendingQRs.get(terapeutaId) ?? null }

export async function initWhatsApp() {
  const supabase = createClient()
  const { data: terapeutas } = await supabase
    .from('terapeutas')
    .select('id, whatsapp_number')
    .not('whatsapp_number', 'is', null)

  for (const t of terapeutas ?? []) {
    await createSession(t.id)
  }
}

export async function createSession(terapeutaId: string) {
  const authDir = path.join(process.cwd(), 'sessions', terapeutaId)
  const { state, saveCreds } = await useMultiFileAuthState(authDir)
  const { version } = await fetchLatestBaileysVersion()

  const socket = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, console as any),
    },
    printQRInTerminal: false,
    browser: ['Prontuario.ai', 'Chrome', '120.0.0'],
  })

  sessions.set(terapeutaId, { socket, connected: false, qr: null })

  socket.ev.on('creds.update', saveCreds)

  socket.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      const QRCode = await import('qrcode')
      const qrDataUrl = await QRCode.toDataURL(qr)
      pendingQRs.set(terapeutaId, qrDataUrl)
    }

    if (connection === 'open') {
      pendingQRs.delete(terapeutaId)
      const session = sessions.get(terapeutaId)
      if (session) session.connected = true
    }

    if (connection === 'close') {
      const session = sessions.get(terapeutaId)
      if (session) session.connected = false
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
      if (shouldReconnect) {
        setTimeout(() => createSession(terapeutaId), 3000)
      } else {
        sessions.delete(terapeutaId)
      }
    }
  })

  socket.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) {
      if (!msg.key.fromMe && msg.message) {
        await handleIncomingMessage(terapeutaId, msg)
      }
    }
  })
}

export async function disconnectSession(terapeutaId: string) {
  const session = sessions.get(terapeutaId)
  if (session?.socket) {
    await session.socket.logout()
    sessions.delete(terapeutaId)
    pendingQRs.delete(terapeutaId)
  }
}

export async function sendMessage(terapeutaId: string, to: string, text: string) {
  const session = sessions.get(terapeutaId)
  if (!session?.socket || !session.connected) return
  const jid = to.replace(/\D/g, '') + '@s.whatsapp.net'
  await session.socket.sendMessage(jid, { text })
}
