'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

export default function SessoesSearch({ q }: { q?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (e.target.value) params.set('q', e.target.value)
      else params.delete('q')
      router.push(`/sessoes?${params.toString()}`)
    })
  }

  return (
    <input
      defaultValue={q}
      onChange={handleChange}
      placeholder="Buscar por paciente…"
      className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
    />
  )
}
