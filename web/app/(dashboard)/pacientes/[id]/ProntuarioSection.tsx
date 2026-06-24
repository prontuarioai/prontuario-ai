'use client'

import { useState, useTransition } from 'react'
import { atualizarProntuarioAction } from '@/app/actions/pacientes'

interface ProntuarioDefaults {
  genero?: string | null
  queixa_principal?: string | null
  historico_medico?: string | null
  medicamentos?: string | null
  contato_emergencia?: string | null
  valor_consulta?: number | null
}

export default function ProntuarioSection({
  pacienteId,
  defaults,
}: {
  pacienteId: string
  defaults: ProntuarioDefaults
}) {
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleAction(formData: FormData) {
    setError(''); setSuccess(false)
    startTransition(async () => {
      const res = await atualizarProntuarioAction(pacienteId, formData)
      if (res?.error) setError(res.error)
      else setSuccess(true)
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-5">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔒</span>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Prontuário clínico</h2>
          <p className="text-xs text-gray-400">Informações confidenciais — visíveis apenas para profissionais autorizados</p>
        </div>
      </div>

      {error   && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">Salvo com sucesso.</p>}

      <form action={handleAction} className="space-y-4">

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Gênero</label>
            <select
              name="genero"
              defaultValue={defaults.genero ?? ''}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-800"
            >
              <option value="">Selecionar</option>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
              <option value="outro">Outro</option>
              <option value="prefiro_nao_informar">Prefiro não informar</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Valor da consulta
              <span className="text-gray-400 font-normal ml-1 text-xs">(cobrança automática)</span>
            </label>
            <div className="flex items-center rounded-xl border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-brand-500">
              <span className="px-3 py-2.5 text-xs text-gray-400 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shrink-0">R$</span>
              <input
                name="valor_consulta"
                type="number"
                step="0.01"
                min="0"
                defaultValue={defaults.valor_consulta ?? 0}
                className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                placeholder="150,00"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Queixa principal / Motivo de consulta</label>
          <textarea
            name="queixa_principal"
            rows={3}
            defaultValue={defaults.queixa_principal ?? ''}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            placeholder="Descreva o motivo da consulta…"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Histórico médico relevante</label>
          <textarea
            name="historico_medico"
            rows={2}
            defaultValue={defaults.historico_medico ?? ''}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            placeholder="Diagnósticos anteriores, internações, alergias…"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Medicamentos em uso</label>
            <input
              name="medicamentos"
              defaultValue={defaults.medicamentos ?? ''}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Nome, dosagem…"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Contato de emergência</label>
            <input
              name="contato_emergencia"
              defaultValue={defaults.contato_emergencia ?? ''}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Nome e telefone"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          {isPending ? 'Salvando…' : 'Salvar prontuário'}
        </button>
      </form>
    </div>
  )
}
