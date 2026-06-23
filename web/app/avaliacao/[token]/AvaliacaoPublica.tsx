'use client'

import { useState } from 'react'

interface Props {
  token: string
  googlePlaceId?: string | null
}

export default function AvaliacaoPublica({ token, googlePlaceId }: Props) {
  const [nota, setNota] = useState(0)
  const [hovering, setHovering] = useState(0)
  const [comentario, setComentario] = useState('')
  const [step, setStep] = useState<'avaliacao' | 'google' | 'done'>('avaliacao')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!nota) { setError('Selecione uma nota.'); return }
    setLoading(true)
    setError('')

    const res = await fetch('/api/avaliacoes/responder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, nota, comentario }),
    })

    if (!res.ok) {
      setError('Erro ao enviar. Tente novamente.')
      setLoading(false)
      return
    }

    if (nota >= 4 && googlePlaceId) {
      setStep('google')
    } else {
      setStep('done')
    }
    setLoading(false)
  }

  if (step === 'google') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-5">
        <p className="text-4xl">🌟</p>
        <h2 className="text-xl font-bold text-gray-900">Que ótimo!</h2>
        <p className="text-sm text-gray-500">
          Você avaliou com {nota} estrela{nota > 1 ? 's' : ''}. Que tal compartilhar sua experiência no Google também?
          Ajuda muito outros pacientes a encontrarem este profissional!
        </p>
        <div className="flex flex-col gap-3">
          <a
            href={`https://search.google.com/local/writereview?placeid=${googlePlaceId}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setTimeout(() => setStep('done'), 2000)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
            </svg>
            Avaliar no Google
          </a>
          <button
            onClick={() => setStep('done')}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Agora não
          </button>
        </div>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-4">
        <p className="text-5xl">💙</p>
        <h2 className="text-xl font-bold text-gray-900">Obrigado pelo feedback!</h2>
        <p className="text-sm text-gray-500">Sua avaliação foi enviada. Até a próxima sessão!</p>
      </div>
    )
  }

  const displayNota = hovering || nota

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
      {/* Estrelas */}
      <div className="text-center space-y-3">
        <p className="text-sm text-gray-600">Toque nas estrelas para avaliar</p>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <button
              key={i}
              onMouseEnter={() => setHovering(i)}
              onMouseLeave={() => setHovering(0)}
              onClick={() => setNota(i)}
              className="transition-transform hover:scale-110 active:scale-95"
            >
              <svg
                className={`w-10 h-10 transition-colors ${i <= displayNota ? 'text-amber-400' : 'text-gray-200'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
        {displayNota > 0 && (
          <p className="text-sm font-medium text-gray-700">
            {['', 'Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'][displayNota]}
          </p>
        )}
      </div>

      {/* Comentário */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Comentário <span className="text-gray-400">(opcional)</span>
        </label>
        <textarea
          value={comentario}
          onChange={e => setComentario(e.target.value)}
          rows={4}
          placeholder="O que achou da sessão? O que poderia melhorar?"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-200">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !nota}
        className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? 'Enviando…' : 'Enviar avaliação'}
      </button>
    </div>
  )
}
