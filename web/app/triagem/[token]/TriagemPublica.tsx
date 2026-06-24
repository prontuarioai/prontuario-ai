'use client'

import { useState } from 'react'

interface Props {
  token: string
  triagemId: string
}

export default function TriagemPublica({ token }: Props) {
  const [step, setStep] = useState(1)
  const [humor, setHumor] = useState(5)
  const [eventos, setEventos] = useState('')
  const [foco, setFoco] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/triagens/responder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, humor_geral: humor, eventos_relevantes: eventos, foco_sessao: foco }),
    })
    if (!res.ok) {
      setError('Erro ao enviar. Tente novamente.')
      setLoading(false)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center space-y-4">
        <p className="text-5xl">🌿</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Respostas enviadas!</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Seu terapeuta receberá um resumo antes da sessão. Até logo!
        </p>
      </div>
    )
  }

  const humorLabels: Record<number, string> = {
    1: '😔 Muito mal', 2: '😟 Mal', 3: '😕 Razoável', 4: '🙁 Abaixo do normal',
    5: '😐 Neutro', 6: '🙂 Um pouco bem', 7: '😊 Bem', 8: '😄 Muito bem',
    9: '🥰 Ótimo', 10: '🤩 Excelente',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-6">
      {/* Indicador de passo */}
      <div className="flex gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? 'bg-brand-500' : 'bg-gray-100 dark:bg-gray-700'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Como você está se sentindo hoje?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Selecione um número de 1 a 10</p>
          </div>
          <div className="space-y-4">
            <div className="flex justify-center">
              <span className="text-4xl font-bold text-brand-600">{humor}</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={humor}
              onChange={e => setHumor(Number(e.target.value))}
              className="w-full accent-brand-600"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>1 — Muito mal</span>
              <span>10 — Excelente</span>
            </div>
            <div className="text-center text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-xl py-2">
              {humorLabels[humor]}
            </div>
          </div>
          <button
            onClick={() => setStep(2)}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Continuar
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Aconteceu algo relevante desde a última sessão?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pode ser algo positivo ou negativo. Campo opcional.</p>
          </div>
          <textarea
            value={eventos}
            onChange={e => setEventos(e.target.value)}
            rows={5}
            placeholder="Ex: tive uma discussão no trabalho, consegui dormir melhor, sinto ansiedade ao sair de casa…"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:bg-gray-900 transition-colors">
              Voltar
            </button>
            <button onClick={() => setStep(3)} className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1">O que você gostaria de trabalhar hoje?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Qual é o foco ou intenção para esta sessão? Campo opcional.</p>
          </div>
          <textarea
            value={foco}
            onChange={e => setFoco(e.target.value)}
            rows={5}
            placeholder="Ex: quero entender minha relação com minha mãe, quero trabalhar o medo de rejeição…"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-200">{error}</p>}
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:bg-gray-900 transition-colors">
              Voltar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              {loading ? 'Enviando…' : 'Enviar respostas'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
