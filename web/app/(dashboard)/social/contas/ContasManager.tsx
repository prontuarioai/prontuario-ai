'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { type Conta, type Rede, REDES_INFO } from '../types'

const REDES_DISPONIVEIS: Rede[] = ['instagram', 'facebook', 'google_business', 'youtube']

interface Props {
  contasIniciais: Conta[]
  conectado?: boolean
}

export default function ContasManager({ contasIniciais, conectado }: Props) {
  const router = useRouter()
  const [contas, setContas] = useState<Conta[]>(contasIniciais)
  const [loading, setLoading] = useState<Rede | null>(null)
  const [erro, setErro] = useState('')

  async function conectar(provider: Rede) {
    setLoading(provider)
    setErro('')
    window.location.href = `/api/social/oauth/${provider}`
  }

  async function desconectar(provider: Rede) {
    setLoading(provider)
    setErro('')
    const res = await fetch(`/api/social/contas?provider=${provider}`, { method: 'DELETE' })
    if (res.ok) {
      setContas(prev => prev.map(c => c.provider === provider ? { ...c, conectada: false, nome: '', fotoUrl: null } : c))
    } else {
      setErro('Erro ao desconectar. Tente novamente.')
    }
    setLoading(null)
  }

  const contaMap = new Map(contas.map(c => [c.provider, c]))

  return (
    <div className="space-y-4">
      {conectado && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800 font-medium">
          Conta conectada com sucesso!
        </div>
      )}
      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">{erro}</div>
      )}

      {REDES_DISPONIVEIS.map(rede => {
        const info = REDES_INFO[rede]
        const conta = contaMap.get(rede)
        const conectada = conta?.conectada ?? false
        const isLoading = loading === rede

        return (
          <div
            key={rede}
            className="flex items-center justify-between border border-gray-200 rounded-2xl p-4 bg-white"
          >
            <div className="flex items-center gap-3">
              <RedeIcon rede={rede} className="w-8 h-8" />
              <div>
                <p className="text-sm font-semibold text-gray-800">{info.label}</p>
                {conectada && conta?.nome && (
                  <p className="text-xs text-gray-400">{conta.nome}</p>
                )}
                {!conectada && (
                  <p className="text-xs text-gray-400">Não conectada</p>
                )}
              </div>
            </div>

            {conectada ? (
              <button
                onClick={() => desconectar(rede)}
                disabled={isLoading}
                className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-xl px-3 py-1.5 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Aguarde…' : 'Desconectar'}
              </button>
            ) : (
              <button
                onClick={() => conectar(rede)}
                disabled={isLoading}
                className="text-xs bg-brand-600 hover:bg-brand-700 text-white rounded-xl px-3 py-1.5 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Aguarde…' : 'Conectar'}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function RedeIcon({ rede, className }: { rede: Rede; className?: string }) {
  if (rede === 'instagram') return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#E1306C" />
      <path d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" fill="white" />
      <circle cx="16" cy="8" r="1" fill="white" />
      <rect x="4.5" y="4.5" width="15" height="15" rx="4" stroke="white" strokeWidth="1.5" fill="none" />
    </svg>
  )
  if (rede === 'facebook') return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#1877F2" />
      <path d="M15 8h-1.5C13 8 13 8.5 13 9v1.5h2l-.3 2H13V19h-2.5v-6.5H9v-2h1.5V9c0-2 1-3 3-3H15v2z" fill="white" />
    </svg>
  )
  if (rede === 'google_business') return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#4285F4" />
      <path d="M12 6C8.7 6 6 8.7 6 12s2.7 6 6 6c3 0 5.5-2 5.9-4.8H12v-2h8v1c0 4.4-3.6 8-8 8-4.4 0-8-3.6-8-8s3.6-8 8-8c2.1 0 4 .8 5.5 2.1l-1.7 1.7C14.5 6.7 13.3 6 12 6z" fill="white" />
    </svg>
  )
  if (rede === 'youtube') return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#FF0000" />
      <path d="M19.8 7.8S19.6 6.5 19 6c-.7-.7-1.5-.7-1.8-.7C15.1 5 12 5 12 5s-3.1 0-5.2.3C6.5 5.3 5.7 5.3 5 6c-.6.5-.8 1.8-.8 1.8S4 9.3 4 10.8v1.3c0 1.5.2 3 .2 3S4.4 16.4 5 17c.7.7 1.6.7 2 .7 1.5.1 6.3.2 6.3.2s3.1 0 5.2-.3c.3 0 1.1-.1 1.8-.7.6-.5.8-1.8.8-1.8s.2-1.5.2-3v-1.3c0-1.5-.2-3-.2-3zm-9.3 5.5v-4l4.8 2.5-4.8 1.5z" fill="white" />
    </svg>
  )
  return null
}
