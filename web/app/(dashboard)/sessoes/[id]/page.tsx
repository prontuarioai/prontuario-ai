import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cancelarSessaoAction } from '@/app/actions/sessoes'
import NotasForm from './NotasForm'
import AudioUploadSection from './AudioUploadSection'
import TranscricaoPanel from '@/components/sessoes/TranscricaoPanel'

export default async function SessaoPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: sessao } = await supabase
    .from('sessoes')
    .select('*, pacientes(id, nome, whatsapp, email)')
    .eq('id', params.id)
    .eq('terapeuta_id', user!.id)
    .single()

  if (!sessao) notFound()

  const [{ data: triagem }, { data: avaliacao }, { data: resumo }, { data: transcricao }] = await Promise.all([
    supabase.from('triagens').select('*').eq('sessao_id', params.id).maybeSingle(),
    supabase.from('avaliacoes_pos_sessao').select('*').eq('sessao_id', params.id).maybeSingle(),
    supabase.from('resumos_ia').select('*').eq('sessao_id', params.id).maybeSingle(),
    supabase.from('transcricoes').select('status, texto').eq('sessao_id', params.id).maybeSingle(),
  ])

  const cancelarAction = cancelarSessaoAction.bind(null, params.id)
  const paciente = (sessao as any).pacientes

  const duracao = Math.round(
    (new Date(sessao.fim).getTime() - new Date(sessao.inicio).getTime()) / 60000
  )

  const STATUS_COLOR: Record<string, string> = {
    agendada: 'bg-blue-50 text-blue-700 border-blue-200',
    realizada: 'bg-green-50 text-green-700 border-green-200',
    cancelada: 'bg-gray-100 text-gray-500 border-gray-200',
    faltou: 'bg-red-50 text-red-600 border-red-200',
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/sessoes" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Sessões
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            Sessão — {paciente?.nome}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date(sessao.inicio).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' · '}
            {new Date(sessao.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            {' – '}
            {new Date(sessao.fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            {' · '}{duracao} min
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-3 py-1 rounded-full border ${STATUS_COLOR[sessao.status] ?? ''}`}>
            {sessao.status.charAt(0).toUpperCase() + sessao.status.slice(1)}
          </span>
          {sessao.status === 'agendada' && (
            <form action={cancelarAction}>
              <button
                type="submit"
                className="text-sm text-red-500 border border-red-200 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors"
                onClick={e => { if (!confirm('Cancelar sessão?')) e.preventDefault() }}
              >
                Cancelar
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Triagem pré-sessão */}
          {triagem && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Triagem pré-sessão</h2>
                {triagem.risco_detectado && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    triagem.risco_detectado === 'alto' ? 'bg-red-100 text-red-700'
                    : triagem.risco_detectado === 'medio' ? 'bg-amber-100 text-amber-700'
                    : 'bg-green-100 text-green-700'
                  }`}>
                    Risco {triagem.risco_detectado}
                  </span>
                )}
              </div>
              {triagem.respondida_em ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">Humor geral:</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-teal-500 h-2 rounded-full"
                        style={{ width: `${(triagem.humor_geral / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{triagem.humor_geral}/10</span>
                  </div>
                  {triagem.eventos_relevantes && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Eventos relevantes</p>
                      <p className="text-sm text-gray-700">{triagem.eventos_relevantes}</p>
                    </div>
                  )}
                  {triagem.foco_sessao && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Foco da sessão</p>
                      <p className="text-sm text-gray-700">{triagem.foco_sessao}</p>
                    </div>
                  )}
                  <Link href={`/triagens/${triagem.id}`} className="text-xs text-teal-600 hover:underline font-medium">
                    Ver análise completa →
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  {triagem.enviada_em ? 'Aguardando resposta do paciente.' : 'Será enviada no dia anterior à sessão.'}
                </p>
              )}
            </div>
          )}

          {/* Upload de áudio + transcrição IA */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Gravação da sessão</h2>
            {!transcricao ? (
              <AudioUploadSection sessaoId={params.id} />
            ) : (
              <TranscricaoPanel
                sessaoId={params.id}
                transcricaoInicial={transcricao}
                resumoInicial={resumo}
              />
            )}
          </div>

          {/* Notas do terapeuta */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Notas da sessão</h2>
            <NotasForm sessaoId={params.id} notasIniciais={sessao.notas ?? ''} />
          </div>
        </div>

        {/* Painel lateral */}
        <div className="space-y-4">
          {/* Info do paciente */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h2 className="font-semibold text-gray-900">Paciente</h2>
            <Link
              href={`/pacientes/${paciente?.id}`}
              className="flex items-center gap-3 hover:text-teal-700 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm">
                {paciente?.nome.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{paciente?.nome}</p>
                <p className="text-xs text-gray-400">{paciente?.email ?? paciente?.whatsapp ?? '—'}</p>
              </div>
            </Link>
          </div>

          {/* Detalhes da sessão */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h2 className="font-semibold text-gray-900">Detalhes</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Modalidade</dt>
                <dd className="text-gray-900 font-medium capitalize">{sessao.modalidade}</dd>
              </div>
              {sessao.valor && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Valor</dt>
                  <dd className="text-gray-900 font-medium">
                    {Number(sessao.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </dd>
                </div>
              )}
              {sessao.link_meet && (
                <div>
                  <dt className="text-gray-500 mb-1">Link</dt>
                  <a href={sessao.link_meet} target="_blank" rel="noopener noreferrer"
                    className="text-teal-600 hover:underline text-xs break-all">
                    {sessao.link_meet}
                  </a>
                </div>
              )}
            </dl>
          </div>

          {/* Avaliação pós-sessão */}
          {avaliacao && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2">
              <h2 className="font-semibold text-gray-900">Avaliação pós-sessão</h2>
              {avaliacao.respondida_em ? (
                <>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <svg key={i} className={`w-5 h-5 ${i <= (avaliacao.nota ?? 0) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  {avaliacao.comentario && (
                    <p className="text-sm text-gray-600 italic">"{avaliacao.comentario}"</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400">Aguardando resposta.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
