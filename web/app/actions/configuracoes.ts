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

export async function criarPerfilAction(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado.' }

  const nome = (formData.get('nome') as string)?.trim() || ''
  const crp = (formData.get('crp') as string)?.trim() || ''

  if (nome.length < 2) return { error: 'Nome deve ter pelo menos 2 caracteres.' }

  const baseSlug = nome.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'terapeuta'
  const slug = `${baseSlug}-${user.id.substring(0, 6)}`

  const { error } = await supabase.from('terapeutas').upsert(
    { id: user.id, nome, email: user.email!, slug, crp: crp || null },
    { onConflict: 'id' }
  )

  if (error) return { error: 'Erro ao criar perfil. Tente novamente.' }

  revalidatePath('/dashboard')
  return { ok: true }
}

export async function salvarMensagensAutomaticasAction(formData: FormData) {
  'use server'
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado.' }

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('clinica_id, role')
    .eq('id', user.id)
    .single()

  if (terapeuta?.role !== 'admin') return { error: 'Apenas o administrador pode alterar as mensagens.' }
  if (!terapeuta?.clinica_id) return { error: 'Clínica não encontrada.' }

  const mensagemAniversario = (formData.get('mensagem_aniversario') as string)?.trim()
  const hora = (formData.get('hora_mensagens_automaticas') as string)?.trim() || '08:00'

  const { error } = await supabase
    .from('clinicas')
    .update({ mensagem_aniversario: mensagemAniversario, hora_mensagens_automaticas: hora })
    .eq('id', terapeuta.clinica_id)

  if (error) return { error: 'Erro ao salvar.' }

  revalidatePath('/configuracoes')
  return { ok: true }
}

export async function salvarAcessoAction(formData: FormData) {
  'use server'
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado.' }

  const { data: terapeuta } = await supabase
    .from('terapeutas').select('clinica_id, role').eq('id', user.id).single()

  if (terapeuta?.role !== 'admin') return { error: 'Apenas o administrador pode alterar permissões.' }
  if (!terapeuta?.clinica_id) return { error: 'Clínica não encontrada.' }

  const equipeAcessaProntuario = formData.get('equipe_acessa_prontuario') === 'on'

  const { error } = await supabase
    .from('clinicas')
    .update({ equipe_acessa_prontuario: equipeAcessaProntuario })
    .eq('id', terapeuta.clinica_id)

  if (error) return { error: 'Erro ao salvar.' }

  revalidatePath('/configuracoes')
  return { ok: true }
}
