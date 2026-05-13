import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PerfilForm from './PerfilForm'
import IntegracaoWhatsApp from './IntegracaoWhatsApp'
import IntegracaoGoogle from './IntegracaoGoogle'
import PlanoSection from './PlanoSection'

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: { checkout?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!terapeuta) redirect('/login')

  const { count: totalPacientes } = await supabase
    .from('pacientes')
    .select('*', { count: 'exact', head: true })
    .eq('terapeuta_id', user.id)
    .eq('ativo', true)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gerencie seu perfil e integrações</p>
      </div>

      {searchParams.checkout === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800">
          ✅ Assinatura ativada com sucesso! Bem-vindo ao Prontuario.ai.
        </div>
      )}

      <PerfilForm terapeuta={terapeuta} />
      <IntegracaoWhatsApp terapeutaId={user.id} whatsappNumber={terapeuta.whatsapp_number} />
      <IntegracaoGoogle
        connected={terapeuta.google_calendar_connected}
        calendarId={terapeuta.google_calendar_id}
      />
      <PlanoSection
        plano={terapeuta.plano}
        trialFim={terapeuta.trial_fim}
        totalPacientes={totalPacientes ?? 0}
        hasSubscription={!!terapeuta.stripe_customer_id}
      />
    </div>
  )
}
