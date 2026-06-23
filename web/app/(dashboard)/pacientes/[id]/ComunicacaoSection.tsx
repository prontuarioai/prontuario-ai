'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { enviarMensagemPacienteAction } from '@/app/actions/comunicacao'

interface Evento {
  id: string
  mensagem: string
  direcao: string
  categoria: string | null
  intensidade_emocional: number | null
  created_at: string
}

const categoriaLabel: Record<string, string> = {
  crise: '⚠️ Crise',
  recaida: '↩️ Recaída',
  progresso: '✨ Progresso',
  cotidiano: '💬 Cotidiano',
  outro: '📌 Outro',
}

const categoriaColor: Record<string, string> = {
  crise: 'bg-red-100 text-red-700',
  recaida: 'bg-amber-100 text-amber-700',
  progresso: 'bg-green-100 text-green-700',
  cotidiano: 'bg-gray-100 text-gray-600',
  outro: 'bg-gray-100 text-gray-600',
}

export default function ComunicacaoSection({ pacienteId, eventos }: { pacienteId: string; eventos: Evento[] }) {
  const [texto, setTexto] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [eventos.length])

  function handleEnviar(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return
    const msg = texto
    setTexto('')
    setError('')
    startTransition(async () => {
      const result = await enviarMensagemPacienteAction(pacienteId, msg)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
      <h2 className="font-semibold text-gray-900">Comunicação via WhatsApp</h2>

      {eventos.length === 0 ? (
        <p className="text-sm text-gray-400">Nenhuma mensagem ainda. Quando o paciente enviar mensagens pelo WhatsApp elas aparecerão aqui.</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {[...eventos].reverse().map(ev => (
            <div
              key={ev.id}
              className={`flex ${ev.direcao === 'saida' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                ev.direcao === 'saida'
                  ? 'bg-brand-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{ev.mensagem}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-xs ${ev.direcao === 'saida' ? 'text-brand-200' : 'text-gray-400'}`}>
                    {new Date(ev.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {ev.direcao === 'entrada' && ev.categoria && ev.categoria !== 'cotidiano' && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${categoriaColor[ev.categoria] ?? ''}`}>
                      {categoriaLabel[ev.categoria] ?? ev.categoria}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={handleEnviar} className="flex gap-2">
        <input
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Enviar mensagem pelo WhatsApp…"
          className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          disabled={isPending}
        />
        <button
          type="submit"
          disabled={isPending || !texto.trim()}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          {isPending ? '…' : 'Enviar'}
        </button>
      </form>
    </div>
  )
}
