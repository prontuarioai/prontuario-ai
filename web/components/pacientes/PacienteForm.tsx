'use client'

import { useFormStatus } from 'react-dom'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface PacienteDefaults {
  nome?: string
  email?: string
  whatsapp?: string
  data_nascimento?: string
  genero?: string
  queixa_principal?: string
  historico_medico?: string
  medicamentos?: string
  contato_emergencia?: string
}

interface Props {
  action: (formData: FormData) => Promise<{ error?: string; ok?: boolean; id?: string } | void>
  defaultValues?: PacienteDefaults
}

export default function PacienteForm({ action, defaultValues }: Props) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleAction(formData: FormData) {
    setError('')
    setSuccess(false)
    startTransition(async () => {
      const result = await action(formData)
      if (result?.error) setError(result.error)
      else if (result?.id) router.push(`/pacientes/${result.id}`)
      else if (result?.ok) setSuccess(true)
    })
  }

  return (
    <form action={handleAction} className="space-y-5">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">Salvo com sucesso.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
          <input
            name="nome"
            required
            defaultValue={defaultValues?.nome}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Maria da Silva"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            name="email"
            type="email"
            defaultValue={defaultValues?.email ?? ''}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="maria@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
          <input
            name="whatsapp"
            defaultValue={defaultValues?.whatsapp ?? ''}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="11999999999"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data de nascimento</label>
          <input
            name="data_nascimento"
            type="date"
            defaultValue={defaultValues?.data_nascimento ?? ''}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
          <select
            name="genero"
            defaultValue={defaultValues?.genero ?? ''}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">Selecionar</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
            <option value="outro">Outro</option>
            <option value="prefiro_nao_informar">Prefiro não informar</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Queixa principal</label>
          <textarea
            name="queixa_principal"
            rows={3}
            defaultValue={defaultValues?.queixa_principal ?? ''}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            placeholder="Motivo da consulta…"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Histórico médico relevante</label>
          <textarea
            name="historico_medico"
            rows={2}
            defaultValue={defaultValues?.historico_medico ?? ''}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            placeholder="Diagnósticos, tratamentos anteriores…"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Medicamentos em uso</label>
          <input
            name="medicamentos"
            defaultValue={defaultValues?.medicamentos ?? ''}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Medicamentos, dosagem…"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contato de emergência</label>
          <input
            name="contato_emergencia"
            defaultValue={defaultValues?.contato_emergencia ?? ''}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Nome e telefone"
          />
        </div>
      </div>

      <SubmitButton isPending={isPending} />
    </form>
  )
}

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
    >
      {isPending ? 'Salvando…' : 'Salvar'}
    </button>
  )
}
