'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const PerfilSchema = z.object({
  nome: z.string().min(2),
  crp: z.string().optional().or(z.literal('')),
  bio: z.string().optional().or(z.literal('')),
  whatsapp_number: z.string().optional().or(z.literal('')),
  google_place_id: z.string().optional().or(z.literal('')),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífens'),
})

export async function atualizarPerfilAction(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado.' }

  const parsed = PerfilSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { slug } = parsed.data
  const { data: existe } = await supabase
    .from('terapeutas').select('id').eq('slug', slug).neq('id', user.id).maybeSingle()
  if (existe) return { error: 'Este slug já está em uso.' }

  const { error } = await supabase
    .from('terapeutas')
    .update(parsed.data)
    .eq('id', user.id)

  if (error) return { error: 'Erro ao salvar.' }

  revalidatePath('/configuracoes')
  return { ok: true }
}
