import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PerfilForm from './PerfilForm'
import IntegracaoWhatsApp from './IntegracaoWhatsApp'
import IntegracaoWhatsAppSecretaria from './IntegracaoWhatsAppSecretaria'
import IntegracaoGoogle from './IntegracaoGoogle'
import PlanoSection from './PlanoSection'
import EquipeSection from './EquipeSection'
import AuditLogsSection from './AuditLogsSection'
import MensagensAutomaticasSection from './MensagensAutomaticasSection'
import AcessoSection from './AcessoSection'

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

  // Dados de equipe e audit (só para admin)
  let membros: { id: string; nome: string; email: string; role: string }[] = []
  let convites: { id: string; email: string; nome: string | null; role: string; token: string; created_at: string }[] = []
  let auditLogs: { id: string; action: string; table_name: string; created_at: string; user_id: string }[] = []
  let mensagemAniversario = 'Olá, {nome}! 🎉 Feliz aniversário! Desejamos um dia repleto de alegrias. Conte sempre com a nossa equipe! 🎂'
  let horaMensagens = '08:00'
  let equipeAcessaProntuario = false

  if (terapeuta.role === 'admin' && terapeuta.clinica_id) {
    const { data: membrosData } = await supabase
      .from('terapeutas')
      .select('id, nome, email, role')
      .eq('clinica_id', terapeuta.clinica_id)
      .order('created_at')

    const { data: convitesData } = await supabase
      .from('convites')
      .select('id, email, nome, role, token, created_at')
      .eq('clinica_id', terapeuta.clinica_id)
      .is('aceito_em', null)
      .order('created_at', { ascending: false })

    const { data: auditData } = await supabase
      .from('audit_logs')
      .select('id, action, table_name, created_at, user_id')
      .eq('clinica_id', terapeuta.clinica_id)
      .order('created_at', { ascending: false })
      .limit(30)

    membros   = membrosData ?? []
    convites  = convitesData ?? []
    auditLogs = auditData ?? []

    const { data: clinicaData } = await supabase
      .from('clinicas')
      .select('mensagem_aniversario, hora_mensagens_automaticas, equipe_acessa_prontuario')
      .eq('id', terapeuta.clinica_id)
      .single()

    if (clinicaData?.mensagem_aniversario) mensagemAniversario = clinicaData.mensagem_aniversario
    if (clinicaData?.hora_mensagens_automaticas) horaMensagens = clinicaData.hora_mensagens_automaticas
    if (typeof clinicaData?.equipe_acessa_prontuario === 'boolean') equipeAcessaProntuario = clinicaData.equipe_acessa_prontuario
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gerencie seu perfil e integrações</p>
      </div>

      {searchParams.checkout === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800">
          ✅ Assinatura ativada com sucesso! Bem-vindo ao Agenda Online AI.
        </div>
      )}

      <PerfilForm terapeuta={terapeuta} />

      {/* WhatsApp do profissional — visível para profissionais e admin */}
      {terapeuta.role !== 'secretaria' && (
        <IntegracaoWhatsApp terapeutaId={user.id} whatsappNumber={terapeuta.whatsapp_number} />
      )}

      {/* WhatsApp da secretária — apenas admin */}
      {terapeuta.role === 'admin' && (
        <IntegracaoWhatsAppSecretaria />
      )}

      <IntegracaoGoogle
        connected={terapeuta.google_calendar_connected}
        calendarId={terapeuta.google_calendar_id}
        placeId={terapeuta.google_place_id}
      />

      {terapeuta.role === 'admin' && (
        <>
          <PlanoSection
            plano={terapeuta.plano}
            trialFim={terapeuta.trial_fim}
            totalPacientes={totalPacientes ?? 0}
            hasSubscription={!!terapeuta.asaas_customer_id}
          />
          <EquipeSection
            membros={membros}
            convites={convites}
            currentUserId={user.id}
          />
          <AcessoSection equipeAcessaProntuario={equipeAcessaProntuario} />
          <MensagensAutomaticasSection
            mensagemAniversario={mensagemAniversario}
            horaMensagens={horaMensagens}
          />
          <AuditLogsSection logs={auditLogs} />
        </>
      )}
    </div>
  )
}
