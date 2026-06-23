import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatInternoClient from './ChatInternoClient'

export default async function ChatInternoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('id, clinica_id, role, nome')
    .eq('id', user.id)
    .single()

  const clinicaId = terapeuta?.clinica_id

  const { data: mensagensInternas } = clinicaId
    ? await supabase
        .from('chat_interno')
        .select('id, mensagem, remetente_id, remetente_nome, created_at')
        .eq('clinica_id', clinicaId)
        .order('created_at', { ascending: true })
        .limit(200)
    : { data: [] }

  return (
    <ChatInternoClient
      mensagensInternas={mensagensInternas ?? []}
      usuarioId={user.id}
      nomeUsuario={terapeuta?.nome ?? ''}
      clinicaId={clinicaId ?? null}
    />
  )
}
