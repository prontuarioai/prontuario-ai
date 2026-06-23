import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const SUPER_ADMIN_EMAIL = 'aleepedro@gmail.com'

export async function POST(request: NextRequest) {
  // Verificar autenticação — só o super-admin acessa
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
  }

  const { userId, ativar } = await request.json() as { userId: string; ativar: boolean }

  if (!userId || typeof ativar !== 'boolean') {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const service = createServiceClient()

  // Atualiza cortesia + plano
  const { error } = await service
    .from('terapeutas')
    .update({
      plano_cortesia: ativar,
      // Se ativando cortesia, garante plano 'ativo'. Se removendo, volta para 'trial' se não tiver assinatura.
      plano: ativar ? 'ativo' : 'trial',
    })
    .eq('id', userId)

  if (error) {
    console.error('toggle-cortesia error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar.' }, { status: 500 })
  }

  // Log da ação (best-effort, sem await)
  void service.from('audit_logs').insert({
    user_id: user.id,
    action: ativar ? 'CORTESIA_ATIVADA' : 'CORTESIA_REMOVIDA',
    table_name: 'terapeutas',
    record_id: userId,
    new_data: { plano_cortesia: ativar },
  })

  return NextResponse.json({ ok: true })
}
