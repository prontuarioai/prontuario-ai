import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuperAdminClient from './SuperAdminClient'

const SUPER_ADMIN_EMAIL = 'aleepedro@gmail.com'

export default async function SuperAdminPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Proteção: só o dono da ferramenta acessa
  if (!user || user.email !== SUPER_ADMIN_EMAIL) redirect('/login')

  const q = searchParams.q?.trim() ?? ''

  // Busca todos os terapeutas com dados da clínica
  let query = supabase
    .from('terapeutas')
    .select(`
      id, nome, email, plano, plano_cortesia, trial_fim, created_at, role,
      clinicas(nome)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (q) {
    query = query.or(`nome.ilike.%${q}%,email.ilike.%${q}%`)
  }

  const { data: usuarios } = await query

  // Estatísticas rápidas
  const { count: totalUsuarios } = await supabase
    .from('terapeutas')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin')

  const { count: totalAtivos } = await supabase
    .from('terapeutas')
    .select('*', { count: 'exact', head: true })
    .eq('plano', 'ativo')

  const { count: totalCortesia } = await supabase
    .from('terapeutas')
    .select('*', { count: 'exact', head: true })
    .eq('plano_cortesia', true)

  const { count: totalTrial } = await supabase
    .from('terapeutas')
    .select('*', { count: 'exact', head: true })
    .eq('plano', 'trial')

  return (
    <SuperAdminClient
      usuarios={(usuarios ?? []).map(u => ({
        ...u,
        clinica_nome: (u.clinicas as any)?.nome ?? null,
      }))}
      stats={{
        totalUsuarios: totalUsuarios ?? 0,
        totalAtivos: totalAtivos ?? 0,
        totalCortesia: totalCortesia ?? 0,
        totalTrial: totalTrial ?? 0,
      }}
      q={q}
    />
  )
}
