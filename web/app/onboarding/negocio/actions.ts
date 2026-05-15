'use server'

import { createClient } from '@/lib/supabase/server'

export async function salvarLocalNegocioAction(placeId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado.' }

  const { error } = await supabase
    .from('terapeutas')
    .update({ google_place_id: placeId })
    .eq('id', user.id)

  if (error) return { error: 'Erro ao salvar.' }
  return { ok: true }
}
