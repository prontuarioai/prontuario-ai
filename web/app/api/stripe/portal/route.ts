import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPortalSession } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!terapeuta?.stripe_customer_id) {
    return NextResponse.json({ error: 'Sem assinatura ativa.' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://agendaonlineai.com.br'
  const url = await createPortalSession(terapeuta.stripe_customer_id, `${appUrl}/configuracoes`)
  return NextResponse.json({ url })
}
