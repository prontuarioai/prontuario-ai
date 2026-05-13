import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('id, nome, foto_url, plano, trial_fim')
    .eq('id', user.id)
    .single()

  if (!terapeuta) redirect('/cadastro?setup=1')

  const { count: eventosNaoLidos } = await supabase
    .from('eventos_entre_sessoes')
    .select('*', { count: 'exact', head: true })
    .eq('terapeuta_id', user.id)
    .eq('lido', false)

  const { count: notificacoesNaoLidas } = await supabase
    .from('notificacoes')
    .select('*', { count: 'exact', head: true })
    .eq('terapeuta_id', user.id)
    .eq('lida', false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        terapeuta={terapeuta}
        eventosNaoLidos={eventosNaoLidos ?? 0}
        notificacoesNaoLidas={notificacoesNaoLidas ?? 0}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
