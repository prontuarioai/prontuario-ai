import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '../lib/supabase'
import { handleFlow } from './flowExecutor'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type Categoria = 'crise' | 'recaida' | 'progresso' | 'cotidiano' | 'outro'

async function categorizarMensagem(texto: string): Promise<{ categoria: Categoria; intensidade: number }> {
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `Classifique esta mensagem de paciente para o terapeuta.

Mensagem: "${texto}"

Responda APENAS com JSON no formato:
{"categoria": "crise|recaida|progresso|cotidiano|outro", "intensidade": 1-10}

- crise: risco imediato, automutilação, pensamentos suicidas
- recaida: retorno de sintomas, recaída em comportamentos problemáticos
- progresso: melhora, conquistas, insights positivos
- cotidiano: relatos do dia a dia sem urgência
- outro: não se encaixa nas categorias acima
- intensidade: 1 (neutro) a 10 (extremamente intenso)`
      }],
    })
    const content = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
    const parsed = JSON.parse(content)
    return {
      categoria: parsed.categoria ?? 'outro',
      intensidade: Math.max(1, Math.min(10, parseInt(parsed.intensidade) || 5)),
    }
  } catch {
    return { categoria: 'outro', intensidade: 5 }
  }
}

// Mensagem recebida no WhatsApp do profissional → salvar no prontuário
async function handleProfissionalMessage(terapeutaId: string, msg: any) {
  const supabase = createClient()
  const from = msg.key.remoteJid?.replace('@s.whatsapp.net', '') ?? ''
  const text = msg.message?.conversation ?? msg.message?.extendedTextMessage?.text ?? ''

  if (!text || !from) return

  const { data: paciente } = await supabase
    .from('pacientes')
    .select('id, nome')
    .eq('terapeuta_id', terapeutaId)
    .eq('whatsapp', from)
    .single()

  if (!paciente) return

  const { categoria, intensidade } = await categorizarMensagem(text)

  await supabase.from('eventos_entre_sessoes').insert({
    terapeuta_id: terapeutaId,
    paciente_id: paciente.id,
    mensagem: text,
    categoria,
    intensidade_emocional: intensidade,
    direcao: 'entrada',
  })

  const isCrise = categoria === 'crise'
  await supabase.from('notificacoes').insert({
    terapeuta_id: terapeutaId,
    paciente_id: paciente.id,
    mensagem: isCrise
      ? `⚠️ CRISE — ${paciente.nome}: "${text.substring(0, 100)}${text.length > 100 ? '…' : ''}"`
      : `💬 ${paciente.nome}: "${text.substring(0, 80)}${text.length > 80 ? '…' : ''}"`,
    tipo: isCrise ? 'alerta' : 'info',
  })
}

// Mensagem recebida no WhatsApp da secretária → salvar no prontuário + notificar
async function handleSecretariaMessage(clinicaId: string, msg: any) {
  const supabase = createClient()
  const from = msg.key.remoteJid?.replace('@s.whatsapp.net', '') ?? ''
  const text = msg.message?.conversation ?? msg.message?.extendedTextMessage?.text ?? ''

  if (!text || !from) return

  // Identificar paciente pelo WhatsApp
  const { data: paciente } = await supabase
    .from('pacientes')
    .select('id, nome, profissional_id, terapeuta_id')
    .eq('clinica_id', clinicaId)
    .eq('whatsapp', from)
    .maybeSingle()

  // Salvar mensagem no prontuário (fonte='secretaria') se paciente encontrado
  if (paciente?.id) {
    const terapeutaRef = paciente.profissional_id ?? paciente.terapeuta_id
    await supabase.from('eventos_entre_sessoes').insert({
      terapeuta_id: terapeutaRef,
      paciente_id: paciente.id,
      clinica_id: clinicaId,
      mensagem: text,
      categoria: 'cotidiano',
      intensidade_emocional: 1,
      direcao: 'entrada',
      fonte: 'secretaria',
    })
  }

  // Notificar admin/secretárias da clínica
  const { data: membros } = await supabase
    .from('terapeutas')
    .select('id')
    .eq('clinica_id', clinicaId)
    .in('role', ['admin', 'secretaria'])

  const nomePaciente = paciente?.nome ?? `+${from}`
  const mensagem = `📱 [Secretária] ${nomePaciente}: "${text.substring(0, 80)}${text.length > 80 ? '…' : ''}"`

  for (const membro of membros ?? []) {
    await supabase.from('notificacoes').insert({
      terapeuta_id: membro.id,
      paciente_id: paciente?.id ?? null,
      mensagem,
      tipo: 'info',
    })
  }
}

export async function handleIncomingMessage(
  sessionId: string,
  sessionType: 'profissional' | 'secretaria',
  msg: any,
  parsed?: { phone: string; pushName: string; content: string; mediaType: string; mediaUrl?: string }
) {
  const supabase = createClient()
  const phone = parsed?.phone ?? (msg.key.remoteJid?.replace('@s.whatsapp.net', '') ?? '')
  const content = parsed?.content ?? (msg.message?.conversation ?? msg.message?.extendedTextMessage?.text ?? '')

  if (!phone || !content) return

  // Identifica a clínica
  let clinicaId: string | null = null
  let terapeutaId: string | null = null

  if (sessionType === 'secretaria') {
    // Support both legacy ':secretaria' suffix and new 'sec-' prefix
    clinicaId = sessionId.startsWith('sec-')
      ? sessionId.slice(4)
      : sessionId.replace(':secretaria', '')
  } else {
    terapeutaId = sessionId
    const { data: t } = await supabase.from('terapeutas').select('clinica_id').eq('id', sessionId).single()
    clinicaId = t?.clinica_id ?? null
  }

  if (!clinicaId) return

  // Tenta processar via fluxo — se tratado, não executa lógica clínica
  const handledByFlow = await handleFlow({
    sessionId,
    sessionType,
    phone,
    content,
    clinicaId,
    terapeutaId,
  }).catch((err) => { console.error('[flow] error:', err.message); return false })

  if (handledByFlow) return

  // Lógica clínica original (categorização IA + notificações)
  if (sessionType === 'profissional') {
    await handleProfissionalMessage(sessionId, msg)
  } else {
    await handleSecretariaMessage(clinicaId, msg)
  }
}

// ── Evolution API webhook entry point ─────────────────────────────────────
export async function handleEvolutionWebhook(sessionId: string, payload: unknown): Promise<void> {
  const p = payload as Record<string, unknown>
  const event: string = (p?.event as string) || ''

  if (event !== 'messages.upsert' && event !== 'send.message') return

  const rawData = p?.data ?? p
  const dataItems: unknown[] = Array.isArray(rawData) ? rawData : [rawData]

  for (const item of dataItems) {
    const data = item as Record<string, unknown>
    const key = (data?.key ?? {}) as Record<string, unknown>
    const message = (data?.message ?? {}) as Record<string, unknown>

    const remoteJid: string = (key?.remoteJid as string) || ''
    if (!remoteJid || remoteJid.includes('@g.us')) continue
    if (key?.fromMe) continue

    const phone = remoteJid.endsWith('@s.whatsapp.net')
      ? remoteJid.replace('@s.whatsapp.net', '')
      : remoteJid

    const content: string =
      (message?.conversation as string) ||
      ((message?.extendedTextMessage as Record<string, string> | undefined)?.text ?? '') ||
      ((message?.imageMessage as Record<string, string> | undefined)?.caption ?? '') ||
      ''

    if (!content.trim()) continue

    const pushName: string = (data?.pushName as string) || ''
    const sessionType: 'profissional' | 'secretaria' = sessionId.startsWith('sec-')
      ? 'secretaria'
      : 'profissional'

    // Construct a minimal msg object compatible with handleIncomingMessage
    const msg = { key: { remoteJid, fromMe: false }, message, pushName }

    await handleIncomingMessage(sessionId, sessionType, msg, {
      phone,
      pushName,
      content,
      mediaType: 'text',
    }).catch((err) => console.error('[evolution] handleIncomingMessage error:', err.message))
  }
}
