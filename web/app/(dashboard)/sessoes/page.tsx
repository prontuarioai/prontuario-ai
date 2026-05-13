import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SessoesSearch from './SessoesSearch'

export default async function SessoesPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('sessoes')
    .select('id, inicio, fim, status, modalidade, pacientes(id, nome)')
    .eq('terapeuta_id', user!.id)
    .order('inicio', { ascending: false })
    .limit(50)

  if (searchParams.status) query = query.eq('status', searchParams.status)
  if (searchParams.q) {
    const { data: pacs } = await supabase
      .from('pacientes')
      .select('id')
      .eq('terapeuta_id', user!.id)
      .ilike('nome', `%${searchParams.q}%`)
    const ids = pacs?.map(p => p.id) ?? []
    if (ids.length) query = query.in('paciente_id', ids)
    else return <EmptyState q={searchParams.q} />
  }

  const { data: sessoes } = await query

  const STATUS_TABS = [
    { value: '', label: 'Todas' },
    { value: 'agendada', label: 'Agendadas' },
    { value: 'realizada', label: 'Realizadas' },
    { value: 'cancelada', label: 'Canceladas' },
    { value: 'faltou', label: 'Faltou' },
  ]

  const STATUS_COLOR: Record<string, string> = {
    agendada: 'bg-blue-50 text-blue-700',
    realizada: 'bg-green-50 text-green-700',
    cancelada: 'bg-gray-100 text-gray-500',
    faltou: 'bg-red-50 text-red-600',
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessões</h1>
          <p className="text-sm text-gray-500 mt-0.5">{sessoes?.length ?? 0} encontradas</p>
        </div>
        <Link
          href="/agenda"
          className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          + Agendar
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SessoesSearch q={searchParams.q} />
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
          {STATUS_TABS.map(tab => (
            <Link
              key={tab.value}
              href={`/sessoes${tab.value ? `?status=${tab.value}` : ''}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                (searchParams.status ?? '') === tab.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {sessoes && sessoes.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {sessoes.map((s: any) => (
            <Link
              key={s.id}
              href={`/sessoes/${s.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
            >
              <div className="text-center min-w-[48px]">
                <p className="text-xs text-gray-400">{new Date(s.inicio).toLocaleDateString('pt-BR', { month: 'short' })}</p>
                <p className="text-xl font-bold text-gray-900 leading-none">{new Date(s.inicio).getDate()}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{s.pacientes?.nome}</p>
                <p className="text-xs text-gray-400">
                  {new Date(s.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  {' – '}
                  {new Date(s.fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}{s.modalidade}
                </p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[s.status] ?? 'bg-gray-100 text-gray-500'}`}>
                {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
              </span>
              <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState q={searchParams.q} />
      )}
    </div>
  )
}

function EmptyState({ q }: { q?: string }) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
      <p className="text-4xl mb-3">📋</p>
      <p className="text-gray-500 text-sm">
        {q ? 'Nenhuma sessão encontrada.' : 'Nenhuma sessão ainda.'}
      </p>
      {!q && (
        <Link href="/agenda" className="mt-4 inline-block text-sm text-teal-600 font-medium hover:underline">
          Agendar primeira sessão
        </Link>
      )}
    </div>
  )
}
