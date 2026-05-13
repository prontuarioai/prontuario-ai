'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const PacienteSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  whatsapp: z.string().optional().or(z.literal('')),
  data_nascimento: z.string().optional().or(z.literal('')),
  genero: z.enum(['masculino', 'feminino', 'outro', 'prefiro_nao_informar']).optional(),
  queixa_principal: z.string().optional().or(z.literal('')),
  historico_medico: z.string().optional().or(z.literal('')),
  medicamentos: z.string().optional().or(z.literal('')),
  contato_emergencia: z.string().optional().or(z.literal('')),
})

export async function criarPacienteAction(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = PacienteSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Dados inválidos.' }

  const { data, error } = await supabase
    .from('pacientes')
    .insert({ ...parsed.data, terapeuta_id: user.id })
    .select('id')
    .single()

  if (error) return { error: 'Erro ao criar paciente.' }

  revalidatePath('/pacientes')
  redirect(`/pacientes/${data.id}`)
}

export async function atualizarPacienteAction(id: string, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = PacienteSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Dados inválidos.' }

  const { error } = await supabase
    .from('pacientes')
    .update(parsed.data)
    .eq('id', id)
    .eq('terapeuta_id', user.id)

  if (error) return { error: 'Erro ao atualizar.' }

  revalidatePath(`/pacientes/${id}`)
  revalidatePath('/pacientes')
  return { ok: true }
}

export async function arquivarPacienteAction(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('pacientes')
    .update({ ativo: false })
    .eq('id', id)
    .eq('terapeuta_id', user.id)

  revalidatePath('/pacientes')
  redirect('/pacientes')
}
