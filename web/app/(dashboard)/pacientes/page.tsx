import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ImportarContatosButton from './ImportarContatosButton'

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const status = searchParams.status !== 'inativos'
  let query = supabase
    .from('pacientes')
    .select('id, nome, email, whatsapp, created_at, ativo')
    .eq('terapeuta_id', user!.id)
    .eq('ativo', status)
    .order('nome')

  if (searchParams.q) {
    query = query.ilike('nome', `%${searchParams.q}%`)
  }

  const { data: pacientes } = await query

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pacientes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{pacientes?.length ?? 0} encontrados</p>
        </div>
        <div className="flex items-center gap-2">
          <ImportarContatosButton />
          <Link
            href="/pacientes/novo"
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            + Novo paciente
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3">
        <PacientesSearch q={searchParams.q} />
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
          {[
            { label: 'Ativos', value: 'ativos' },
            { label: 'Inativos', value: 'inativos' },
          ].map(opt => (
            <Link
              key={opt.value}
              href={`/pacientes?status=${opt.value}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                (searchParams.status ?? 'ativos') === opt.value
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Lista */}
      {pacientes && pacientes.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-50">
          {pacientes.map(p => (
            <Link
              key={p.id}
              href={`/pacientes/${p.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:bg-gray-900 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
            >
              <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm shrink-0">
                {p.nome.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{p.nome}</p>
                <p className="text-xs text-gray-400 truncate">{p.email ?? p.whatsapp ?? '—'}</p>
              </div>
              <div className="text-xs text-gray-400">
                Desde {new Date(p.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
              </div>
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <p className="text-4xl mb-3">👤</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {searchParams.q ? 'Nenhum paciente encontrado.' : 'Nenhum paciente cadastrado ainda.'}
          </p>
          {!searchParams.q && (
            <Link href="/pacientes/novo" className="mt-4 inline-block text-sm text-brand-600 font-medium hover:underline">
              Cadastrar primeiro paciente
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function PacientesSearch({ q }: { q?: string }) {
  return (
    <form className="flex-1">
      <input
        name="q"
        defaultValue={q}
        placeholder="Buscar por nome…"
        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </form>
  )
}
