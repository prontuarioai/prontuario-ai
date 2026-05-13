import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const [{ data: transcricao }, { data: resumo }] = await Promise.all([
    supabase
      .from('transcricoes')
      .select('status, texto')
      .eq('sessao_id', params.id)
      .maybeSingle(),
    supabase
      .from('resumos_ia')
      .select('principais_temas, emocoes_detectadas, pontos_trabalhados, plano_proxima_sessao, alertas')
      .eq('sessao_id', params.id)
      .maybeSingle(),
  ])

  return NextResponse.json({ transcricao, resumo })
}
