import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { criarCustomer, criarAssinatura } from '@/lib/asaas'

const BASE_PRICE       = 59.90
const PER_PATIENT_PRICE = 2.99

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const modulos: string[] = Array.isArray(body.modulos) ? body.modulos : ['agenda']
  const modulosValidos = ['agenda', 'whatsapp', 'social']
  const modulosSanitizados = modulos.filter(m => modulosValidos.includes(m))
  if (!modulosSanitizados.includes('agenda')) modulosSanitizados.unshift('agenda')

  const [{ data: terapeuta }, { count: totalPacientes }] = await Promise.all([
    supabase.from('terapeutas').select('nome, email, asaas_customer_id').eq('id', user.id).single(),
    supabase.from('pacientes').select('*', { count: 'exact', head: true }).eq('terapeuta_id', user.id).eq('ativo', true),
  ])

  if (!terapeuta) return NextResponse.json({ error: 'Terapeuta não encontrado.' }, { status: 404 })

  try {
    // Criar ou reutilizar customer no Asaas
    let customerId = terapeuta.asaas_customer_id
    if (!customerId) {
      const customer = await criarCustomer({
        nome: terapeuta.nome,
        email: terapeuta.email,
        externalReference: user.id,
      })
      customerId = customer.id

      const service = createServiceClient()
      await service.from('terapeutas')
        .update({ asaas_customer_id: customerId })
        .eq('id', user.id)
    }

    // Calcular valor total = base + (pacientes ativos × 2,99)
    const qtd = totalPacientes ?? 0
    const valorTotal = parseFloat((BASE_PRICE + qtd * PER_PATIENT_PRICE).toFixed(2))

    // Criar assinatura mensal
    const assinatura = await criarAssinatura({
      customerId,
      valor: valorTotal,
      descricao: `Agenda Online AI — R$ ${BASE_PRICE.toFixed(2).replace('.', ',')} base + ${qtd} paciente${qtd !== 1 ? 's' : ''} × R$ ${PER_PATIENT_PRICE.toFixed(2).replace('.', ',')}`,
      terapeutaId: user.id,
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://agendaonlineai.com.br'

    // Salvar assinatura + módulos selecionados
    const service = createServiceClient()
    await Promise.all([
      service.from('assinaturas').upsert({
        terapeuta_id: user.id,
        asaas_subscription_id: assinatura.id,
        status: 'trialing',
        valor_total: valorTotal,
      }, { onConflict: 'terapeuta_id' }),
      service.from('terapeutas')
        .update({ enabled_modules: modulosSanitizados })
        .eq('id', user.id),
    ])

    // Retorna URL de pagamento da primeira fatura
    const invoiceUrl = assinatura.invoiceUrl ?? `${appUrl}/configuracoes`
    return NextResponse.json({ url: invoiceUrl })

  } catch (err: any) {
    console.error('Asaas checkout error:', err)
    return NextResponse.json({ error: err.message ?? 'Erro ao criar assinatura.' }, { status: 500 })
  }
}
