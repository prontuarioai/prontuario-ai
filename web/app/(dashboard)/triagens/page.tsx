import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function TriagensPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: triagens } = await supabase
    .from('triagens')
    .select('id, risco_detectado, lida_terapeuta, respondida_em, created_at, pacientes(nome), sessoes(inicio)')
    .eq('terapeuta_id', user!.id)
    .not('respondida_em', 'is', null)
    .order('respondida_em', { ascending: false })
    .limit(50)

  const RISCO_COLOR: Record<string, string> = {
    alto: 'bg-red-100 text-red-700',
    medio: 'bg-amber-100 text-amber-700',
    baixo: 'bg-green-100 text-green-700',
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Triagens</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Respostas pré-sessão dos pacientes</p>
      </div>

      {triagens && triagens.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-50">
          {triagens.map((t: any) => (
            <Link
              key={t.id}
              href={`/triagens/${t.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:bg-gray-900 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm">
                  {t.pacientes?.nome?.charAt(0).toUpperCase()}
                </div>
                {!t.lida_terapeuta && (
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-brand-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t.pacientes?.nome}</p>
                <p className="text-xs text-gray-400">
                  Sessão: {t.sessoes?.inicio && new Date(t.sessoes.inicio).toLocaleDateString('pt-BR')}
                  {' · '}
                  {new Date(t.respondida_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {t.risco_detectado && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${RISCO_COLOR[t.risco_detectado] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                  {t.risco_detectado.charAt(0).toUpperCase() + t.risco_detectado.slice(1)}
                </span>
              )}
              <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <p className="text-4xl mb-3">🛡️</p>
          <p className="text-sm text-gray-400">Nenhuma triagem respondida ainda.</p>
          <p className="text-xs text-gray-400 mt-1">As triagens são enviadas automaticamente antes de cada sessão.</p>
        </div>
      )}
    </div>
  )
}
