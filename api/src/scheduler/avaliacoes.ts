import { createClient } from '../lib/supabase'
import { sendMessage } from '../whatsapp/manager'
import { subMinutes } from 'date-fns'

export async function enviarAvaliacoes() {
  const supabase = createClient()
  const appUrl = process.env.APP_URL ?? ''
  const agora = new Date()
  const inicio = subMinutes(agora, 75).toISOString()
  const fim = subMinutes(agora, 55).toISOString()

  const { data: sessoes } = await supabase
    .from('sessoes')
    .select('id, terapeuta_id, pacientes(nome, whatsapp), terapeutas(nome)')
    .eq('status', 'realizada')
    .gte('fim', inicio)
    .lte('fim', fim)

  for (const sessao of sessoes ?? []) {
    const paciente = (sessao as any).pacientes
    const terapeuta = (sessao as any).terapeutas
    if (!paciente?.whatsapp) continue

    const { data: avaliacao } = await supabase
      .from('avaliacoes_pos_sessao')
      .select('token, respondida_em')
      .eq('sessao_id', sessao.id)
      .single()

    if (!avaliacao || avaliacao.respondida_em) continue

    const link = `${appUrl}/avaliacao/${avaliacao.token}`
    const msg = `Olá, ${paciente.nome}! 🌟\n\nComo foi a sessão de hoje com ${terapeuta?.nome}?\n\nAvalie rapidinho:\n${link}\n\nSua opinião é muito importante! 💙`

    await sendMessage(sessao.terapeuta_id, paciente.whatsapp, msg)
  }
}
