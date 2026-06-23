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
    supabase.from('pacientes').select('nome, whatsapp').eq('id', avaliacao.paciente_id).single(),
    supabase.from('terapeutas').select('whatsapp_number, google_place_id, nome').eq('id', avaliacao.terapeuta_id).single(),
  ])

  const estrelas = '⭐'.repeat(nota)

  // Notificação interna para o terapeuta
  await supabase.from('notificacoes').insert({
    terapeuta_id: avaliacao.terapeuta_id,
    paciente_id: avaliacao.paciente_id,
    sessao_id: avaliacao.sessao_id,
    mensagem: `${paciente?.nome} avaliou a sessão: ${estrelas} (${nota}/5)${comentario ? ` — "${comentario}"` : ''}`,
    tipo: nota >= 4 ? 'sucesso' : 'info',
  })

  // Notificar terapeuta via WhatsApp
  if (terapeuta?.whatsapp_number) {
    const msg = `${estrelas} Nova avaliação!\n\nPaciente: ${paciente?.nome}\nNota: ${nota}/5${comentario ? `\n"${comentario}"` : ''}`
    await sendWhatsApp(avaliacao.terapeuta_id, terapeuta.whatsapp_number, msg)
  }

  // 5 estrelas → pedir avaliação no Google
  if (nota === 5 && paciente?.whatsapp) {
    const profissionalNome = terapeuta?.nome ?? 'nosso profissional'
    const placeId = terapeuta?.google_place_id

    let googleMsg: string

    if (placeId) {
      const reviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`
      googleMsg = `Ficamos felizes que tenha gostado do nosso atendimento. 😊\n\nCaso queira, clique no link abaixo e nos ajude a divulgar nosso trabalho para mais pessoas:\n\n${reviewUrl}`
    } else {
      googleMsg = `Ficamos felizes que tenha gostado do nosso atendimento. 😊\n\nCaso queira, pesquise por "${profissionalNome}" no Google Maps e deixe uma avaliação — isso nos ajuda a divulgar nosso trabalho para mais pessoas. 🙏`
    }

    // Envia pelo WhatsApp da secretária (ou do profissional como fallback)
    const clinicaId = await getClinicaId(avaliacao.terapeuta_id, supabase)

    if (clinicaId) {
      await sendViaSecretaria(clinicaId, avaliacao.terapeuta_id, paciente.whatsapp, googleMsg)
    } else {
      await sendWhatsApp(avaliacao.terapeuta_id, paciente.whatsapp, googleMsg)
    }
  }
}

async function getClinicaId(
  terapeutaId: string,
  supabase: ReturnType<typeof createServiceClient>
): Promise<string | null> {
  const { data } = await supabase
    .from('terapeutas')
    .select('clinica_id')
    .eq('id', terapeutaId)
    .single()
  return data?.clinica_id ?? null
}

async function sendViaSecretaria(
  clinicaId: string,
  fallbackTerapeutaId: string,
  to: string,
  text: string
) {
  const apiUrl = process.env.API_URL
  const apiSecret = process.env.API_SECRET
  if (!apiUrl || !apiSecret) return

  await fetch(`${apiUrl}/whatsapp/send-via-secretaria`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-secret': apiSecret },
    body: JSON.stringify({ clinicaId, fallbackTerapeutaId, to, text }),
  }).catch(console.error)
}
