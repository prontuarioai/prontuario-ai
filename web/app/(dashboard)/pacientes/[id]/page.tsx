import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import PacienteForm from '@/components/pacientes/PacienteForm'
import { atualizarPacienteAction, arquivarPacienteAction } from '@/app/actions/pacientes'

export default async function PacientePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: paciente } = await supabase
    .from('pacientes')
    .select('*')
    .eq('id', params.id)
    .eq('terapeuta_id', user!.id)
    .single()

  if (!paciente) notFound()

  const { data: sessoes } = await supabase
    .from('sessoes')
    .select('id, inicio, fim, status, modalidade')
    .eq('paciente_id', params.id)
    .order('inicio', { ascending: false })
    .limit(10)

  const updateAction = atualizarPacienteAction.bind(null, params.id)
  const archiveAction = arquivarPacienteAction.bind(null, params.id)

  const totalSessoes = sessoes?.filter(s => s.status === 'realizada').length ?? 0

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/pacientes" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Pacientes
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{paciente.nome}</h1>
          <p className="text-sm text-gray-400">
            {totalSessoes} sessão{totalSessoes !== 1 ? 'ões' : ''} realizada{totalSessoes !== 1 ? 's' : ''}
            {' · '}Desde {new Date(paciente.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/agenda?paciente=${params.id}`}
            className="text-sm font-medium text-teal-600 border border-teal-200 px-4 py-2 rounded-xl hover:bg-teal-50 transition-colors"
          >
            Agendar sessão
          </Link>
          {paciente.ativo && (
            <form action={archiveAction}>
              <button
                type="submit"
                className="text-sm font-medium text-red-500 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
                onClick={e => { if (!confirm('Arquivar paciente?')) e.preventDefault() }}
              >
                Arquivar
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Formulário de edição */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Dados do paciente</h2>
          <PacienteForm action={updateAction} defaultValues={paciente} />
        </div>

        {/* Sessões recentes */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Sessões recentes</h2>
          {sessoes && sessoes.length > 0 ? (
            <div className="space-y-2">
              {sessoes.map(s => (
                <Link
                  key={s.id}
                  href={`/sessoes/${s.id}`}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:text-teal-700 transition-colors"
                >
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
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    agendada: 'bg-blue-50 text-blue-700',
    realizada: 'bg-green-50 text-green-700',
    cancelada: 'bg-gray-100 text-gray-500',
    faltou: 'bg-red-50 text-red-600',
  }
  const labels: Record<string, string> = {
    agendada: 'Agendada',
    realizada: 'Realizada',
    cancelada: 'Cancelada',
    faltou: 'Faltou',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {labels[status] ?? status}
    </span>
  )
}
