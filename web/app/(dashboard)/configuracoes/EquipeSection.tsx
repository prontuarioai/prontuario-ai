'use client'

import { useState } from 'react'
import { convidarMembroAction, removerMembroAction } from '@/app/actions/clinica'

interface Membro {
  id: string
  nome: string
  email: string
  role: string
}

interface Convite {
  id: string
  email: string
  nome: string | null
  role: string
  token: string
  created_at: string
}

interface Props {
  membros: Membro[]
  convites: Convite[]
  currentUserId: string
}

const roleLabel: Record<string, string> = {
  admin:        'Admin',
  profissional: 'Profissional',
  secretaria:   'Secretária',
}

export default function EquipeSection({ membros, convites, currentUserId }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copiedToken, setCopiedToken] = useState('')

  async function handleConvidar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    const formData = new FormData(e.currentTarget)
    const result = await convidarMembroAction(formData)
    setLoading(false)
    if (result?.error) { setError(result.error); return }
    const link = `${location.origin}/convite/${result.token}`
    setSuccess(link)
    setShowForm(false)
  }

  async function handleRemover(id: string) {
    if (!confirm('Remover este membro da clínica?')) return
    await removerMembroAction(id)
  }

  function copyLink(token: string) {
    const link = `${location.origin}/convite/${token}`
    navigator.clipboard.writeText(link)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(''), 2000)
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Equipe</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Membros e convites pendentes</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="text-sm bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2 rounded-xl transition-colors"
        >
          + Convidar
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800 break-all">
          <p className="font-medium mb-1">Link de convite gerado:</p>
          <p className="font-mono">{success}</p>
          <p className="mt-1 text-green-600">Compartilhe este link com a pessoa convidada.</p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleConvidar} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Nome</label>
              <input name="nome" type="text" placeholder="Dr. João Silva"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Email *</label>
              <input name="email" type="email" required placeholder="email@exemplo.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Cargo *</label>
            <select name="role" required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">Selecionar cargo</option>
              <option value="profissional">Profissional de Saúde</option>
              <option value="secretaria">Secretária</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-700 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2 transition-colors">
              {loading ? 'Gerando…' : 'Gerar link de convite'}
            </button>
          </div>
        </form>
      )}

      {/* Membros ativos */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Membros</p>
        {membros.map(m => (
          <div key={m.id} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 dark:bg-gray-900">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm shrink-0">
              {m.nome.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.nome}</p>
              <p className="text-xs text-gray-400 truncate">{m.email}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              m.role === 'admin'        ? 'bg-purple-50 text-purple-700' :
              m.role === 'profissional' ? 'bg-brand-50 text-brand-700' :
                                          'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
              {roleLabel[m.role] ?? m.role}
            </span>
            {m.id !== currentUserId && (
              <button onClick={() => handleRemover(m.id)}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-1">
                Remover
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Convites pendentes */}
      {convites.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Convites pendentes</p>
          {convites.map(c => (
            <div key={c.id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{c.nome || c.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{c.email} · {roleLabel[c.role]}</p>
              </div>
              <button
                onClick={() => copyLink(c.token)}
                className="text-xs text-brand-600 hover:text-brand-800 font-medium whitespace-nowrap"
              >
                {copiedToken === c.token ? 'Copiado!' : 'Copiar link'}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
