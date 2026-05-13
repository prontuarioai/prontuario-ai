'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { criarEventoCalendar, deletarEventoCalendar } from '@/lib/google'

const SessaoSchema = z.object({
  paciente_id: z.string().uuid(),
  inicio: z.string(),
  fim: z.string(),
  modalidade: z.enum(['presencial', 'online']),
  valor: z.string().optional(),
  link_meet: z.string().optional().or(z.literal('')),
})

export async function agendarSessaoAction(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = SessaoSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Dados inválidos.' }

  const { paciente_id, inicio, fim, modalidade, valor, link_meet } = parsed.data

  const { data: sessao, error } = await supabase
    .from('sessoes')
    .insert({
      terapeuta_id: user.id,
      paciente_id,
      inicio,
      fim,
      modalidade,
      valor: valor ? parseFloat(valor) : null,
      link_meet: link_meet || null,
    })
    .select('id')
    .single()

  if (error) return { error: 'Erro ao agendar sessão.' }

  const [{ data: terapeuta }] = await Promise.all([
    supabase
      .from('terapeutas')
      .select('nome, google_refresh_token, google_calendar_id, google_calendar_connected')
      .eq('id', user.id)
      .single(),
    supabase.from('triagens').insert({
      sessao_id: sessao.id,
      terapeuta_id: user.id,
      paciente_id,
    }),
    supabase.from('avaliacoes_pos_sessao').insert({
      sessao_id: sessao.id,
      terapeuta_id: user.id,
      paciente_id,
    }),
  ])

  if (terapeuta?.google_calendar_connected && terapeuta.google_refresh_token && terapeuta.google_calendar_id) {
    const { data: paciente } = await supabase
      .from('pacientes')
      .select('nome')
      .eq('id', paciente_id)
      .single()

    criarEventoCalendar({
      refreshToken: terapeuta.google_refresh_token,
      calendarId: terapeuta.google_calendar_id,
      titulo: `Sessão — ${paciente?.nome ?? 'Paciente'}`,
      inicio,
      fim,
      linkMeet: link_meet || null,
    }).then(async eventId => {
      if (eventId) {
        await supabase
          .from('sessoes')
          .update({ google_event_id: eventId })
          .eq('id', sessao.id)
      }
    }).catch(console.error)
  }

  revalidatePath('/agenda')
  revalidatePath('/sessoes')
  revalidatePath('/dashboard')
  redirect(`/sessoes/${sessao.id}`)
}

export async function cancelarSessaoAction(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: sessao } = await supabase
    .from('sessoes')
    .update({ status: 'cancelada' })
    .eq('id', id)
    .eq('terapeuta_id', user.id)
    .select('google_event_id')
    .single()

  if (sessao?.google_event_id) {
    const { data: terapeuta } = await supabase
      .from('terapeutas')
      .select('google_refresh_token, google_calendar_id')
      .eq('id', user.id)
      .single()

    if (terapeuta?.google_refresh_token && terapeuta.google_calendar_id) {
      deletarEventoCalendar({
        refreshToken: terapeuta.google_refresh_token,
        calendarId: terapeuta.google_calendar_id,
        eventId: sessao.google_event_id,
      }).catch(console.error)
    }
  }

  revalidatePath('/agenda')
  revalidatePath('/sessoes')
  revalidatePath(`/sessoes/${id}`)
}

export async function salvarNotasAction(sessaoId: string, notas: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado.' }

  const { error } = await supabase
    .from('sessoes')
    .update({ notas })
    .eq('id', sessaoId)
    .eq('terapeuta_id', user.id)

  if (error) return { error: 'Erro ao salvar.' }
  revalidatePath(`/sessoes/${sessaoId}`)
  return { ok: true }
}

export async function agendarPublicoAction(formData: FormData) {
  const supabase = createClient()

  const slug = formData.get('slug') as string
  const paciente_id = formData.get('paciente_id') as string
  const inicio = formData.get('inicio') as string
  const fim = formData.get('fim') as string
  const modalidade = formData.get('modalidade') as 'presencial' | 'online'

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!terapeuta) return { error: 'Terapeuta não encontrado.' }

  const { data: sessao, error } = await supabase
    .from('sessoes')
    .insert({ terapeuta_id: terapeuta.id, paciente_id, inicio, fim, modalidade })
    .select('id')
    .single()

  if (error) return { error: 'Erro ao agendar.' }

  await Promise.all([
    supabase.from('triagens').insert({ sessao_id: sessao.id, terapeuta_id: terapeuta.id, paciente_id }),
    supabase.from('avaliacoes_pos_sessao').insert({ sessao_id: sessao.id, terapeuta_id: terapeuta.id, paciente_id }),
  ])

  return { ok: true }
}
