import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import PacienteForm from '@/components/pacientes/PacienteForm'
import ProntuarioSection from './ProntuarioSection'
import HistoricoEvolucaoSection from './HistoricoEvolucaoSection'
import ComunicacaoSection from './ComunicacaoSection'
import { atualizarPacienteAction, arquivarPacienteAction } from '@/app/actions/pacientes'

type Aba = 'dados' | 'prontuario' | 'historico' | 'comunicacao'

export default async function PacientePage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { aba?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  // Carrega terapeuta logado + config da clínica em paralelo
  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('id, role, clinica_id')
    .eq('id', user.id)
    .single()

  // Carrega config de acesso da clínica
  const clinicaId = terapeuta?.clinica_id
  const role      = terapeuta?.role ?? 'profissional'

  const { data: clinica } = clinicaId
    ? await supabase.from('clinicas').select('equipe_acessa_prontuario').eq('id', clinicaId).single()
    : { data: null }

  // Determina se este usuário pode ver o prontuário
  const podeProntuario =
    role === 'admin' ||
    role === 'profissional' && (clinica?.equipe_acessa_prontuario === true)

  // RLS cuida do acesso por clínica — se não existir, 404
  const { data: paciente } = await supabase
    .from('pacientes')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!paciente) notFound()

  // Profissional só vê paciente que seja seu
  if (role === 'profissional' && paciente.profissional_id !== user.id && !clinica?.equipe_acessa_prontuario) {
    // Pode ver dados básicos, mas não prontuário — não bloqueia a página
  }

  // Aba ativa (default = dados; secretária não acessa prontuário)
  const abaAtiva: Aba = (() => {
    const q = searchParams.aba as Aba
    if (q === 'prontuario' && !podeProntuario) return 'dados'
    if (['dados', 'prontuario', 'historico', 'comunicacao'].includes(q)) return q
    return 'dados'
  })()

  // Carrega dados conforme a aba ativa
  let sessoes: any[] = []
  let eventos: any[] = []
  let triagens: any[] = []
  let avaliacoes: any[] = []
  let eventosComunicacao: any[] = []

  if (abaAtiva === 'historico' || abaAtiva === 'prontuario') {
    const [s, e, t, a] = await Promise.all([
      supabase.from('sessoes').select('id, inicio, fim, status, modalidade').eq('paciente_id', params.id).order('inicio', { ascending: false }).limit(10),
      supabase.from('eventos_entre_sessoes').select('id, mensagem, direcao, categoria, intensidade_emocional, created_at, fonte').eq('paciente_id', params.id).order('created_at', { ascending: false }).limit(200),
      supabase.from('triagens').select('id, humor_geral, eventos_relevantes, foco_sessao, risco_detectado, respondida_em').eq('paciente_id', params.id).not('respondida_em', 'is', null).order('respondida_em', { ascending: false }).limit(50),
      supabase.from('avaliacoes_pos_sessao').select('id, nota, comentario, respondida_em').eq('paciente_id', params.id).not('respondida_em', 'is', null).order('respondida_em', { ascending: false }).limit(50),
    ])
    sessoes    = s.data ?? []
    eventos    = e.data ?? []
    triagens   = t.data ?? []
    avaliacoes = a.data ?? []
  } else if (abaAtiva === 'comunicacao') {
    const { data } = await supabase.from('eventos_entre_sessoes').select('id, mensagem, direcao, categoria, intensidade_emocional, created_at').eq('paciente_id', params.id).order('created_at', { ascending: false }).limit(200)
    eventosComunicacao = data ?? []
  } else {
    // Aba dados: sessões recentes para sidebar
    const { data } = await supabase.from('sessoes').select('id, inicio, status, modalidade').eq('paciente_id', params.id).order('inicio', { ascending: false }).limit(5)
    sessoes = data ?? []
  }

  const updateAction  = atualizarPacienteAction.bind(null, params.id)
  const archiveAction = arquivarPacienteAction.bind(null, params.id)
  const totalSessoes  = sessoes?.filter(s => s.status === 'realizada').length ?? 0

  const abas = [
    { id: 'dados',        label: 'Dados de contato' },
    ...(podeProntuario ? [{ id: 'prontuario', label: '🔒 Prontuário' }] : []),
    ...(podeProntuario ? [{ id: 'historico',  label: 'Histórico & Evolução' }] : []),
    { id: 'comunicacao', label: 'Comunicação' },
  ] as { id: Aba; label: string }[]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/pacientes" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← Pacientes</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{paciente.nome}</h1>
          <p className="text-sm text-gray-400">
            {paciente.whatsapp && <span>{paciente.whatsapp} · </span>}
            Desde {new Date(paciente.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/agenda?paciente=${params.id}`}
            className="text-sm font-medium text-brand-600 border border-brand-200 px-4 py-2 rounded-xl hover:bg-brand-50 transition-colors">
            Agendar sessão
          </Link>
          {paciente.ativo && (role === 'admin' || role === 'profissional') && (
            <form action={archiveAction}>
              <button type="submit"
                className="text-sm font-medium text-red-500 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
                onClick={e => { if (!confirm('Arquivar paciente?')) e.preventDefault() }}>
                Arquivar
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Aviso de acesso restrito para secretária */}
      {role === 'secretaria' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          🔒 O prontuário clínico deste paciente é acessível apenas para os profissionais da clínica.
        </div>
      )}

      {/* Navegação por abas */}
      <div className="flex gap-1 border-b border-gray-100">
        {abas.map(aba => (
          <Link
            key={aba.id}
            href={`/pacientes/${params.id}?aba=${aba.id}`}
            className={[
              'px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors',
              abaAtiva === aba.id
                ? 'text-brand-700 border-b-2 border-brand-600 bg-brand-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
            ].join(' ')}
          >
            {aba.label}
          </Link>
        ))}
      </div>

      {/* === ABA: DADOS DE CONTATO === */}
      {abaAtiva === 'dados' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Dados de contato</h2>
            <PacienteForm action={updateAction} defaultValues={paciente} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Sessões recentes</h2>
            {sessoes.length > 0 ? (
              <div className="space-y-2">
                {sessoes.map((s: any) => (
                  <Link key={s.id} href={`/sessoes/${s.id}`}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:text-brand-700 transition-colors">
                    <div>
                      <p className="text-xs font-medium text-gray-900">
                        {new Date(s.inicio).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-gray-400">{s.modalidade}</p>
                    </div>
                    <StatusBadge status={s.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Nenhuma sessão ainda.</p>
            )}
          </div>
        </div>
      )}

      {/* === ABA: PRONTUÁRIO CLÍNICO === */}
      {abaAtiva === 'prontuario' && podeProntuario && (
        <ProntuarioSection pacienteId={params.id} defaults={paciente} />
      )}

      {/* === ABA: HISTÓRICO E EVOLUÇÃO === */}
      {abaAtiva === 'historico' && podeProntuario && (
        <HistoricoEvolucaoSection
          triagens={triagens}
          avaliacoes={avaliacoes}
          eventos={eventos}
        />
      )}

      {/* === ABA: COMUNICAÇÃO === */}
      {abaAtiva === 'comunicacao' && (
        <ComunicacaoSection
          pacienteId={params.id}
          eventos={eventosComunicacao}
        />
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    agendada:  'bg-blue-50 text-blue-700',
    realizada: 'bg-green-50 text-green-700',
    cancelada: 'bg-gray-100 text-gray-500',
    faltou:    'bg-red-50 text-red-600',
  }
  const labels: Record<string, string> = {
    agendada: 'Agendada', realizada: 'Realizada', cancelada: 'Cancelada', faltou: 'Faltou',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {labels[status] ?? status}
    </span>
  )
}
