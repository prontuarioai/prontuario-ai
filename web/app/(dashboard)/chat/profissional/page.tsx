import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatProfissionalClient from './ChatProfissionalClient'

export default async function ChatProfissionalPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('id, clinica_id, role')
    .eq('id', user.id)
    .single()

  // Secretária não tem acesso ao chat do profissional
  if (terapeuta?.role === 'secretaria') redirect('/chat/equipe')

  // Busca todas as conversas do profissional com pacientes (via WhatsApp do profissional)
  // Agrupa por paciente, trazendo última mensagem de cada um
  const { data: eventos } = await supabase
    .from('eventos_entre_sessoes')
    .select('id, mensagem, direcao, categoria, intensidade_emocional, created_at, lido, pacientes(id, nome, whatsapp)')
    .eq('terapeuta_id', user.id)
    .or('fonte.eq.profissional,fonte.is.null') // compatibilidade com registros antigos (sem fonte)
    .order('created_at', { ascending: false })
    .limit(500)

  // Agrupa por paciente
  const porPaciente = new Map<string, {
    pacienteId: string
    pacienteNome: string
    whatsapp: string | null
    ultimaMensagem: string
    ultimaData: string
    naoLidos: number
  }>()

  for (const ev of eventos ?? []) {
    const pac = (ev as any).pacientes
    if (!pac) continue
    const existente = porPaciente.get(pac.id)
    if (!existente) {
      porPaciente.set(pac.id, {
        pacienteId: pac.id,
        pacienteNome: pac.nome,
        whatsapp: pac.whatsapp ?? null,
        ultimaMensagem: ev.mensagem,
        ultimaData: ev.created_at,
        naoLidos: ev.lido === false && ev.direcao === 'entrada' ? 1 : 0,
      })
    } else {
      if (!ev.lido && ev.direcao === 'entrada') existente.naoLidos++
    }
  }

  const conversas = Array.from(porPaciente.values())
    .sort((a, b) => new Date(b.ultimaData).getTime() - new Date(a.ultimaData).getTime())

  return <ChatProfissionalClient conversas={conversas} usuarioId={user.id} />
}
