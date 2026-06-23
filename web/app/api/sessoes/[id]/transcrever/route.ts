import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { resumirSessao } from '@/lib/ai/claude'
import OpenAI from 'openai'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const service = createServiceClient()

  const { data: transcricao } = await service
    .from('transcricoes')
    .select('audio_url')
    .eq('sessao_id', params.id)
    .single()

  if (!transcricao?.audio_url) {
    return NextResponse.json({ error: 'Áudio não encontrado.' }, { status: 404 })
  }

  await service.from('transcricoes').update({ status: 'processando' }).eq('sessao_id', params.id)

  processarEmBackground(params.id, user.id, transcricao.audio_url, service).catch(console.error)

  return NextResponse.json({ ok: true, message: 'Transcrição iniciada.' })
}

async function processarEmBackground(
  sessaoId: string,
  terapeutaId: string,
  audioPath: string,
  service: ReturnType<typeof createServiceClient>
) {
  try {
    const { data: signedUrl } = await service.storage
      .from('audios')
      .createSignedUrl(audioPath, 3600)

    if (!signedUrl?.signedUrl) throw new Error('Sem URL assinada')

    const audioResponse = await fetch(signedUrl.signedUrl)
    const audioBuffer = await audioResponse.arrayBuffer()
    const ext = audioPath.split('.').pop() ?? 'mp3'
    const audioFile = new File([audioBuffer], `audio.${ext}`, { type: `audio/${ext}` })

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
    const result = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'pt',
    })

    const texto = result.text
    await service.from('transcricoes').update({ texto, status: 'concluido' }).eq('sessao_id', sessaoId)

    // Anonimiza nome do paciente antes de enviar para a IA (LGPD)
    const { data: sessaoInfo } = await service.from('sessoes').select('paciente_id').eq('id', sessaoId).single()
    let textoAnonimizado = texto
    if (sessaoInfo?.paciente_id) {
      const { data: pac } = await service.from('pacientes').select('nome').eq('id', sessaoInfo.paciente_id).single()
      if (pac?.nome) {
        const nomeEscapado = pac.nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        textoAnonimizado = texto.replace(new RegExp(nomeEscapado, 'gi'), '[PACIENTE]')
        const primeiroNome = pac.nome.split(' ')[0]
        if (primeiroNome.length > 2) {
          textoAnonimizado = textoAnonimizado.replace(new RegExp(primeiroNome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '[PACIENTE]')
        }
      }
    }

    const analise = await resumirSessao(textoAnonimizado)

    await service.from('resumos_ia').upsert({
      sessao_id: sessaoId,
      terapeuta_id: terapeutaId,
      principais_temas: analise.principais_temas,
      emocoes_detectadas: analise.emocoes_detectadas,
      pontos_trabalhados: analise.pontos_trabalhados,
      plano_proxima_sessao: analise.plano_proxima_sessao,
      alertas: analise.alertas,
      texto_completo: texto,
    }, { onConflict: 'sessao_id' })

    const { data: sessao } = await service
      .from('sessoes')
      .select('paciente_id')
      .eq('id', sessaoId)
      .single()

    if (sessao?.paciente_id) {
      await service.from('mapa_emocional').delete().match({ sessao_id: sessaoId })
      await service.from('mapa_emocional').insert({
        terapeuta_id: terapeutaId,
        paciente_id: sessao.paciente_id,
        sessao_id: sessaoId,
        valence: analise.valence,
        arousal: analise.arousal,
        emocoes: analise.emocoes_detectadas,
        fonte: 'sessao',
      })
    }

    if (analise.alertas?.length > 0) {
      await service.from('notificacoes').insert({
        terapeuta_id: terapeutaId,
        sessao_id: sessaoId,
        mensagem: `Alerta na sessão: ${analise.alertas[0]}`,
        tipo: 'alerta',
      })
    }
  } catch (err) {
    console.error('Erro na transcrição:', err)
    await service.from('transcricoes').update({ status: 'erro' }).eq('sessao_id', sessaoId)
  }
}
