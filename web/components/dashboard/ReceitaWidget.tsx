import Link from 'next/link'
import { differenceInDays } from 'date-fns'

interface Props {
  plano: string
  trialFim: string
  totalPacientes: number
  valorTotal?: number | null
}

export default function ReceitaWidget({ plano, trialFim, totalPacientes, valorTotal }: Props) {
  if (plano === 'trial') {
    const diasRestantes = differenceInDays(new Date(trialFim), new Date())
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-amber-900">Período de teste</p>
          <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
            {diasRestantes > 0 ? `${diasRestantes} dias restantes` : 'Expirado'}
          </span>
        </div>
        <p className="text-xs text-amber-700">
          Assine para continuar usando todos os recursos após o período de teste.
        </p>
        <Link
          href="/configuracoes"
          className="block w-full text-center bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-xl text-sm transition-colors"
        >
          Assinar agora
        </Link>
      </div>
    )
  }

  if (plano === 'inativo') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
        <p className="text-sm font-semibold text-red-800">Assinatura inativa</p>
        <p className="text-xs text-red-600">Reative sua assinatura para continuar atendendo.</p>
        <Link
          href="/configuracoes"
          className="block w-full text-center bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-xl text-sm transition-colors"
        >
          Reativar
        </Link>
      </div>
    )
  }

  const basePrice = 29.90
  const pacPrice = 2.99
  const total = valorTotal ?? (basePrice + totalPacientes * pacPrice)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Assinatura ativa</p>
        <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">Ativo</span>
      </div>
      <div className="space-y-1 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Base</span>
          <span>R$ {basePrice.toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="flex justify-between">
          <span>{totalPacientes} paciente{totalPacientes !== 1 ? 's' : ''} × R$ {pacPrice.toFixed(2).replace('.', ',')}</span>
          <span>R$ {(totalPacientes * pacPrice).toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-100">
          <span>Total/mês</span>
          <span>R$ {total.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>
      <Link
        href="/configuracoes"
        className="block text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        Gerenciar assinatura →
      </Link>
    </div>
  )
}
