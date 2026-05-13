import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { analisarTriagem } from '@/lib/ai/claude'
import { sendWhatsApp } from '@/lib/whatsapp'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { token, humor_geral, eventos_relevantes, foco_sessao } = body

  if (!token || humor_geral == null) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: triagem } = await supabase
    .from('triagens')
    .select('id, sessao_id, terapeuta_id, paciente_id, respondida_em')
    .eq('token', token)
    .single()

  if (!triagem) return NextResponse.json({ error: 'Token inválido.' }, { status: 404 })
  if (triagem.respondida_em) return NextResponse.json({ error: 'Já respondida.' }, { status: 409 })

  await supabase.from('triagens').update({
    humor_geral,
    eventos_relevantes,
    foco_sessao,
    respondida_em: new Date().toISOString(),
  }).eq('id', triagem.id)

  processarEmBackground(triagem, { humor_geral, eventos_relevantes, foco_sessao }, supabase).catch(console.error)

  return NextResponse.json({ ok: true })
}

async function processarEmBackground(
  triagem: { id: string; sessao_id: string; terapeuta_id: string; paciente_id: string },
  dados: { humor_geral: number; eventos_relevantes: string; foco_sessao: string },
  supabase: ReturnType<typeof createServiceClient>
) {
  const analise = await analisarTriagem(dados).catch(() => null)
  if (!analise) return

  await supabase.from('triagens').update({
    analise_ia: analise,
    risco_detectado: analise.risco,
    lida_terapeuta: false,
  }).eq('id', triagem.id)

  await supabase.from('mapa_emocional').delete().match({
    sessao_id: triagem.sessao_id,
    fonte: 'triagem',
  })
  await supabase.from('mapa_emocional').insert({
    terapeuta_id: triagem.terapeuta_id,
    paciente_id: triagem.paciente_id,
    sessao_id: triagem.sessao_id,
    valence: analise.valence,
    arousal: analise.arousal,
    emocoes: analise.emocoes,
    fonte: 'triagem',
  })

  const { data: paciente } = await supabase
    .from('pacientes')
    .select('nome')
    .eq('id', triagem.paciente_id)
    .single()

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('whatsapp_number')
    .eq('id', triagem.terapeuta_id)
    .single()

  await supabase.from('notificacoes').insert({
    terapeuta_id: triagem.terapeuta_id,
    paciente_id: triagem.paciente_id,
    sessao_id: triagem.sessao_id,
    mensagem: `${paciente?.nome} respondeu a triagem pré-sessão. Risco: ${analise.risco}.`,
    tipo: analise.risco === 'alto' ? 'alerta' : 'info',
  })

  if (terapeuta?.whatsapp_number) {
    const riscoEmoji = analise.risco === 'alto' ? '🔴' : analise.risco === 'medio' ? '🟡' : '🟢'
    const msg = `${riscoEmoji} Triagem respondida!\n\nPaciente: ${paciente?.nome}\nHumor: ${dados.humor_geral}/10\nRisco: ${analise.risco}\n\n${analise.observacoes}`
    await sendWhatsApp(triagem.terapeuta_id, terapeuta.whatsapp_number, msg)
  }
}
