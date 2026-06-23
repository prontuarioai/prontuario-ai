import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatEquipeClient from './ChatEquipeClient'

export default async function ChatEquipePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('id, clinica_id, role, nome')
    .eq('id', user.id)
    .single()

  const clinicaId = terapeuta?.clinica_id
  const role = terapeuta?.role ?? 'admin'
  const nomeUsuario = terapeuta?.nome ?? ''

  // Conversas via WhatsApp da secretária (fonte='secretaria')
  const { data: eventosSecretaria } = await supabase
    .from('eventos_entre_sessoes')
    .select('id, mensagem, direcao, categoria, created_at, lido, pacientes(id, nome, whatsapp)')
    .eq('clinica_id', clinicaId ?? '')
    .eq('fonte', 'secretaria')
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

  for (const ev of eventosSecretaria ?? []) {
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
        naoLidos: !ev.lido && ev.direcao === 'entrada' ? 1 : 0,
      })
    } else {
      if (!ev.lido && ev.direcao === 'entrada') existente.naoLidos++
    }
  }

  const conversasSecretaria = Array.from(porPaciente.values())
    .sort((a, b) => new Date(b.ultimaData).getTime() - new Date(a.ultimaData).getTime())

  return (
    <ChatEquipeClient
      conversasSecretaria={conversasSecretaria}
      role={role}
    />
  )
}
