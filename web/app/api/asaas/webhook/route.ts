import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verificarTokenWebhook } from '@/lib/asaas'

export async function POST(request: NextRequest) {
  // Verificar token do webhook Asaas (via query param ou header)
  const token = request.nextUrl.searchParams.get('token')
    ?? request.headers.get('asaas-access-token')
    ?? ''

  if (!verificarTokenWebhook(token)) {
    return NextResponse.json({ error: 'Token inválido.' }, { status: 401 })
  }

  const event = await request.json()
  const supabase = createServiceClient()

  const eventType: string = event.event
  const payment = event.payment
  const subscription = event.subscription

  switch (eventType) {

    // ── Pagamento de assinatura recebido ──
    case 'PAYMENT_RECEIVED': {
      if (!payment?.externalReference) break

      // Verifica se é pagamento de consulta (sessaoId) ou da plataforma (terapeutaId)
      const ref = payment.externalReference

      // Tenta encontrar sessão com esse ID
      const { data: sessao } = await supabase
        .from('sessoes')
        .select('id, terapeuta_id')
        .eq('asaas_payment_id', payment.id)
        .maybeSingle()

      if (sessao) {
        // Pagamento de consulta
        await supabase.from('sessoes')
          .update({ pago: true })
          .eq('id', sessao.id)

        await supabase.from('notificacoes').insert({
          terapeuta_id: sessao.terapeuta_id,
          mensagem: `✅ Pagamento da consulta confirmado (R$ ${(payment.value ?? 0).toFixed(2).replace('.', ',')})`,
          tipo: 'sucesso',
        })
      }
      break
    }

    // ── Assinatura da plataforma ativada/renovada ──
    case 'SUBSCRIPTION_CREATED':
    case 'PAYMENT_CONFIRMED': {
      if (payment?.subscription) {
        const { data: assinatura } = await supabase
          .from('assinaturas')
          .select('terapeuta_id')
          .eq('asaas_subscription_id', payment.subscription)
          .maybeSingle()

        if (assinatura) {
          // Nunca altera usuários em cortesia
          const { data: t } = await supabase.from('terapeutas').select('plano_cortesia').eq('id', assinatura.terapeuta_id).single()
          if (!t?.plano_cortesia) {
            await supabase.from('terapeutas')
              .update({ plano: 'ativo' })
              .eq('id', assinatura.terapeuta_id)
          }
          await supabase.from('assinaturas')
            .update({ status: 'active' })
            .eq('asaas_subscription_id', payment.subscription)
        }
      }
      break
    }

    // ── Pagamento vencido / inadimplência ──
    case 'PAYMENT_OVERDUE': {
      if (payment?.subscription) {
        const { data: assinatura } = await supabase
          .from('assinaturas')
          .select('terapeuta_id')
          .eq('asaas_subscription_id', payment.subscription)
          .maybeSingle()

        if (assinatura) {
          // Nunca penaliza usuários em cortesia
          const { data: t } = await supabase.from('terapeutas').select('plano_cortesia').eq('id', assinatura.terapeuta_id).single()
          if (t?.plano_cortesia) break
          await supabase.from('terapeutas')
            .update({ plano: 'inativo' })
            .eq('id', assinatura.terapeuta_id)
          await supabase.from('notificacoes').insert({
            terapeuta_id: assinatura.terapeuta_id,
            mensagem: '⚠️ Pagamento da assinatura em atraso. Regularize para manter o acesso.',
            tipo: 'erro',
          })
        }
      }
      break
    }

    // ── Pagamento deletado (assinatura cancelada manualmente) ──
    // Asaas não tem SUBSCRIPTION_DELETED; ao cancelar uma assinatura,
    // os pagamentos pendentes são deletados → PAYMENT_DELETED dispara.
    case 'PAYMENT_DELETED': {
      if (payment?.subscription) {
        const { data: assinatura } = await supabase
          .from('assinaturas')
          .select('terapeuta_id, status')
          .eq('asaas_subscription_id', payment.subscription)
          .maybeSingle()

        // Só desativa se a assinatura ainda constava como ativa
        if (assinatura && assinatura.status === 'active') {
          await supabase.from('terapeutas')
            .update({ plano: 'inativo' })
            .eq('id', assinatura.terapeuta_id)
          await supabase.from('assinaturas')
            .update({ status: 'cancelled' })
            .eq('asaas_subscription_id', payment.subscription)
          await supabase.from('notificacoes').insert({
            terapeuta_id: assinatura.terapeuta_id,
            mensagem: '❌ Assinatura cancelada. Para reativar, acesse Configurações → Plano.',
            tipo: 'erro',
          })
        }
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
