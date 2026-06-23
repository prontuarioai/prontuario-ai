'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Usuario {
  id: string
  nome: string
  email: string
  plano: string
  plano_cortesia: boolean
  trial_fim: string
  created_at: string
  role: string
  clinica_nome: string | null
}

interface Stats {
  totalUsuarios: number
  totalAtivos: number
  totalCortesia: number
  totalTrial: number
}

export default function SuperAdminClient({
  usuarios,
  stats,
  q,
}: {
  usuarios: Usuario[]
  stats: Stats
  q: string
}) {
  const router = useRouter()
  const [busca, setBusca] = useState(q)
  const [isPending, startTransition] = useTransition()
  const [toggling, setToggling] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ id: string; msg: string } | null>(null)

  function handleBusca(e: React.FormEvent) {
    e.preventDefault()
    router.push(`/super-admin?q=${encodeURIComponent(busca)}`)
  }

  async function toggleCortesia(userId: string, ativar: boolean) {
    setToggling(userId)
    setFeedback(null)
    try {
      const res = await fetch('/api/super-admin/toggle-cortesia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ativar }),
      })
      const data = await res.json()
      if (data.ok) {
        setFeedback({ id: userId, msg: ativar ? '✅ Cortesia ativada' : '🔴 Cortesia removida' })
        router.refresh()
      } else {
        setFeedback({ id: userId, msg: `Erro: ${data.error}` })
      }
    } catch {
      setFeedback({ id: userId, msg: 'Erro de conexão' })
    } finally {
      setToggling(null)
    }
  }

  const planoBadge = (u: Usuario) => {
    if (u.plano_cortesia) return <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">🎁 Cortesia</span>
    if (u.plano === 'ativo')   return <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">Ativo</span>
    if (u.plano === 'trial')   return <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">Trial</span>
    return <span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">Inativo</span>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">⚙️ Super Admin</h1>
            <p className="text-xs text-gray-400">Painel interno — Agenda Online AI</p>
          </div>
          <a href="/dashboard" className="text-sm text-brand-600 hover:underline">← Voltar ao dashboard</a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Contas (admin)', value: stats.totalUsuarios, color: 'text-gray-700' },
            { label: 'Plano ativo',   value: stats.totalAtivos,   color: 'text-green-600' },
            { label: 'Trial',         value: stats.totalTrial,    color: 'text-amber-600' },
            { label: 'Cortesia 🎁',  value: stats.totalCortesia, color: 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Busca */}
        <form onSubmit={handleBusca} className="flex gap-2">
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome ou email…"
            className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            Buscar
          </button>
          {q && (
            <a href="/super-admin" className="border border-gray-200 text-gray-600 text-sm px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
              Limpar
            </a>
          )}
        </form>

        {/* Tabela de usuários */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Usuário</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Clínica</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Plano</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Cadastro</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Ação</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400 text-sm">
                      {q ? 'Nenhum usuário encontrado.' : 'Nenhuma conta cadastrada ainda.'}
                    </td>
                  </tr>
                )}
                {usuarios.map(u => (
                  <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{u.nome}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.clinica_nome ?? '—'}</td>
                    <td className="px-4 py-3">{planoBadge(u)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {feedback?.id === u.id && (
                        <span className="text-xs text-gray-500 mr-3">{feedback.msg}</span>
                      )}
                      {u.plano_cortesia ? (
                        <button
                          onClick={() => toggleCortesia(u.id, false)}
                          disabled={toggling === u.id}
                          className="text-xs border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {toggling === u.id ? '…' : 'Remover cortesia'}
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleCortesia(u.id, true)}
                          disabled={toggling === u.id}
                          className="text-xs border border-purple-200 text-purple-700 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {toggling === u.id ? '…' : '🎁 Dar cortesia'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center">
          Mostrando {usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''}{q ? ` para "${q}"` : ''}
        </p>
      </div>
    </div>
  )
}
