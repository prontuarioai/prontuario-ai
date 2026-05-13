import { createClient } from '../lib/supabase'
import { sendMessage } from '../whatsapp/manager'
import { addHours, startOfDay, endOfDay } from 'date-fns'

export async function enviarLembretes() {
  const supabase = createClient()
  const amanha = addHours(startOfDay(new Date()), 24)

  const { data: sessoes } = await supabase
    .from('sessoes')
    .select('id, inicio, modalidade, terapeuta_id, pacientes(nome, whatsapp), terapeutas(nome, whatsapp_number)')
    .gte('inicio', startOfDay(amanha).toISOString())
    .lte('inicio', endOfDay(amanha).toISOString())
    .eq('status', 'agendada')

  for (const sessao of sessoes ?? []) {
    const paciente = (sessao as any).pacientes
    const terapeuta = (sessao as any).terapeutas
    if (!paciente?.whatsapp || !terapeuta?.whatsapp_number) continue

    const hora = new Date(sessao.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const msg = `Olá, ${paciente.nome}! 👋\n\nLembrando da sua sessão *amanhã às ${hora}* com ${terapeuta.nome}.\n\nModalidade: ${sessao.modalidade}\n\nAté lá! 🌱`

    await sendMessage(sessao.terapeuta_id, paciente.whatsapp, msg)
  }
}
