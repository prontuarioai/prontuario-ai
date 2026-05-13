'use client'

import { useTransition } from 'react'
import { marcarTodosLidosAction } from '@/app/actions/eventos'

export default function MarcarTodosButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(marcarTodosLidosAction)}
      disabled={isPending}
      className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60"
    >
      {isPending ? 'Marcando…' : 'Marcar todos como lidos'}
    </button>
  )
}
