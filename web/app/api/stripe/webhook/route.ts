import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { syncPacientesStripe } from '@/lib/stripe'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 400 })
  }

  const supabase = createServiceClient()

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const terapeutaId = sub.metadata?.terapeuta_id
      if (!terapeutaId) break

      const status = sub.status === 'active' ? 'ativo' : sub.status === 'trialing' ? 'trial' : 'inativo'
      await supabase.from('terapeutas').update({ plano: status }).eq('id', terapeutaId)
      await supabase.from('assinaturas').upsert({
        terapeuta_id: terapeutaId,
        stripe_subscription_id: sub.id,
        stripe_price_base: process.env.STRIPE_PRICE_ID_BASE,
        stripe_price_pac: process.env.STRIPE_PRICE_ID_PACIENTE,
        status: sub.status,
        periodo_inicio: new Date(sub.current_period_start * 1000).toISOString(),
        periodo_fim: new Date(sub.current_period_end * 1000).toISOString(),
      }, { onConflict: 'stripe_subscription_id' })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const terapeutaId = sub.metadata?.terapeuta_id
      if (!terapeutaId) break
      await supabase.from('terapeutas').update({ plano: 'inativo' }).eq('id', terapeutaId)
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
      if (!subId) break

      const sub = await stripe.subscriptions.retrieve(subId)
      const terapeutaId = sub.metadata?.terapeuta_id
      if (!terapeutaId) break

      const { count: qtdPacientes } = await supabase
        .from('pacientes').select('*', { count: 'exact', head: true })
        .eq('terapeuta_id', terapeutaId).eq('ativo', true)

      await syncPacientesStripe(subId, qtdPacientes ?? 0)

      const valor = (invoice.amount_paid ?? 0) / 100
      await supabase.from('assinaturas').update({ valor_total: valor }).eq('stripe_subscription_id', subId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
      if (!subId) break

      const sub = await stripe.subscriptions.retrieve(subId)
      const terapeutaId = sub.metadata?.terapeuta_id
      if (!terapeutaId) break

      await supabase.from('terapeutas').update({ plano: 'inativo' }).eq('id', terapeutaId)
      await supabase.from('notificacoes').insert({
        terapeuta_id: terapeutaId,
        mensagem: 'Falha no pagamento da assinatura. Verifique seu cartão.',
        tipo: 'erro',
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
