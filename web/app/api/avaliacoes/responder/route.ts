import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendWhatsApp } from '@/lib/whatsapp'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { token, nota, comentario } = body

  if (!token || !nota) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: avaliacao } = await supabase
    .from('avaliacoes_pos_sessao')
    .select('id, sessao_id, terapeuta_id, paciente_id, respondida_em')
    .eq('token', token)
    .single()

  if (!avaliacao) return NextResponse.json({ error: 'Token inválido.' }, { status: 404 })
  if (avaliacao.respondida_em) return NextResponse.json({ error: 'Já respondida.' }, { status: 409 })

  await supabase.from('avaliacoes_pos_sessao').update({
    nota,
    comentario: comentario || null,
    respondida_em: new Date().toISOString(),
  }).eq('id', avaliacao.id)

  notificarTerapeuta(avaliacao, nota, comentario, supabase).catch(console.error)

  return NextResponse.json({ ok: true })
}

async function notificarTerapeuta(
  avaliacao: { sessao_id: string; terapeuta_id: string; paciente_id: string },
  nota: number,
  comentario: string,
  supabase: ReturnType<typeof createServiceClient>
) {
  const [{ data: paciente }, { data: terapeuta }] = await Promise.all([
    supabase.from('pacientes').select('nome').eq('id', avaliacao.paciente_id).single(),
    supabase.from('terapeutas').select('whatsapp_number').eq('id', avaliacao.terapeuta_id).single(),
  ])

  const estrelas = '⭐'.repeat(nota)
  await supabase.from('notificacoes').insert({
    terapeuta_id: avaliacao.terapeuta_id,
    paciente_id: avaliacao.paciente_id,
    sessao_id: avaliacao.sessao_id,
    mensagem: `${paciente?.nome} avaliou a sessão: ${estrelas} (${nota}/5)${comentario ? ` — "${comentario}"` : ''}`,
    tipo: nota >= 4 ? 'sucesso' : 'info',
  })

  if (terapeuta?.whatsapp_number) {
    const msg = `${estrelas} Nova avaliação!\n\nPaciente: ${paciente?.nome}\nNota: ${nota}/5${comentario ? `\n"${comentario}"` : ''}`
    await sendWhatsApp(avaliacao.terapeuta_id, terapeuta.whatsapp_number, msg)
  }
}
