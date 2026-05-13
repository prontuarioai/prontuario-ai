import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('nome, email, stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!terapeuta) return NextResponse.json({ error: 'Terapeuta não encontrado.' }, { status: 404 })

  const { data: pacientes } = await supabase
    .from('pacientes')
    .select('id', { count: 'exact', head: false })
    .eq('terapeuta_id', user.id)
    .eq('ativo', true)

  const qtdPacientes = pacientes?.length ?? 0

  let customerId = terapeuta.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: terapeuta.nome,
      email: terapeuta.email,
      metadata: { terapeuta_id: user.id },
    })
    customerId = customer.id
    await supabase.from('terapeutas').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      { price: process.env.STRIPE_PRICE_ID_BASE!, quantity: 1 },
      { price: process.env.STRIPE_PRICE_ID_PACIENTE!, quantity: Math.max(qtdPacientes, 1) },
    ],
    success_url: `${appUrl}/configuracoes?checkout=success`,
    cancel_url: `${appUrl}/configuracoes`,
    subscription_data: { metadata: { terapeuta_id: user.id } },
  })

  return NextResponse.json({ url: session.url })
}
