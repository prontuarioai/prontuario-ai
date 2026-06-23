'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { aceitarConviteAction } from '@/app/actions/clinica'

interface Props {
  token: string
  clinicaNome: string
  role: string
}

const roleLabel: Record<string, string> = {
  profissional: 'Profissional de Saúde',
  secretaria: 'Secretária',
}

export default function AcceptForm({ token, clinicaNome, role }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAccept() {
    setLoading(true)
    setError('')
    const result = await aceitarConviteAction(token)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    router.replace('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 text-center space-y-1">
        <p className="text-xs text-brand-600 font-medium uppercase tracking-wide">Convite para</p>
        <p className="text-lg font-bold text-brand-900">{clinicaNome}</p>
        <p className="text-sm text-brand-700">Cargo: {roleLabel[role] ?? role}</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-center">
          {error}
        </p>
      )}

      <button
        onClick={handleAccept}
        disabled={loading}
        className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? 'Aceitando…' : 'Aceitar convite e entrar'}
      </button>

      <p className="text-center text-xs text-gray-400">
        Não reconhece este convite?{' '}
        <a href="/login" className="text-brand-600 underline">Voltar ao login</a>
      </p>
    </div>
  )
}
