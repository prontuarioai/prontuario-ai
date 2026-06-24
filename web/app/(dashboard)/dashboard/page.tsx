import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import EvolucaoEmocionalChart from '@/components/dashboard/EvolucaoEmocionalChart'
import ReceitaWidget from '@/components/dashboard/ReceitaWidget'
import { subDays } from 'date-fns'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('nome, plano, trial_fim')
    .eq('id', user.id)
    .single()

  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString()
  const inicio30dias = subDays(hoje, 30).toISOString()

  const [
    { count: totalPacientes },
    { count: sessoesHoje },
    { count: sessoesMes },
    { data: proximasSessoes },
    { data: notificacoes },
    { count: eventosNaoLidos },
    { data: triagensRisco },
    { data: mapaEmocional },
    { data: assinatura },
  ] = await Promise.all([
    supabase.from('pacientes').select('*', { count: 'exact', head: true }).eq('terapeuta_id', user.id).eq('ativo', true),
    supabase.from('sessoes').select('*', { count: 'exact', head: true })
      .eq('terapeuta_id', user.id)
      .gte('inicio', hoje.toISOString().split('T')[0])
      .lte('inicio', hoje.toISOString().split('T')[0] + 'T23:59:59'),
    supabase.from('sessoes').select('*', { count: 'exact', head: true })
      .eq('terapeuta_id', user.id).gte('inicio', inicioMes).eq('status', 'realizada'),
    supabase.from('sessoes')
      .select('id, inicio, fim, modalidade, pacientes(nome)')
      .eq('terapeuta_id', user.id)
      .gte('inicio', new Date().toISOString())
      .order('inicio').limit(5),
    supabase.from('notificacoes')
      .select('id, mensagem, tipo, created_at')
      .eq('terapeuta_id', user.id).eq('lida', false)
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('eventos_entre_sessoes').select('*', { count: 'exact', head: true })
      .eq('terapeuta_id', user.id).eq('lido', false),
    supabase.from('triagens')
      .select('id, pacientes(nome)')
      .eq('terapeuta_id', user.id).eq('risco_detectado', 'alto').eq('lida_terapeuta', false).limit(3),
    supabase.from('mapa_emocional')
      .select('data_referencia, valence')
      .eq('terapeuta_id', user.id)
      .gte('data_referencia', inicio30dias)
      .order('data_referencia'),
    supabase.from('assinaturas').select('valor_total').eq('terapeuta_id', user.id).maybeSingle(),
  ])

  const kpis = [
    { label: 'Pacientes ativos', value: totalPacientes ?? 0, href: '/pacientes' },
    { label: 'Sessões hoje', value: sessoesHoje ?? 0, href: '/agenda' },
    { label: 'Sessões no mês', value: sessoesMes ?? 0, href: '/sessoes' },
    { label: 'Eventos não lidos', value: eventosNaoLidos ?? 0, href: '/eventos' },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Olá, {terapeuta?.nome.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <Link key={kpi.label} href={kpi.href} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:border-brand-200 transition-colors">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{kpi.label}</p>
          </Link>
        ))}
      </div>

      {/* Alertas de risco alto */}
      {triagensRisco && triagensRisco.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
          <h2 className="text-sm font-semibold text-red-800 flex items-center gap-2">
            <span>⚠️</span> Triagens com risco alto não lidas
          </h2>
          {triagensRisco.map((t: any) => (
            <Link
              key={t.id}
              href={`/triagens/${t.id}`}
              className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-red-100 hover:border-red-300 transition"
            >
              <span className="text-sm text-gray-900 dark:text-white">{t.pacientes?.nome}</span>
              <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Ver triagem →</span>
            </Link>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Próximas sessões */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Próximas sessões</h2>
            <Link href="/agenda" className="text-xs text-brand-600 hover:underline">Ver agenda →</Link>
          </div>
          {proximasSessoes && proximasSessoes.length > 0 ? (
            <div className="space-y-2">
              {proximasSessoes.map((s: any) => (
                <Link key={s.id} href={`/sessoes/${s.id}`} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 hover:text-brand-700 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{s.pacientes?.nome}</p>
                    <p className="text-xs text-gray-400 capitalize">{s.modalidade}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-200">
                      {new Date(s.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(s.inicio).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Nenhuma sessão próxima.</p>
          )}
        </div>

        {/* Evolução emocional */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-2">
          <h2 className="font-semibold text-gray-900 dark:text-white">Evolução emocional</h2>
          <EvolucaoEmocionalChart dados={mapaEmocional ?? []} />
        </div>

        {/* Notificações + Receita */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">Notificações</h2>
            </div>
            {notificacoes && notificacoes.length > 0 ? (
              <div className="space-y-2">
                {notificacoes.map((n: any) => (
                  <div key={n.id} className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-base mt-0.5 shrink-0">
                      {n.tipo === 'alerta' ? '⚠️' : n.tipo === 'sucesso' ? '✅' : n.tipo === 'erro' ? '❌' : 'ℹ️'}
                    </span>
                    <p className="text-xs text-gray-600 dark:text-gray-300 flex-1 leading-relaxed">{n.mensagem}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Tudo em dia!</p>
            )}
          </div>

          <ReceitaWidget
            plano={terapeuta?.plano ?? 'trial'}
            trialFim={terapeuta?.trial_fim ?? new Date().toISOString()}
            totalPacientes={totalPacientes ?? 0}
            valorTotal={assinatura?.valor_total}
          />
        </div>
      </div>
    </div>
  )
}
