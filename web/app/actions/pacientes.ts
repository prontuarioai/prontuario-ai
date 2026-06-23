'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Campos básicos de contato (formulário simplificado)
const ContatoSchema = z.object({
  nome:            z.string().min(2),
  email:           z.string().email().optional().or(z.literal('')),
  ddi:             z.string().optional().or(z.literal('')),
  ddd:             z.string().optional().or(z.literal('')),
  numero:          z.string().optional().or(z.literal('')),
  data_nascimento: z.string().optional().or(z.literal('')),
})

// Campos clínicos do prontuário (seção restrita)
const ProntuarioSchema = z.object({
  genero:             z.enum(['masculino', 'feminino', 'outro', 'prefiro_nao_informar']).optional().or(z.literal('')),
  queixa_principal:   z.string().optional().or(z.literal('')),
  historico_medico:   z.string().optional().or(z.literal('')),
  medicamentos:       z.string().optional().or(z.literal('')),
  contato_emergencia: z.string().optional().or(z.literal('')),
  valor_consulta:     z.coerce.number().min(0).optional(),
})

function montarWhatsapp(ddi?: string, ddd?: string, numero?: string): string | null {
  const d1 = (ddi ?? '55').replace(/\D/g, '') || '55'
  const d2 = (ddd ?? '').replace(/\D/g, '')
  const d3 = (numero ?? '').replace(/\D/g, '')
  if (!d3) return null
  return `${d1}${d2}${d3}`
}

export async function criarPacienteAction(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = ContatoSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Dados inválidos: ' + parsed.error.issues.map(i => i.message).join(', ') }

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('clinica_id, role')
    .eq('id', user.id)
    .single()

  // Secretária não pode criar paciente
  if (terapeuta?.role === 'secretaria') return { error: 'Sem permissão.' }

  const profissionalId = (formData.get('profissional_id') as string) || user.id
  const consentimento  = formData.get('consentimento_lgpd') === 'on'
  const whatsapp       = montarWhatsapp(parsed.data.ddi, parsed.data.ddd, parsed.data.numero)

  const { data, error } = await supabase
    .from('pacientes')
    .insert({
      nome:            parsed.data.nome,
      email:           parsed.data.email || null,
      whatsapp,
      data_nascimento: parsed.data.data_nascimento || null,
      terapeuta_id:    profissionalId,
      profissional_id: profissionalId,
      clinica_id:      terapeuta?.clinica_id ?? null,
      consentimento_lgpd: consentimento,
      lgpd_aceito_em:  consentimento ? new Date().toISOString() : null,
      ativo:           true,
    })
    .select('id')
    .single()

  if (error) return { error: `Erro ao criar paciente: ${error.message}` }

  revalidatePath('/pacientes')
  return { ok: true, id: data.id }
}

export async function atualizarPacienteAction(id: string, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verifica role
  const { data: terapeuta } = await supabase
    .from('terapeutas').select('role').eq('id', user.id).single()
  if (terapeuta?.role === 'secretaria') return { error: 'Sem permissão.' }

  const parsed = ContatoSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Dados inválidos.' }

  const consentimento  = formData.get('consentimento_lgpd') === 'on'
  const whatsapp       = montarWhatsapp(parsed.data.ddi, parsed.data.ddd, parsed.data.numero)

  const { data: current } = await supabase
    .from('pacientes').select('consentimento_lgpd, lgpd_aceito_em').eq('id', id).single()

  const payload: Record<string, unknown> = {
    nome:            parsed.data.nome,
    email:           parsed.data.email || null,
    data_nascimento: parsed.data.data_nascimento || null,
    consentimento_lgpd: consentimento,
  }
  if (whatsapp) payload.whatsapp = whatsapp
  if (consentimento && !current?.lgpd_aceito_em) payload.lgpd_aceito_em = new Date().toISOString()

  const { error } = await supabase.from('pacientes').update(payload).eq('id', id)
  if (error) return { error: `Erro ao atualizar: ${error.message}` }

  revalidatePath(`/pacientes/${id}`)
  revalidatePath('/pacientes')
  return { ok: true }
}

// Atualiza campos clínicos do prontuário — requer role admin ou profissional
export async function atualizarProntuarioAction(pacienteId: string, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado.' }

  const { data: terapeuta } = await supabase
    .from('terapeutas').select('role, clinica_id').eq('id', user.id).single()

  // Secretária não acessa prontuário
  if (terapeuta?.role === 'secretaria') return { error: 'Sem permissão.' }

  // Profissional: verifica se o paciente é seu
  if (terapeuta?.role === 'profissional') {
    const { data: pac } = await supabase
      .from('pacientes').select('profissional_id').eq('id', pacienteId).single()
    if (pac?.profissional_id !== user.id) return { error: 'Acesso negado a este paciente.' }
  }

  const parsed = ProntuarioSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Dados inválidos.' }

  const { error } = await supabase.from('pacientes').update({
    genero:             parsed.data.genero || null,
    queixa_principal:   parsed.data.queixa_principal || null,
    historico_medico:   parsed.data.historico_medico || null,
    medicamentos:       parsed.data.medicamentos || null,
    contato_emergencia: parsed.data.contato_emergencia || null,
    valor_consulta:     parsed.data.valor_consulta ?? 0,
  }).eq('id', pacienteId)

  if (error) return { error: `Erro ao salvar prontuário: ${error.message}` }

  revalidatePath(`/pacientes/${pacienteId}`)
  return { ok: true }
}

export async function arquivarPacienteAction(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: terapeuta } = await supabase
    .from('terapeutas').select('role').eq('id', user.id).single()
  if (terapeuta?.role === 'secretaria') return

  await supabase.from('pacientes').update({ ativo: false }).eq('id', id)
  revalidatePath('/pacientes')
  redirect('/pacientes')
}
