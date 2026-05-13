import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const maxDuration = 60

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { data: sessao } = await supabase
    .from('sessoes')
    .select('id, terapeuta_id')
    .eq('id', params.id)
    .eq('terapeuta_id', user.id)
    .single()

  if (!sessao) return NextResponse.json({ error: 'Sessão não encontrada.' }, { status: 404 })

  const formData = await request.formData()
  const file = formData.get('audio') as File | null
  if (!file) return NextResponse.json({ error: 'Arquivo não enviado.' }, { status: 400 })

  const MAX_SIZE = 200 * 1024 * 1024
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Arquivo muito grande (máx 200MB).' }, { status: 413 })

  const ext = file.name.split('.').pop()?.toLowerCase()
  const allowed = ['mp3', 'mp4', 'm4a', 'wav', 'ogg', 'webm']
  if (!ext || !allowed.includes(ext)) {
    return NextResponse.json({ error: 'Formato não suportado.' }, { status: 400 })
  }

  const path = `${user.id}/${params.id}.${ext}`
  const buffer = await file.arrayBuffer()

  const service = createServiceClient()
  const { error: uploadError } = await service.storage
    .from('audios')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) return NextResponse.json({ error: 'Erro ao fazer upload.' }, { status: 500 })

  await supabase.from('sessoes').update({ status: 'realizada' }).eq('id', params.id)
  await service.from('transcricoes').upsert({
    sessao_id: params.id,
    terapeuta_id: user.id,
    audio_url: path,
    status: 'pendente',
  }, { onConflict: 'sessao_id' })

  return NextResponse.json({ ok: true, path })
}
