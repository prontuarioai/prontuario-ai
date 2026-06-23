'use client'

import { useTransition } from 'react'
import { differenceInDays } from 'date-fns'

interface Props {
  plano: string
  trialFim: string
  totalPacientes: number
  hasSubscription: boolean
}

const BASE_PRICE = 59.90
const PER_PATIENT_PRICE = 2.99

export default function PlanoSection({ plano, trialFim, totalPacientes, hasSubscription }: Props) {
  const totalEstimado = BASE_PRICE + totalPacientes * PER_PATIENT_PRICE
  const [isPending, startTransition] = useTransition()

  async function handleCheckout() {
    startTransition(async () => {
      const res = await fetch('/api/asaas/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error ?? 'Erro ao redirecionar para pagamento.')
    })
  }

  async function handlePortal() {
    startTransition(async () => {
      const res = await fetch('/api/asaas/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error ?? 'Link não encontrado.')
    })
  }

  const diasRestantes = differenceInDays(new Date(trialFim), new Date())

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Plano e cobrança</h2>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
          plano === 'ativo'  ? 'bg-green-100 text-green-700'
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
            Após o trial: R$ {BASE_PRICE.toFixed(2).replace('.', ',')} base + R$ {PER_PATIENT_PRICE.toFixed(2).replace('.', ',')} por paciente ativo/mês.
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
          <span>R$ {BASE_PRICE.toFixed(2).replace('.', ',')}/mês</span>
        </div>
        <div className="flex justify-between">
          <span>{totalPacientes} paciente{totalPacientes !== 1 ? 's' : ''} × R$ {PER_PATIENT_PRICE.toFixed(2).replace('.', ',')}</span>
          <span>R$ {(totalPacientes * PER_PATIENT_PRICE).toFixed(2).replace('.', ',')}/mês</span>
        </div>
        <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-100">
          <span>Estimado este mês</span>
          <span>R$ {totalEstimado.toFixed(2).replace('.', ',')}</span>
        </div>
        <p className="text-xs text-gray-400 pt-1">
          Cobrança via Asaas — PIX, boleto bancário ou cartão de crédito
        </p>
      </div>

      {plano === 'ativo' && hasSubscription ? (
        <button onClick={handlePortal} disabled={isPending}
          className="w-full border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm disabled:opacity-60">
          {isPending ? 'Buscando…' : 'Ver fatura atual'}
        </button>
      ) : (
        <button onClick={handleCheckout} disabled={isPending}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm disabled:opacity-60">
          {isPending ? 'Aguarde…' : plano === 'inativo' ? 'Reativar assinatura' : 'Assinar agora'}
        </button>
      )}
    </div>
  )
}
