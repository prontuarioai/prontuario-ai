import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function TriagemDetalhe({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: triagem } = await supabase
    .from('triagens')
    .select('*, pacientes(id, nome), sessoes(id, inicio)')
    .eq('id', params.id)
    .eq('terapeuta_id', user!.id)
    .single()

  if (!triagem) notFound()

  if (!triagem.lida_terapeuta) {
    await supabase.from('triagens').update({ lida_terapeuta: true }).eq('id', params.id)
    await supabase.from('notificacoes')
      .update({ lida: true })
      .eq('sessao_id', triagem.sessao_id)
      .eq('terapeuta_id', user!.id)
  }

  const analise = triagem.analise_ia as any
  const paciente = (triagem as any).pacientes
  const sessao = (triagem as any).sessoes

  const RISCO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    alto: { label: 'Risco alto', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
    medio: { label: 'Risco médio', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    baixo: { label: 'Risco baixo', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  }

  const risco = RISCO_CONFIG[triagem.risco_detectado ?? 'baixo']

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/triagens" className="text-sm text-gray-400 hover:text-gray-600 dark:text-gray-300 transition-colors">
          ← Triagens
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Triagem — {paciente?.nome}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Sessão em {sessao?.inicio && new Date(sessao.inicio).toLocaleDateString('pt-BR', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
            </p>
          </div>
          {sessao && (
            <Link
              href={`/sessoes/${sessao.id}`}
              className="text-sm text-brand-600 border border-brand-200 px-4 py-2 rounded-xl hover:bg-brand-50 transition-colors"
            >
              Ver sessão
            </Link>
          )}
        </div>
      </div>

      {/* Badge de risco */}
      {risco && (
        <div className={`rounded-2xl border p-4 ${risco.bg}`}>
          <p className={`font-semibold ${risco.color}`}>{risco.label}</p>
          {analise?.observacoes && (
            <p className={`text-sm mt-1 ${risco.color} opacity-80`}>{analise.observacoes}</p>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Respostas do paciente */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Respostas do paciente</h2>

          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Humor geral</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-brand-500 h-2.5 rounded-full"
                  style={{ width: `${(triagem.humor_geral / 10) * 100}%` }}
                />
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white w-8 text-right">{triagem.humor_geral}/10</span>
            </div>
          </div>

          {triagem.eventos_relevantes && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Eventos relevantes</p>
              <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{triagem.eventos_relevantes}</p>
            </div>
          )}

          {triagem.foco_sessao && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Foco desejado</p>
              <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{triagem.foco_sessao}</p>
            </div>
          )}

          <p className="text-xs text-gray-400">
            Respondido em {new Date(triagem.respondida_em).toLocaleString('pt-BR')}
          </p>
        </div>

        {/* Análise da IA */}
        {analise && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Análise por IA</h2>

            {analise.emocoes?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Emoções detectadas</p>
                <div className="flex flex-wrap gap-1.5">
                  {analise.emocoes.map((e: string) => (
                    <span key={e} className="bg-purple-50 text-purple-700 text-xs px-2.5 py-1 rounded-full">{e}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Valência emocional</p>
                  <span className="text-xs text-gray-400">{analise.valence > 0 ? '+' : ''}{analise.valence?.toFixed(2)}</span>
                </div>
                <div className="relative h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <div
                    className={`absolute h-2 rounded-full ${analise.valence >= 0 ? 'bg-green-400' : 'bg-red-400'}`}
                    style={{
                      left: analise.valence >= 0 ? '50%' : `${(analise.valence + 1) / 2 * 100}%`,
                      width: `${Math.abs(analise.valence) / 2 * 100}%`,
                    }}
                  />
                  <div className="absolute top-0 left-1/2 w-px h-2 bg-gray-300" />
                </div>
                <div className="flex justify-between text-xs text-gray-300 mt-0.5">
                  <span>Negativo</span><span>Positivo</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Ativação (arousal)</p>
                  <span className="text-xs text-gray-400">{analise.arousal > 0 ? '+' : ''}{analise.arousal?.toFixed(2)}</span>
                </div>
                <div className="relative h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <div
                    className="absolute h-2 rounded-full bg-brand-400"
                    style={{ width: `${((analise.arousal + 1) / 2) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-300 mt-0.5">
                  <span>Baixo</span><span>Alto</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
