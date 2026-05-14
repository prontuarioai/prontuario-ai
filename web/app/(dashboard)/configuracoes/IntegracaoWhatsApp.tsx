'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  terapeutaId: string
  whatsappNumber?: string | null
}

export default function IntegracaoWhatsApp({ terapeutaId, whatsappNumber }: Props) {
  const [connected, setConnected] = useState(false)
  const [qr, setQr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    init()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  async function init() {
    setLoading(true)
    const res = await fetch('/api/whatsapp/status')
    const data = await res.json()
    if (data.connected) {
      setConnected(true)
      setLoading(false)
      return
    }
    await fetch('/api/whatsapp/connect', { method: 'POST' })
    setLoading(false)
    startPolling()
  }

  function startPolling() {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const [statusRes, qrRes] = await Promise.all([
        fetch('/api/whatsapp/status'),
        fetch('/api/whatsapp/qr'),
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
    }, 3000)
  }

  async function handleDisconnect() {
    if (pollRef.current) clearInterval(pollRef.current)
    await fetch('/api/whatsapp/disconnect', { method: 'POST' })
    setConnected(false)
    setQr(null)
    await fetch('/api/whatsapp/connect', { method: 'POST' })
    startPolling()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">WhatsApp</h2>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {connected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>

      {loading ? (
        <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
      ) : connected ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            WhatsApp conectado. Lembretes e triagens são enviados automaticamente.
            {whatsappNumber && <span className="text-gray-400"> ({whatsappNumber})</span>}
          </p>
          <button onClick={handleDisconnect}
            className="text-sm text-red-500 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">
            Desconectar
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Escaneie o QR code com seu WhatsApp para conectar.
          </p>
          {qr ? (
            <div className="flex justify-center">
              <img src={qr} alt="QR Code WhatsApp" className="w-48 h-48 rounded-xl border border-gray-200" />
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-center space-y-2">
                <div className="w-6 h-6 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mx-auto" />
                <p className="text-xs text-gray-400">Gerando QR code…</p>
              </div>
            </div>
          )}
          <button onClick={startPolling} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Atualizar
          </button>
        </div>
      )}
    </div>
  )
}
