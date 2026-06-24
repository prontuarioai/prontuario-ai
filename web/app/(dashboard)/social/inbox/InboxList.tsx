'use client'

import { useState, useEffect, useCallback } from 'react'
import { type InboxItem, type Rede, REDES_INFO } from '../types'

const REDES_FILTRO: Array<{ value: Rede | ''; label: string }> = [
  { value: '', label: 'Todas' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'google_business', label: 'Google Business' },
  { value: 'youtube', label: 'YouTube' },
]

export default function InboxList() {
  const [items, setItems] = useState<InboxItem[]>([])
  const [filtroRede, setFiltroRede] = useState<Rede | ''>('')
  const [loading, setLoading] = useState(true)
  const [respondendoId, setRespondendoId] = useState<string | null>(null)
  const [resposta, setResposta] = useState('')
  const [enviando, setEnviando] = useState(false)

  const fetchItems = useCallback(async () => {
    const params = new URLSearchParams({ limite: '50' })
    if (filtroRede) params.set('rede', filtroRede)
    const res = await fetch(`/api/social/inbox?${params}`, { cache: 'no-store' }).catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      setItems(data.items ?? [])
    }
    setLoading(false)
  }, [filtroRede])

  useEffect(() => {
    setLoading(true)
    fetchItems()
    const interval = setInterval(fetchItems, 30_000)
    return () => clearInterval(interval)
  }, [fetchItems])

  async function enviarResposta(item: InboxItem) {
    if (!resposta.trim()) return
    setEnviando(true)
    await fetch('/api/social/inbox/responder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: item.id, rede: item.rede, tipo: item.tipo, texto: resposta }),
    }).catch(() => null)
    setRespondendoId(null)
    setResposta('')
    setEnviando(false)
    fetchItems()
  }

  const redesComResposta: Rede[] = ['instagram', 'facebook']

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {REDES_FILTRO.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFiltroRede(value as Rede | '')}
            className={[
              'px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors',
              filtroRede === value
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-12 text-sm text-gray-400">Carregando mensagens…</div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-12 space-y-2">
          <p className="text-2xl">📭</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma mensagem por enquanto</p>
        </div>
      )}

      {items.map(item => {
        const info = REDES_INFO[item.rede]
        const podeResponder = redesComResposta.includes(item.rede)
        const isRespondendo = respondendoId === item.id

        return (
          <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 bg-white dark:bg-gray-800 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: info.cor }}
                >
                  {info.label}
                </span>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-0.5">
                  {item.tipo === 'comentario' ? 'Comentário' : 'DM'}
                </span>
              </div>
              <span className="text-xs text-gray-400 shrink-0">
                {new Date(item.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5">{item.autorNome}</p>
              <p className="text-sm text-gray-800">{item.texto}</p>
            </div>

            <div className="flex items-center gap-2">
              {item.urlOriginal && (
                <a
                  href={item.urlOriginal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-600 hover:underline"
                >
                  Ver original
                </a>
              )}
              {podeResponder && !isRespondendo && (
                <button
                  onClick={() => { setRespondendoId(item.id); setResposta('') }}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1 transition-colors"
                >
                  Responder
                </button>
              )}
            </div>

            {isRespondendo && (
              <div className="space-y-2">
                <textarea
                  value={resposta}
                  onChange={e => setResposta(e.target.value)}
                  rows={3}
                  placeholder="Escreva sua resposta…"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setRespondendoId(null)}
                    className="text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => enviarResposta(item)}
                    disabled={enviando || !resposta.trim()}
                    className="text-xs bg-brand-600 text-white rounded-xl px-3 py-1.5 disabled:opacity-50"
                  >
                    {enviando ? 'Enviando…' : 'Enviar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
