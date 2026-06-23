'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function enviarMensagemInternaAction(mensagem: string) {
  if (!mensagem.trim()) return { error: 'Mensagem vazia.' }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado.' }

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('clinica_id, nome')
    .eq('id', user.id)
    .single()

  if (!terapeuta?.clinica_id) return { error: 'Você não está vinculado a uma clínica.' }

  const { error } = await supabase.from('chat_interno').insert({
    clinica_id: terapeuta.clinica_id,
    remetente_id: user.id,
    remetente_nome: terapeuta.nome,
    mensagem: mensagem.trim(),
  })

  if (error) return { error: 'Erro ao enviar mensagem.' }

  revalidatePath('/chat/equipe')
  return { ok: true }
}
