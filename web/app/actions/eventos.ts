'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function categorizarEventoAction(
  eventoId: string,
  dados: { categoria: string; intensidade_emocional: number }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('eventos_entre_sessoes')
    .update({ categoria: dados.categoria, intensidade_emocional: dados.intensidade_emocional })
    .eq('id', eventoId)
    .eq('terapeuta_id', user.id)

  revalidatePath('/eventos')
}

export async function marcarEventoLidoAction(eventoId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('eventos_entre_sessoes')
    .update({ lido: true })
    .eq('id', eventoId)
    .eq('terapeuta_id', user.id)

  revalidatePath('/eventos')
}

export async function marcarTodosLidosAction() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('eventos_entre_sessoes')
    .update({ lido: true })
    .eq('terapeuta_id', user.id)
    .eq('lido', false)

  revalidatePath('/eventos')
}
