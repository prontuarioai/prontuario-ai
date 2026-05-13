'use client'

import { useTransition } from 'react'
import { differenceInDays } from 'date-fns'

interface Props {
  plano: string
  trialFim: string
  totalPacientes: number
  hasSubscription: boolean
}

export default function PlanoSection({ plano, trialFim, totalPacientes, hasSubscription }: Props) {
  const [isPending, startTransition] = useTransition()

  async function handleCheckout() {
    startTransition(async () => {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    })
  }

  async function handlePortal() {
    startTransition(async () => {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    })
  }

  const diasRestantes = differenceInDays(new Date(trialFim), new Date())
  const basePrice = 29.90
  const pacPrice = 2.99
  const totalEstimado = basePrice + totalPacientes * pacPrice

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Plano e cobrança</h2>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
          plano === 'ativo' ? 'bg-green-100 text-green-700'
          : plano === 'trial' ? 'bg-amber-100 text-amber-700'
          : 'bg-red-100 text-red-600'
        }`}>
          {plano === 'ativo' ? 'Ativo' : plano === 'trial' ? 'Trial' : 'Inativo'}
        </span>
      </div>

      {plano === 'trial' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
          <p className="text-sm font-medium text-amber-900">
            {diasRestantes > 0 ? `${diasRestantes} dias restantes no trial` : 'Trial expirado'}
          </p>
          <p className="text-xs text-amber-700">
            Após o trial, você será cobrado R$ {basePrice.toFixed(2).replace('.', ',')} base + R$ {pacPrice.toFixed(2).replace('.', ',')} por paciente.
          </p>
        </div>
      )}

      {plano === 'inativo' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-medium text-red-800">Assinatura inativa</p>
          <p className="text-xs text-red-600 mt-0.5">Reative para continuar acessando todos os recursos.</p>
        </div>
      )}

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Taxa base</span>
          <span>R$ {basePrice.toFixed(2).replace('.', ',')}/mês</span>
        </div>
        <div className="flex justify-between">
          <span>{totalPacientes} paciente{totalPacientes !== 1 ? 's' : ''} × R$ {pacPrice.toFixed(2).replace('.', ',')}</span>
          <span>R$ {(totalPacientes * pacPrice).toFixed(2).replace('.', ',')}/mês</span>
        </div>
        <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-100">
          <span>Estimado este mês</span>
          <span>R$ {totalEstimado.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      {plano === 'ativo' && hasSubscription ? (
        <button onClick={handlePortal} disabled={isPending}
          className="w-full border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm disabled:opacity-60">
          {isPending ? 'Abrindo portal…' : 'Gerenciar assinatura'}
        </button>
      ) : (
        <button onClick={handleCheckout} disabled={isPending}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm disabled:opacity-60">
          {isPending ? 'Redirecionando…' : plano === 'inativo' ? 'Reativar assinatura' : 'Assinar agora'}
        </button>
      )}
    </div>
  )
}
