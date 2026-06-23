'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { criarEventoCalendar, deletarEventoCalendar } from '@/lib/google'
import { criarPagamentoConsulta, getOuCriarCustomerPaciente } from '@/lib/asaas'

const SessaoSchema = z.object({
  paciente_id: z.string().uuid(),
  inicio: z.string(),
  fim: z.string(),
  modalidade: z.enum(['presencial', 'online']),
  valor: z.string().optional(),
  link_meet: z.string().optional().or(z.literal('')),
})

type SupabaseClient = ReturnType<typeof createClient>

function saveEvento(supabase: SupabaseClient, data: Record<string, unknown>) {
  ;(async () => { await supabase.from('eventos_entre_sessoes').insert(data) })().catch(console.error)
}

async function sendWpp(apiUrl: string, apiSecret: string, clinicaId: string | null, terapeutaId: string, to: string, text: string) {
  fetch(`${apiUrl}/whatsapp/send-via-secretaria`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-secret': apiSecret },
    body: JSON.stringify({ clinicaId, fallbackTerapeutaId: terapeutaId, to, text }),
  }).catch(console.error)
}

// Notifica admin e secretárias da clínica quando uma sessão é cancelada
async function notificarEquipeCancelamento(
  supabase: SupabaseClient,
  clinicaId: string,
  pacienteNome: string,
  terapeutaQueCancelou: string,
) {
  // Busca todos os membros admin e secretaria da clínica (exceto quem cancelou)
  const { data: membros } = await supabase
    .from('terapeutas')
    .select('id')
    .eq('clinica_id', clinicaId)
    .in('role', ['admin', 'secretaria'])
    .neq('id', terapeutaQueCancelou)

  if (!membros?.length) return

  const notificacoes = membros.map(m => ({
    terapeuta_id: m.id,
    mensagem: `📅 Sessão de *${pacienteNome}* foi cancelada. Entre em contato para reagendar.`,
    tipo: 'info',
  }))

  await supabase.from('notificacoes').insert(notificacoes)
}

export async function agendarSessaoAction(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = SessaoSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Dados inválidos.' }

  const { paciente_id, inicio, fim, modalidade, valor, link_meet } = parsed.data

  // Fetch terapeuta (clinica_id, nome, google)
  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('nome, clinica_id, google_refresh_token, google_calendar_id, google_calendar_connected')
    .eq('id', user.id)
    .single()

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
      clinica_id: terapeuta?.clinica_id ?? null,
    })
    .select('id')
    .single()

  if (error) return { error: 'Erro ao agendar sessão.' }

  await Promise.all([
    supabase.from('triagens').insert({
      sessao_id: sessao.id,
      terapeuta_id: user.id,
      paciente_id,
      clinica_id: terapeuta?.clinica_id ?? null,
    }),
    supabase.from('avaliacoes_pos_sessao').insert({
      sessao_id: sessao.id,
      terapeuta_id: user.id,
      paciente_id,
      clinica_id: terapeuta?.clinica_id ?? null,
    }),
  ])

  // Google Calendar (fire and forget)
  if (terapeuta?.google_calendar_connected && terapeuta.google_refresh_token && terapeuta.google_calendar_id) {
    const { data: pacienteGcal } = await supabase.from('pacientes').select('nome').eq('id', paciente_id).single()
    criarEventoCalendar({
      refreshToken: terapeuta.google_refresh_token,
      calendarId: terapeuta.google_calendar_id,
      titulo: `Sessão — ${pacienteGcal?.nome ?? 'Paciente'}`,
      inicio,
      fim,
      linkMeet: link_meet || null,
    }).then(async eventId => {
      if (eventId) await supabase.from('sessoes').update({ google_event_id: eventId }).eq('id', sessao.id)
    }).catch(console.error)
  }

  // WhatsApp de confirmação + link de pagamento (fire and forget)
  const apiUrl = process.env.API_URL
  const apiSecret = process.env.API_SECRET
  if (apiUrl && apiSecret) {
    const { data: paciente } = await supabase
      .from('pacientes')
      .select('id, nome, email, whatsapp, valor_consulta')
      .eq('id', paciente_id)
      .single()

    if (paciente?.whatsapp) {
      const dataFormatada = new Date(inicio).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
      const hora = new Date(inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

      // Gerar link de pagamento Asaas com o valor individual do paciente
      let paymentUrl: string | null = null
      const valorConsulta = paciente.valor_consulta ?? 0
      if (valorConsulta > 0) {
        try {
          const customerId = await getOuCriarCustomerPaciente({
            nome: paciente.nome,
            email: paciente.email,
            whatsapp: paciente.whatsapp,
            pacienteId: paciente.id,
          })
          const dueDate = new Date(inicio).toISOString().split('T')[0]
          const payment = await criarPagamentoConsulta({
            customerId,
            valor: valorConsulta,
            sessaoId: sessao.id,
            descricao: `Consulta com ${terapeuta?.nome} em ${dataFormatada}`,
            dueDate,
          })
          paymentUrl = payment.invoiceUrl
          // Salvar IDs do pagamento na sessão (fire and forget)
          void supabase.from('sessoes').update({
            asaas_payment_id: payment.id,
            asaas_payment_url: payment.invoiceUrl,
          }).eq('id', sessao.id)
        } catch (err) {
          console.error('Asaas payment creation error:', err)
        }
      }

      // Montar mensagem de confirmação
      let msg = `Olá, ${paciente.nome}! ✅\n\nSua sessão com *${terapeuta?.nome}* está confirmada!\n\n📅 ${dataFormatada}\n🕐 ${hora}\n📍 ${modalidade === 'online' ? 'Online' : 'Presencial'}`

      if (paymentUrl) {
        const valorStr = valorConsulta.toFixed(2).replace('.', ',')
        msg += `\n\n💳 *Pagamento da consulta:* R$ ${valorStr}\nRealize o pagamento com segurança via PIX, boleto ou cartão:\n${paymentUrl}`
      }

      msg += '\n\nAté lá! 🌱'

      sendWpp(apiUrl, apiSecret, terapeuta?.clinica_id ?? null, user.id, paciente.whatsapp, msg)
      saveEvento(supabase, {
        terapeuta_id: user.id,
        paciente_id,
        clinica_id: terapeuta?.clinica_id ?? null,
        mensagem: msg,
        direcao: 'saida',
        categoria: 'cotidiano',
        intensidade_emocional: 1,
        fonte: 'secretaria',
      })
    }
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
    .select('google_event_id, paciente_id')
    .single()

  // Google Calendar remove (fire and forget)
  if (sessao?.google_event_id) {
    const { data: terapeuta } = await supabase
      .from('terapeutas')
      .select('google_refresh_token, google_calendar_id, nome, slug, clinica_id')
      .eq('id', user.id)
      .single()

    if (terapeuta?.google_refresh_token && terapeuta.google_calendar_id) {
      deletarEventoCalendar({
        refreshToken: terapeuta.google_refresh_token,
        calendarId: terapeuta.google_calendar_id,
        eventId: sessao.google_event_id,
      }).catch(console.error)
    }

    // WhatsApp + notificação secretária ao cancelar (fire and forget)
    const apiUrl = process.env.API_URL
    const apiSecret = process.env.API_SECRET
    if (sessao.paciente_id) {
      const { data: paciente } = await supabase.from('pacientes').select('nome, whatsapp').eq('id', sessao.paciente_id).single()
      if (paciente) {
        // Mensagem ao paciente
        if (apiUrl && apiSecret && paciente.whatsapp) {
          const msg = `Olá, ${paciente.nome}! Nossa equipe em breve entrará em contato para reagendar sua consulta. 😊`
          sendWpp(apiUrl, apiSecret, terapeuta?.clinica_id ?? null, user.id, paciente.whatsapp, msg)
          saveEvento(supabase, { terapeuta_id: user.id, paciente_id: sessao.paciente_id, clinica_id: terapeuta?.clinica_id ?? null, mensagem: msg, direcao: 'saida', categoria: 'cotidiano', intensidade_emocional: 1 })
        }
        // Notificação para admin/secretária da clínica
        if (terapeuta?.clinica_id) {
          notificarEquipeCancelamento(supabase, terapeuta.clinica_id, paciente.nome, user.id).catch(console.error)
        }
      }
    }
  } else {
    // Sem google event — ainda tenta enviar
    const apiUrl = process.env.API_URL
    const apiSecret = process.env.API_SECRET
    if (sessao?.paciente_id) {
      const [{ data: terapeuta }, { data: paciente }] = await Promise.all([
        supabase.from('terapeutas').select('nome, slug, clinica_id').eq('id', user.id).single(),
        supabase.from('pacientes').select('nome, whatsapp').eq('id', sessao.paciente_id).single(),
      ])
      if (paciente) {
        if (apiUrl && apiSecret && paciente.whatsapp) {
          const msg = `Olá, ${paciente.nome}! Nossa equipe em breve entrará em contato para reagendar sua consulta. 😊`
          sendWpp(apiUrl, apiSecret, terapeuta?.clinica_id ?? null, user.id, paciente.whatsapp, msg)
          saveEvento(supabase, { terapeuta_id: user.id, paciente_id: sessao.paciente_id, clinica_id: terapeuta?.clinica_id ?? null, mensagem: msg, direcao: 'saida', categoria: 'cotidiano', intensidade_emocional: 1 })
        }
        if (terapeuta?.clinica_id) {
          notificarEquipeCancelamento(supabase, terapeuta.clinica_id, paciente.nome, user.id).catch(console.error)
        }
      }
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

export async function marcarRealizadaAction(sessaoId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado.' }

  const { error } = await supabase
    .from('sessoes')
    .update({ status: 'realizada' })
    .eq('id', sessaoId)
    .eq('terapeuta_id', user.id)

  if (error) return { error: 'Erro ao atualizar sessão.' }

  revalidatePath(`/sessoes/${sessaoId}`)
  revalidatePath('/sessoes')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function enviarTriagemAction(sessaoId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado.' }

  const { data: triagem } = await supabase
    .from('triagens')
    .select('id, token, paciente_id')
    .eq('sessao_id', sessaoId)
    .eq('terapeuta_id', user.id)
    .maybeSingle()

  if (!triagem) return { error: 'Triagem não encontrada.' }

  const [{ data: paciente }, { data: sessao }, { data: terapeuta }] = await Promise.all([
    supabase.from('pacientes').select('nome, whatsapp').eq('id', triagem.paciente_id).single(),
    supabase.from('sessoes').select('inicio').eq('id', sessaoId).single(),
    supabase.from('terapeutas').select('clinica_id').eq('id', user.id).single(),
  ])

  if (!paciente?.whatsapp) return { error: 'Paciente sem WhatsApp cadastrado.' }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const apiUrl = process.env.API_URL
  const apiSecret = process.env.API_SECRET
  if (!apiUrl || !apiSecret) return { error: 'Configuração de API ausente.' }

  const hora = sessao?.inicio
    ? new Date(sessao.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
    : ''
  const link = `${appUrl}/triagem/${triagem.token}`
  const msg = `Olá, ${paciente.nome}! 🌿\n\nSua sessão é *amanhã às ${hora}*.\n\nAntes da sessão, responda essa breve triagem (2 minutinhos):\n${link}\n\nIsso ajuda seu terapeuta a se preparar melhor para você. 💙`

  const res = await fetch(`${apiUrl}/whatsapp/send-via-secretaria`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-secret': apiSecret },
    body: JSON.stringify({ clinicaId: terapeuta?.clinica_id ?? null, fallbackTerapeutaId: user.id, to: paciente.whatsapp, text: msg }),
  }).catch(() => null)

  if (!res?.ok) return { error: 'Falha ao enviar mensagem. WhatsApp conectado?' }

  await supabase.from('triagens').update({ enviada_em: new Date().toISOString() }).eq('id', triagem.id)
  saveEvento(supabase, { terapeuta_id: user.id, paciente_id: triagem.paciente_id, clinica_id: terapeuta?.clinica_id ?? null, mensagem: msg, direcao: 'saida', categoria: 'cotidiano', intensidade_emocional: 1 })

  revalidatePath(`/sessoes/${sessaoId}`)
  return { ok: true }
}

export async function enviarAvaliacaoAction(sessaoId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado.' }

  const { data: avaliacao } = await supabase
    .from('avaliacoes_pos_sessao')
    .select('id, token, paciente_id')
    .eq('sessao_id', sessaoId)
    .eq('terapeuta_id', user.id)
    .maybeSingle()

  if (!avaliacao) return { error: 'Avaliação não encontrada.' }

  const [{ data: paciente }, { data: terapeuta }] = await Promise.all([
    supabase.from('pacientes').select('nome, whatsapp').eq('id', avaliacao.paciente_id).single(),
    supabase.from('terapeutas').select('nome, clinica_id').eq('id', user.id).single(),
  ])

  if (!paciente?.whatsapp) return { error: 'Paciente sem WhatsApp cadastrado.' }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const apiUrl = process.env.API_URL
  const apiSecret = process.env.API_SECRET
  if (!apiUrl || !apiSecret) return { error: 'Configuração de API ausente.' }

  const link = `${appUrl}/avaliacao/${avaliacao.token}`
  const msg = `Olá, ${paciente.nome}! 🌟\n\nComo foi a sessão de hoje com ${terapeuta?.nome}?\n\nAvalie rapidinho:\n${link}\n\nSua opinião é muito importante! 💙`

  const res = await fetch(`${apiUrl}/whatsapp/send-via-secretaria`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-secret': apiSecret },
    body: JSON.stringify({ clinicaId: terapeuta?.clinica_id ?? null, fallbackTerapeutaId: user.id, to: paciente.whatsapp, text: msg }),
  }).catch(() => null)

  if (!res?.ok) return { error: 'Falha ao enviar mensagem. WhatsApp conectado?' }

  saveEvento(supabase, { terapeuta_id: user.id, paciente_id: avaliacao.paciente_id, clinica_id: terapeuta?.clinica_id ?? null, mensagem: msg, direcao: 'saida', categoria: 'cotidiano', intensidade_emocional: 1 })

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
    .select('id, clinica_id')
    .eq('slug', slug)
    .single()

  if (!terapeuta) return { error: 'Terapeuta não encontrado.' }

  const { data: sessao, error } = await supabase
    .from('sessoes')
    .insert({ terapeuta_id: terapeuta.id, paciente_id, inicio, fim, modalidade, clinica_id: terapeuta.clinica_id })
    .select('id')
    .single()

  if (error) return { error: 'Erro ao agendar.' }

  await Promise.all([
    supabase.from('triagens').insert({ sessao_id: sessao.id, terapeuta_id: terapeuta.id, paciente_id, clinica_id: terapeuta.clinica_id }),
    supabase.from('avaliacoes_pos_sessao').insert({ sessao_id: sessao.id, terapeuta_id: terapeuta.id, paciente_id, clinica_id: terapeuta.clinica_id }),
  ])

  return { ok: true }
}
