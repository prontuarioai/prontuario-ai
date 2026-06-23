const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''

function headers() {
  return { 'Content-Type': 'application/json', apikey: EVOLUTION_API_KEY }
}

export interface EvolutionMessage {
  key: { fromMe: boolean; remoteJid: string; id?: string }
  message: {
    conversation?: string
    extendedTextMessage?: { text: string }
    imageMessage?: { caption?: string }
    audioMessage?: object
  }
  messageTimestamp: number
  messageType: string
  pushName?: string
  status?: string
}

export interface EvolutionChat {
  remoteJid: string
  pushName: string | null
  updatedAt: string
}

// sessionId → Evolution instance name (prontuario-{sessionId})
export function sessionToInstance(sessionId: string): string {
  return `prontuario-${sessionId}`
}

export async function setWebhook(instanceName: string, webhookUrl: string) {
  const res = await fetch(`${EVOLUTION_API_URL}/webhook/set/${instanceName}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      webhook: {
        enabled: true,
        url: webhookUrl,
        byEvents: false,
        base64: false,
        events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'SEND_MESSAGE'],
      },
    }),
  })
  if (!res.ok) {
    console.warn(`[evolution] setWebhook failed for ${instanceName}: ${res.statusText}`)
  }
}

export async function createEvolutionInstance(sessionId: string): Promise<void> {
  const instanceName = sessionToInstance(sessionId)
  const isSecretaria = sessionId.startsWith('sec-')
  const id = isSecretaria ? sessionId.slice(4) : sessionId
  const webhookUrl = `${process.env.API_URL || ''}/whatsapp/webhook/${isSecretaria ? `sec-${id}` : id}`

  const res = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      instanceName,
      token: EVOLUTION_API_KEY,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    // 409 = instance already exists — set webhook and continue
    if (res.status !== 409) throw new Error(`Evolution create error: ${text}`)
  }

  await setWebhook(instanceName, webhookUrl)
}

export async function getQRCode(instanceName: string): Promise<string | null> {
  const res = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
    headers: headers(),
  })
  if (!res.ok) return null
  const data = await res.json() as { base64?: string; qrcode?: { base64?: string } }
  return data?.base64 || data?.qrcode?.base64 || null
}

export async function sendTextMessage(
  instanceName: string,
  phone: string,
  text: string,
): Promise<{ waMessageId: string | null }> {
  const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ number: phone, text }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText)
    throw new Error(`Evolution sendText error: ${body}`)
  }
  const result = await res.json() as { key?: { id?: string } }
  return { waMessageId: result?.key?.id || null }
}

export async function sendPresence(instanceName: string, phone: string, ms: number): Promise<void> {
  await fetch(`${EVOLUTION_API_URL}/chat/sendPresence/${instanceName}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ number: phone, options: { delay: Math.min(ms, 800), presence: 'composing' } }),
  }).catch(() => {})
}

export async function getConnectionState(instanceName: string): Promise<string> {
  const res = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
    headers: headers(),
  })
  if (!res.ok) return 'close'
  const data = await res.json() as { instance?: { state?: string } }
  return data.instance?.state || 'close'
}

export async function logoutInstance(instanceName: string): Promise<void> {
  await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
    method: 'DELETE',
    headers: headers(),
  }).catch(console.error)
}
