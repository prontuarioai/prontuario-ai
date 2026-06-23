import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPortalAssinatura } from '@/lib/asaas'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('asaas_customer_id')
    .eq('id', user.id)
    .single()

  if (!terapeuta?.asaas_customer_id) {
    return NextResponse.json({ error: 'Sem assinatura encontrada.' }, { status: 404 })
  }

  try {
    const url = await getPortalAssinatura(terapeuta.asaas_customer_id)
    if (!url) return NextResponse.json({ error: 'Nenhuma fatura pendente.' }, { status: 404 })
    return NextResponse.json({ url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
