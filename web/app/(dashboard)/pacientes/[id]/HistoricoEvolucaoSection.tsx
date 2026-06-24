'use client'

import { useState } from 'react'
import Link from 'next/link'

type TipoFiltro = 'todos' | 'triagem' | 'avaliacao' | 'mensagem'

interface Triagem {
  id: string
  humor_geral: number | null
  eventos_relevantes: string | null
  foco_sessao: string | null
  risco_detectado: string | null
  respondida_em: string
  sessoes?: { inicio: string } | null
}

interface Avaliacao {
  id: string
  nota: number | null
  comentario: string | null
  respondida_em: string | null
  sessoes?: { inicio: string } | null
}

interface Evento {
  id: string
  mensagem: string
  direcao: string
  categoria: string | null
  intensidade_emocional: number | null
  created_at: string
  fonte?: string | null
}

interface Props {
  triagens: Triagem[]
  avaliacoes: Avaliacao[]
  eventos: Evento[]
}

const RISCO_BADGE: Record<string, string> = {
  alto:  'bg-red-100 text-red-700',
  medio: 'bg-amber-100 text-amber-700',
  baixo: 'bg-green-100 text-green-700',
}

const CATEGORIA_BADGE: Record<string, string> = {
  crise:    'bg-red-100 text-red-700',
  recaida:  'bg-amber-100 text-amber-700',
  progresso:'bg-green-100 text-green-700',
  cotidiano:'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  outro:    'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
}

const CATEGORIA_LABEL: Record<string, string> = {
  crise:    '⚠️ Crise',
  recaida:  '↩️ Recaída',
  progresso:'✨ Progresso',
  cotidiano:'💬 Cotidiano',
  outro:    '📌 Outro',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function HistoricoEvolucaoSection({ triagens, avaliacoes, eventos }: Props) {
  const [filtro, setFiltro] = useState<TipoFiltro>('todos')

  // Unifica tudo em uma timeline com tipo
  const itens = [
    ...triagens.map(t => ({
      tipo: 'triagem' as const,
      data: t.respondida_em,
      payload: t,
    })),
    ...avaliacoes.filter(a => a.respondida_em).map(a => ({
      tipo: 'avaliacao' as const,
      data: a.respondida_em!,
      payload: a,
    })),
    ...eventos.map(e => ({
      tipo: 'mensagem' as const,
      data: e.created_at,
      payload: e,
    })),
  ]
    .filter(item => filtro === 'todos' || item.tipo === filtro)
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  const filtros: { key: TipoFiltro; label: string }[] = [
    { key: 'todos',    label: 'Todos' },
    { key: 'triagem',  label: `Triagens (${triagens.length})` },
    { key: 'avaliacao',label: `Avaliações (${avaliacoes.filter(a => a.respondida_em).length})` },
    { key: 'mensagem', label: `Mensagens (${eventos.length})` },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-semibold text-gray-900 dark:text-white">Histórico e Evolução</h2>
        <div className="flex gap-1 flex-wrap">
          {filtros.map(f => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={[
                'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
                filtro === f.key
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300',
              ].join(' ')}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {itens.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-2xl mb-2">📋</p>
          <p className="text-sm text-gray-400">Nenhum registro ainda.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Linha vertical */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100 dark:bg-gray-700" />

          <div className="space-y-3 pl-10">
            {itens.map((item, i) => {
              // ── TRIAGEM ──
              if (item.tipo === 'triagem') {
                const t = item.payload as Triagem
                const riscoBg = RISCO_BADGE[t.risco_detectado ?? 'baixo'] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                return (
                  <div key={`triagem-${t.id}`} className="relative">
                    <div className="absolute -left-6 top-2 w-3 h-3 rounded-full bg-blue-400 border-2 border-white" />
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-blue-700">📋 Triagem pré-sessão</span>
                        {t.risco_detectado && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riscoBg}`}>
                            {t.risco_detectado === 'alto' ? '⚠️ Risco alto' : t.risco_detectado === 'medio' ? 'Risco médio' : 'Risco baixo'}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 ml-auto">{formatDate(t.respondida_em)}</span>
                      </div>
                      {t.humor_geral != null && (
                        <p className="text-xs text-gray-600 dark:text-gray-300">Humor geral: <strong>{t.humor_geral}/10</strong></p>
                      )}
                      {t.eventos_relevantes && (
                        <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">"{t.eventos_relevantes}"</p>
                      )}
                      {t.foco_sessao && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Foco: {t.foco_sessao}</p>
                      )}
                    </div>
                  </div>
                )
              }

              // ── AVALIAÇÃO PÓS-SESSÃO ──
              if (item.tipo === 'avaliacao') {
                const a = item.payload as Avaliacao
                const estrelas = '⭐'.repeat(a.nota ?? 0)
                const notaBg = (a.nota ?? 0) >= 4 ? 'bg-green-50 border-green-100' : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700'
                return (
                  <div key={`av-${a.id}`} className="relative">
                    <div className="absolute -left-6 top-2 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
                    <div className={`border rounded-xl p-3 space-y-1 ${notaBg}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-green-700">✅ Avaliação pós-consulta</span>
                        <span className="text-sm">{estrelas}</span>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{a.nota}/5</span>
                        <span className="text-xs text-gray-400 ml-auto">{formatDate(a.respondida_em!)}</span>
                      </div>
                      {a.comentario && (
                        <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">"{a.comentario}"</p>
                      )}
                    </div>
                  </div>
                )
              }

              // ── MENSAGEM WhatsApp ──
              if (item.tipo === 'mensagem') {
                const e = item.payload as Evento
                const entrada = e.direcao === 'entrada'
                const catBg = CATEGORIA_BADGE[e.categoria ?? 'outro'] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                const fonteLabel = e.fonte === 'secretaria' ? '📅 Secretária' : '👨‍⚕️ Profissional'
                return (
                  <div key={`ev-${e.id}`} className="relative">
                    <div className={`absolute -left-6 top-2 w-3 h-3 rounded-full border-2 border-white ${entrada ? 'bg-brand-400' : 'bg-gray-300'}`} />
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 shadow-sm space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-400">{entrada ? '📨 Recebido' : '📤 Enviado'} · {fonteLabel}</span>
                        {e.categoria && e.categoria !== 'cotidiano' && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catBg}`}>
                            {CATEGORIA_LABEL[e.categoria]}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 ml-auto">{formatDate(e.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{e.mensagem}</p>
                    </div>
                  </div>
                )
              }

              return null
            })}
          </div>
        </div>
      )}
    </div>
  )
}
