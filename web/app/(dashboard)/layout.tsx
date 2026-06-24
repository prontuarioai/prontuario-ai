import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('id, nome, foto_url, plano, plano_cortesia, trial_fim, clinica_id, role, enabled_modules, brand_context')
    .eq('id', user.id)
    .single()

  if (!terapeuta) redirect('/cadastro?setup=1')
  if (!terapeuta.clinica_id) redirect('/onboarding')

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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden" data-brand={terapeuta.brand_context ?? 'agenda_online_ai'}>
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
