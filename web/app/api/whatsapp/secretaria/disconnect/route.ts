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
  if (!apiUrl || !apiSecret) return NextResponse.json({ ok: true })

  await fetch(`${apiUrl}/whatsapp/secretaria/disconnect/${terapeuta.clinica_id}`, {
    method: 'POST',
    headers: { 'x-api-secret': apiSecret },
  }).catch(() => null)

  return NextResponse.json({ ok: true })
}
