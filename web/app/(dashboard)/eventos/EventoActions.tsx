'use client'

import { useState, useTransition } from 'react'
import { categorizarEventoAction, marcarEventoLidoAction } from '@/app/actions/eventos'

const CATEGORIAS = [
  { value: 'crise', label: '🔴 Crise' },
  { value: 'recaida', label: '🟠 Recaída' },
  { value: 'progresso', label: '🟢 Progresso' },
  { value: 'cotidiano', label: '🔵 Cotidiano' },
  { value: 'outro', label: '⚪ Outro' },
]

interface Props {
  eventoId: string
  categoriaAtual: string
  intensidadeAtual: number
  lido: boolean
}

export default function EventoActions({ eventoId, categoriaAtual, intensidadeAtual, lido }: Props) {
  const [aberto, setAberto] = useState(false)
  const [categoria, setCategoria] = useState(categoriaAtual)
  const [intensidade, setIntensidade] = useState(intensidadeAtual)
  const [isPending, startTransition] = useTransition()

  function salvar() {
    startTransition(async () => {
      await categorizarEventoAction(eventoId, { categoria, intensidade_emocional: intensidade })
      setAberto(false)
    })
  }

  function marcarLido() {
    startTransition(() => marcarEventoLidoAction(eventoId))
  }

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      {!lido && (
        <button
          onClick={marcarLido}
          disabled={isPending}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Marcar lido
        </button>
      )}
      <button
        onClick={() => setAberto(!aberto)}
        className="text-xs text-brand-600 hover:text-brand-700 transition-colors font-medium"
      >
        Categorizar
      </button>

      {aberto && (
        <div className="absolute z-10 mt-6 bg-white border border-gray-200 rounded-2xl shadow-lg p-4 w-64 space-y-3">
          <p className="text-xs font-semibold text-gray-700">Categoria</p>
          <div className="grid grid-cols-1 gap-1">
            {CATEGORIAS.map(c => (
              <button
                key={c.value}
                onClick={() => setCategoria(c.value)}
                className={`text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${categoria === c.value ? 'bg-brand-50 text-brand-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Intensidade: {intensidade}/10</p>
            <input type="range" min={1} max={10} value={intensidade} onChange={e => setIntensidade(Number(e.target.value))} className="w-full accent-brand-600" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAberto(false)} className="flex-1 text-xs border border-gray-200 py-1.5 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={salvar} disabled={isPending} className="flex-1 text-xs bg-brand-600 text-white py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-60">
              {isPending ? '…' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
