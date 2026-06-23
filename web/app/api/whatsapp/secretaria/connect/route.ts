import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('clinica_id, role')
    .eq('id', user.id)
    .single()

  if (!terapeuta?.clinica_id || terapeuta.role !== 'admin')
    return NextResponse.json({ error: 'Apenas admins podem configurar o WhatsApp da secretária.' }, { status: 403 })

  const apiUrl = process.env.API_URL
  const apiSecret = process.env.API_SECRET
  if (!apiUrl || !apiSecret) return NextResponse.json({ error: 'Configuração ausente.' }, { status: 500 })

  const res = await fetch(`${apiUrl}/whatsapp/secretaria/connect/${terapeuta.clinica_id}`, {
    method: 'POST',
    headers: { 'x-api-secret': apiSecret },
  }).catch(() => null)

  if (!res?.ok) return NextResponse.json({ error: 'Falha ao iniciar sessão.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
