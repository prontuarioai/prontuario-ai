'use client'

import { useEffect, useState } from 'react'

interface Transcricao {
  status: string
  texto: string | null
}

interface Resumo {
  principais_temas: string[]
  emocoes_detectadas: string[]
  pontos_trabalhados: string
  plano_proxima_sessao: string
  alertas: string[]
}

interface Props {
  sessaoId: string
  transcricaoInicial: Transcricao | null
  resumoInicial: Resumo | null
}

export default function TranscricaoPanel({ sessaoId, transcricaoInicial, resumoInicial }: Props) {
  const [transcricao, setTranscricao] = useState(transcricaoInicial)
  const [resumo, setResumo] = useState(resumoInicial)
  const [polling, setPolling] = useState(transcricaoInicial?.status === 'processando' || transcricaoInicial?.status === 'pendente')

  useEffect(() => {
    if (!polling) return
    const interval = setInterval(async () => {
      const res = await fetch(`/api/sessoes/${sessaoId}/status`)
      const data = await res.json()
      setTranscricao(data.transcricao)
      setResumo(data.resumo)
      if (data.transcricao?.status === 'concluido' || data.transcricao?.status === 'erro') {
        setPolling(false)
        clearInterval(interval)
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [polling, sessaoId])

  if (!transcricao) return null

  if (transcricao.status === 'pendente' || transcricao.status === 'processando') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {transcricao.status === 'pendente' ? 'Aguardando processamento…' : 'Transcrevendo áudio com IA…'}
            </p>
            <p className="text-xs text-gray-400">Isso pode levar alguns minutos.</p>
          </div>
        </div>
      </div>
    )
  }

  if (transcricao.status === 'erro') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
        <p className="text-sm font-medium text-red-800">Erro na transcrição</p>
        <p className="text-xs text-red-600 mt-1">Tente fazer o upload novamente.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Resumo IA */}
      {resumo && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span>✨</span> Resumo gerado por IA
          </h3>

          {resumo.alertas?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-red-800 mb-1">⚠️ Alertas</p>
              {resumo.alertas.map((a, i) => (
                <p key={i} className="text-sm text-red-700">{a}</p>
              ))}
            </div>
          )}

          {resumo.principais_temas?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Principais temas</p>
              <div className="flex flex-wrap gap-2">
                {resumo.principais_temas.map(t => (
                  <span key={t} className="bg-teal-50 text-teal-700 text-xs px-2.5 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          )}

          {resumo.emocoes_detectadas?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Emoções detectadas</p>
              <div className="flex flex-wrap gap-2">
                {resumo.emocoes_detectadas.map(e => (
                  <span key={e} className="bg-purple-50 text-purple-700 text-xs px-2.5 py-1 rounded-full">{e}</span>
                ))}
              </div>
            </div>
          )}

          {resumo.pontos_trabalhados && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Pontos trabalhados</p>
              <p className="text-sm text-gray-700">{resumo.pontos_trabalhados}</p>
            </div>
          )}

          {resumo.plano_proxima_sessao && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Plano para próxima sessão</p>
              <p className="text-sm text-gray-700">{resumo.plano_proxima_sessao}</p>
            </div>
          )}
        </div>
      )}

      {/* Transcrição completa */}
      {transcricao.texto && (
        <details className="bg-white rounded-2xl border border-gray-100 p-5">
          <summary className="text-sm font-medium text-gray-700 cursor-pointer select-none">
            Ver transcrição completa
          </summary>
          <div className="mt-4 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap border-t border-gray-50 pt-4 max-h-64 overflow-y-auto">
            {transcricao.texto}
          </div>
        </details>
      )}
    </div>
  )
}
