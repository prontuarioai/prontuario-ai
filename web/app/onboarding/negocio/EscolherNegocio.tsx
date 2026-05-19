'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { salvarLocalNegocioAction } from './actions'

interface Local {
  nome: string
  placeId: string | null
}

export default function EscolherNegocio({ locais, redirectTo }: { locais: Local[]; redirectTo: string }) {
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const router = useRouter()

  function handleSalvar() {
    if (!selecionado) { setError('Selecione um negócio.'); return }
    setError('')
    startTransition(async () => {
      const res = await salvarLocalNegocioAction(selecionado)
      if (res?.error) setError(res.error)
      else router.push(redirectTo)
    })
  }

  return (
    <div className="space-y-4">
      {locais.map(local => (
        <button
          key={local.placeId ?? local.nome}
          onClick={() => setSelecionado(local.placeId ?? '')}
          className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-colors ${
            selecionado === local.placeId
              ? 'border-teal-500 bg-teal-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="font-medium text-gray-900">{local.nome}</p>
          {local.placeId && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{local.placeId}</p>
          )}
        </button>
      ))}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
      )}

      <div className="flex flex-col gap-2 pt-2">
        <button
          onClick={handleSalvar}
          disabled={isPending || !selecionado}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          {isPending ? 'Salvando…' : 'Usar este negócio'}
        </button>
        <button
          onClick={() => router.push(redirectTo)}
          className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
        >
          Pular por agora
        </button>
      </div>
    </div>
  )
}
