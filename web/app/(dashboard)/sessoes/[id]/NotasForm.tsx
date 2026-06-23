'use client'

import { useState, useTransition } from 'react'
import { salvarNotasAction } from '@/app/actions/sessoes'

export default function NotasForm({ sessaoId, notasIniciais }: { sessaoId: string; notasIniciais: string }) {
  const [notas, setNotas] = useState(notasIniciais)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setSaved(false)
    startTransition(async () => {
      await salvarNotasAction(sessaoId, notas)
      setSaved(true)
    })
  }

  return (
    <div className="space-y-3">
      <textarea
        value={notas}
        onChange={e => { setNotas(e.target.value); setSaved(false) }}
        rows={6}
        placeholder="Anotações clínicas, observações, pontos importantes…"
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium px-5 py-2 rounded-xl transition-colors text-sm"
        >
          {isPending ? 'Salvando…' : 'Salvar notas'}
        </button>
        {saved && <span className="text-sm text-green-600">Salvo ✓</span>}
      </div>
    </div>
  )
}
