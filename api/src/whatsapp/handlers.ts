import { proto } from '@whiskeysockets/baileys'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '../lib/supabase'

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

export async function handleIncomingMessage(terapeutaId: string, msg: proto.IWebMessageInfo) {
  const supabase = createClient()
  const from = msg.key.remoteJid?.replace('@s.whatsapp.net', '') ?? ''
  const text = msg.message?.conversation
    ?? msg.message?.extendedTextMessage?.text
    ?? ''

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
