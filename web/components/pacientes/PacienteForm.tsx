'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface PacienteDefaults {
  nome?: string
  email?: string
  whatsapp?: string       // armazenado como DDI+DDD+número concatenado
  data_nascimento?: string
  consentimento_lgpd?: boolean
}

interface Props {
  action: (formData: FormData) => Promise<{ error?: string; ok?: boolean; id?: string } | void>
  defaultValues?: PacienteDefaults
  profissionais?: { id: string; nome: string }[]
  currentUserId?: string
}

// Decompõe o whatsapp salvo (ex: 5511999999999) em DDI / DDD / número
function decomporWhatsapp(wpp?: string): { ddi: string; ddd: string; numero: string } {
  if (!wpp) return { ddi: '55', ddd: '', numero: '' }
  const digits = wpp.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) {
    return { ddi: '55', ddd: digits.slice(2, 4), numero: digits.slice(4) }
  }
  if (digits.length >= 10) {
    return { ddi: '55', ddd: digits.slice(0, 2), numero: digits.slice(2) }
  }
  return { ddi: '55', ddd: '', numero: digits }
}

export default function PacienteForm({ action, defaultValues, profissionais, currentUserId }: Props) {
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const wpp = decomporWhatsapp(defaultValues?.whatsapp)

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
    <form action={handleAction} className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">Salvo com sucesso.</p>
      )}

      {/* Profissional responsável (só quando admin tem equipe) */}
      {profissionais && profissionais.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Profissional responsável *</label>
          <select
            name="profissional_id"
            required
            defaultValue={currentUserId ?? ''}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">Selecionar profissional</option>
            {profissionais.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>
      )}

      {/* Nome */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
        <input
          name="nome"
          required
          defaultValue={defaultValues?.nome}
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Maria da Silva"
        />
      </div>

      {/* WhatsApp: DDI + DDD + Número */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
        <div className="flex gap-2">
          <div className="w-20">
            <input
              name="ddi"
              defaultValue={wpp.ddi}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-center"
              placeholder="55"
              maxLength={4}
            />
            <p className="text-xs text-center text-gray-400 mt-0.5">DDI</p>
          </div>
          <div className="w-20">
            <input
              name="ddd"
              defaultValue={wpp.ddd}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-center"
              placeholder="11"
              maxLength={3}
            />
            <p className="text-xs text-center text-gray-400 mt-0.5">DDD</p>
          </div>
          <div className="flex-1">
            <input
              name="numero"
              defaultValue={wpp.numero}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="999999999"
              maxLength={10}
            />
            <p className="text-xs text-gray-400 mt-0.5">Número</p>
          </div>
        </div>
      </div>

      {/* Email e Data de nascimento */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            name="email"
            type="email"
            defaultValue={defaultValues?.email ?? ''}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="maria@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data de nascimento</label>
          <input
            name="data_nascimento"
            type="date"
            defaultValue={defaultValues?.data_nascimento ?? ''}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Consentimento LGPD */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          name="consentimento_lgpd"
          type="checkbox"
          defaultChecked={defaultValues?.consentimento_lgpd ?? false}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
        <span className="text-sm text-gray-600">
          Paciente autorizou o tratamento de dados pessoais conforme a LGPD (Lei 13.709/2018).
        </span>
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
      >
        {isPending ? 'Salvando…' : 'Salvar'}
      </button>
    </form>
  )
}
