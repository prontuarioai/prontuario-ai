import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const Schema = z.object({
  terapeutaId: z.string().uuid(),
  nome: z.string().min(2),
  email: z.string().email(),
  whatsapp: z.string().optional().default(''),
  queixa: z.string().optional().default(''),
  inicio: z.string(),
  fim: z.string(),
  modalidade: z.enum(['presencial', 'online']).default('presencial'),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const { terapeutaId, nome, email, whatsapp, queixa, inicio, fim, modalidade } = parsed.data
  const supabase = createServiceClient()

  // Busca ou cria paciente por email
  let pacienteId: string
  const { data: existente } = await supabase
    .from('pacientes')
    .select('id')
    .eq('terapeuta_id', terapeutaId)
    .eq('email', email)
    .maybeSingle()

  if (existente) {
    pacienteId = existente.id
  } else {
    const { data: novo, error: errPac } = await supabase
      .from('pacientes')
      .insert({ terapeuta_id: terapeutaId, nome, email, whatsapp, queixa_principal: queixa })
      .select('id')
      .single()

    if (errPac || !novo) {
      return NextResponse.json({ error: 'Erro ao registrar dados.' }, { status: 500 })
    }
    pacienteId = novo.id
  }

  // Cria a sessão
  const { data: sessao, error: errSessao } = await supabase
    .from('sessoes')
    .insert({ terapeuta_id: terapeutaId, paciente_id: pacienteId, inicio, fim, modalidade })
    .select('id')
    .single()

  if (errSessao || !sessao) {
    return NextResponse.json({ error: 'Erro ao agendar.' }, { status: 500 })
  }

  // Cria triagem e avaliação
  await Promise.all([
    supabase.from('triagens').insert({ sessao_id: sessao.id, terapeuta_id: terapeutaId, paciente_id: pacienteId }),
    supabase.from('avaliacoes_pos_sessao').insert({ sessao_id: sessao.id, terapeuta_id: terapeutaId, paciente_id: pacienteId }),
  ])

  // Notifica terapeuta via WhatsApp em background
  supabase
    .from('terapeutas')
    .select('nome, whatsapp_number')
    .eq('id', terapeutaId)
    .single()
    .then(async ({ data: terapeuta }) => {
      if (!terapeuta?.whatsapp_number) return
      const hora = new Date(inicio).toLocaleString('pt-BR', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
      })
      const msg = `📅 Novo agendamento!\n\n*${nome}* solicitou uma sessão para ${hora}.\n\nAcesse o prontuário para confirmar.`
      await fetch(`${process.env.API_URL}/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-secret': process.env.API_SECRET ?? '' },
        body: JSON.stringify({ terapeutaId, to: terapeuta.whatsapp_number, text: msg }),
      })
    })
    .catch(console.error)

  return NextResponse.json({ ok: true })
}
