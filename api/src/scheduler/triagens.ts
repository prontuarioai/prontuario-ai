import { createClient } from '../lib/supabase'
import { sendMessage } from '../whatsapp/manager'
import { addHours, startOfDay, endOfDay } from 'date-fns'

export async function enviarTriagens() {
  const supabase = createClient()
  const amanha = addHours(startOfDay(new Date()), 24)
  const appUrl = process.env.APP_URL ?? ''

  const { data: triagens } = await supabase
    .from('triagens')
    .select('id, token, sessao_id, terapeuta_id, pacientes(nome, whatsapp), sessoes(inicio)')
    .is('enviada_em', null)
    .is('respondida_em', null)

  for (const triagem of triagens ?? []) {
    const paciente = (triagem as any).pacientes
    const sessao = (triagem as any).sessoes
    if (!paciente?.whatsapp || !sessao?.inicio) continue

    const inicio = new Date(sessao.inicio)
    if (inicio < amanha || inicio > addHours(amanha, 24)) continue

    const hora = inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const link = `${appUrl}/triagem/${triagem.token}`
    const msg = `Olá, ${paciente.nome}! 🌿\n\nSua sessão é *amanhã às ${hora}*.\n\nAntes da sessão, responda essa breve triagem (2 minutinhos):\n${link}\n\nIsso ajuda seu terapeuta a se preparar melhor para você. 💙`

    await sendMessage(triagem.terapeuta_id, paciente.whatsapp, msg)
    await supabase.from('triagens').update({ enviada_em: new Date().toISOString() }).eq('id', triagem.id)
  }
}
