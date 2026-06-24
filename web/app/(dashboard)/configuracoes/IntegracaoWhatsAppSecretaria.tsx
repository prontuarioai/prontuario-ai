'use client'

import { useEffect, useRef, useState } from 'react'

export default function IntegracaoWhatsAppSecretaria() {
  const [connected, setConnected] = useState(false)
  const [qr, setQr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    init()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  async function init() {
    setLoading(true)
    setError(null)
    try {
      const statusRes = await fetch('/api/whatsapp/secretaria/status')
      if (!statusRes.ok) throw new Error(`Status ${statusRes.status}`)
      const data = await statusRes.json()
      if (data.connected) {
        setConnected(true)
        setLoading(false)
        return
      }
      const connectRes = await fetch('/api/whatsapp/secretaria/connect', { method: 'POST' })
      if (!connectRes.ok) {
        const err = await connectRes.json().catch(() => ({}))
        throw new Error(err.error ?? `Erro ${connectRes.status} ao iniciar sessão`)
      }
      setLoading(false)
      startPolling()
    } catch (e: any) {
      setError(e.message ?? 'Erro desconhecido')
      setLoading(false)
    }
  }

  function startPolling() {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const [statusRes, qrRes] = await Promise.all([
          fetch('/api/whatsapp/secretaria/status'),
          fetch('/api/whatsapp/secretaria/qr'),
        ])
        const { connected: isConnected } = await statusRes.json()
        const { qr: qrCode } = await qrRes.json()

        if (isConnected) {
          setConnected(true)
          setQr(null)
          clearInterval(pollRef.current!)
        } else {
          setQr(qrCode)
        }
      } catch { /* mantém estado atual */ }
    }, 3000)
  }

  async function handleDisconnect() {
    if (pollRef.current) clearInterval(pollRef.current)
    await fetch('/api/whatsapp/secretaria/disconnect', { method: 'POST' })
    setConnected(false)
    setQr(null)
    init()
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">WhatsApp da Secretária</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Lembretes, triagens e avaliações são enviados por este número
          </p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
          {connected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>

      {loading ? (
        <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
      ) : error ? (
        <div className="space-y-3">
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </p>
          <button onClick={init}
            className="text-sm text-brand-600 border border-brand-200 px-4 py-2 rounded-xl hover:bg-brand-50 transition-colors">
            Tentar novamente
          </button>
        </div>
      ) : connected ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Conectado. Lembretes, triagens pré-sessão e avaliações pós-sessão serão enviados automaticamente por este número.
          </p>
          <button onClick={handleDisconnect}
            className="text-sm text-red-500 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">
            Desconectar
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Escaneie o QR code com o número de WhatsApp da secretária (pode ser um número dedicado para automações).
          </p>
          {qr ? (
            <div className="flex justify-center">
              <img src={qr} alt="QR Code WhatsApp Secretária" className="w-48 h-48 rounded-xl border border-gray-200 dark:border-gray-700" />
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="text-center space-y-2">
                <div className="w-6 h-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto" />
                <p className="text-xs text-gray-400">Gerando QR code…</p>
              </div>
            </div>
          )}
          <button onClick={init} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 transition-colors">
            Atualizar
          </button>
        </div>
      )}
    </div>
  )
}
