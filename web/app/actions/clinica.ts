'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function criarClinicaAction(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado.' }

  const nome = (formData.get('nome') as string)?.trim() || ''
  if (nome.length < 2) return { error: 'Nome da clínica muito curto.' }

  const { data: clinica, error: errClinica } = await supabase
    .from('clinicas')
    .insert({ nome, owner_id: user.id })
    .select('id')
    .single()

  if (errClinica || !clinica) return { error: 'Erro ao criar clínica.' }

  const { error: errUpdate } = await supabase
    .from('terapeutas')
    .update({ clinica_id: clinica.id, role: 'admin' })
    .eq('id', user.id)

  if (errUpdate) return { error: 'Erro ao vincular clínica.' }

  revalidatePath('/dashboard')
  return { ok: true }
}

export async function convidarMembroAction(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado.' }

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('clinica_id, role')
    .eq('id', user.id)
    .single()

  if (!terapeuta?.clinica_id || terapeuta.role !== 'admin')
    return { error: 'Apenas admins podem convidar membros.' }

  const email = (formData.get('email') as string)?.trim().toLowerCase() || null
  const nome  = (formData.get('nome')  as string)?.trim() || ''
  const role  = formData.get('role') as 'profissional' | 'secretaria'

  if (!role) return { error: 'Cargo é obrigatório.' }
  if (!['profissional', 'secretaria'].includes(role))
    return { error: 'Cargo inválido.' }

  // Verificar se já é membro (apenas se email fornecido)
  if (email) {
    const { data: existente } = await supabase
      .from('terapeutas')
      .select('id')
      .eq('email', email)
      .eq('clinica_id', terapeuta.clinica_id)
      .maybeSingle()

    if (existente) return { error: 'Este email já é membro da clínica.' }
  }

  const { data: convite, error } = await supabase
    .from('convites')
    .insert({ clinica_id: terapeuta.clinica_id, email: email || null, nome, role, criado_por: user.id })
    .select('token')
    .single()

  if (error || !convite) return { error: 'Erro ao criar convite.' }

  revalidatePath('/configuracoes')
  return { ok: true, token: convite.token }
}

export async function removerMembroAction(membroId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado.' }

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('clinica_id, role')
    .eq('id', user.id)
    .single()

  if (!terapeuta?.clinica_id || terapeuta.role !== 'admin')
    return { error: 'Apenas admins podem remover membros.' }

  if (membroId === user.id) return { error: 'Você não pode se remover.' }

  await supabase
    .from('terapeutas')
    .update({ clinica_id: null })
    .eq('id', membroId)
    .eq('clinica_id', terapeuta.clinica_id)

  revalidatePath('/configuracoes')
  return { ok: true }
}

export async function aceitarConviteAction(token: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Faça login para aceitar o convite.' }

  // Usar service client para ler convite sem RLS (usuário ainda não tem clinica_id)
  const service = createServiceClient()
  const { data: convite } = await service
    .from('convites')
    .select('*')
    .eq('token', token)
    .is('aceito_em', null)
    .single()

  if (!convite) return { error: 'Convite inválido ou já utilizado.' }

  // Verificar se o email confere (se o convite especificou um email)
  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('email, clinica_id')
    .eq('id', user.id)
    .single()

  if (!terapeuta) return { error: 'Perfil não encontrado.' }
  if (terapeuta.clinica_id) return { error: 'Você já pertence a uma clínica.' }

  if (convite.email && convite.email !== terapeuta.email)
    return { error: 'Este convite foi enviado para outro email.' }

  // Vincular usuário à clínica
  await service
    .from('terapeutas')
    .update({ clinica_id: convite.clinica_id, role: convite.role })
    .eq('id', user.id)

  await service
    .from('convites')
    .update({ aceito_em: new Date().toISOString() })
    .eq('id', convite.id)

  revalidatePath('/dashboard')
  return { ok: true }
}
