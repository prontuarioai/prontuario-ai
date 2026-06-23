import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

type Modulo = 'agenda' | 'whatsapp' | 'social'

const PRICE_MAP: Record<Modulo, string | undefined> = {
  agenda: process.env.STRIPE_PRICE_ID_AGENDA,
  whatsapp: process.env.STRIPE_PRICE_ID_WHATSAPP,
  social: process.env.STRIPE_PRICE_ID_SOCIAL,
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const rawModulos: string[] = Array.isArray(body?.modulos) ? body.modulos : ['agenda']
  const modulos = rawModulos.filter((m): m is Modulo => ['agenda', 'whatsapp', 'social'].includes(m))

  if (modulos.length === 0) {
    return NextResponse.json({ error: 'Selecione ao menos um módulo.' }, { status: 400 })
  }

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('nome, email, stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!terapeuta) return NextResponse.json({ error: 'Terapeuta não encontrado.' }, { status: 404 })

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

  const lineItems: { price: string; quantity: number }[] = []

  for (const modulo of modulos) {
    const priceId = PRICE_MAP[modulo]
    if (!priceId) continue

    lineItems.push({ price: priceId, quantity: 1 })

    if (modulo === 'agenda') {
      const { data: pacientes } = await supabase
        .from('pacientes')
        .select('id', { count: 'exact', head: false })
        .eq('terapeuta_id', user.id)
        .eq('ativo', true)

      const qtdPacientes = pacientes?.length ?? 0
      const priceIdPac = process.env.STRIPE_PRICE_ID_PACIENTE
      if (priceIdPac) {
        lineItems.push({ price: priceIdPac, quantity: Math.max(qtdPacientes, 1) })
      }
    }
  }

  if (lineItems.length === 0) {
    return NextResponse.json({ error: 'Nenhum preço configurado para os módulos selecionados.' }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://agendaonlineai.com.br'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: lineItems,
    success_url: `${appUrl}/configuracoes?checkout=success`,
    cancel_url: `${appUrl}/configuracoes`,
    subscription_data: {
      metadata: {
        terapeuta_id: user.id,
        modulos: modulos.join(','),
      },
    },
  })

  return NextResponse.json({ url: session.url })
}
