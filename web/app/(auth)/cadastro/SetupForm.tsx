'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { criarPerfilAction } from '@/app/actions/configuracoes'

export default function SetupForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const result = await criarPerfilAction(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    router.replace('/dashboard')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Nome completo
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
          placeholder="Dr. Maria Silva"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
      >
        {loading ? 'Salvando…' : 'Continuar para o dashboard'}
      </button>
    </form>
  )
}
