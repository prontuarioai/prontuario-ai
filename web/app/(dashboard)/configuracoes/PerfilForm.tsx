'use client'

import { useState, useTransition } from 'react'
import { atualizarPerfilAction } from '@/app/actions/configuracoes'

interface Props {
  terapeuta: {
    nome: string
    crp?: string
    bio?: string
    slug: string
    whatsapp_number?: string
    google_place_id?: string
  }
}

export default function PerfilForm({ terapeuta }: Props) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleAction(formData: FormData) {
    setError(''); setSuccess(false)
    startTransition(async () => {
      const result = await atualizarPerfilAction(formData)
      if (result?.error) setError(result.error)
      else if (result?.ok) setSuccess(true)
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
      <h2 className="font-semibold text-gray-900">Perfil profissional</h2>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">Salvo com sucesso.</p>}
      <form action={handleAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input name="nome" required defaultValue={terapeuta.nome}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registro profissional <span className="text-gray-400">(opcional)</span></label>
            <input name="crp" defaultValue={terapeuta.crp ?? ''}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="CRP, CRM, CRO, CREFITO…" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio pública</label>
            <textarea name="bio" rows={2} defaultValue={terapeuta.bio ?? ''}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              placeholder="Apresentação para a página de agendamento…" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL pública)</label>
            <div className="flex items-center rounded-xl border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-brand-500">
              <span className="px-3 py-2.5 text-xs text-gray-400 bg-gray-50 border-r border-gray-200">/agendar/</span>
              <input name="slug" required defaultValue={terapeuta.slug}
                className="flex-1 px-3 py-2.5 text-sm focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
            <input name="whatsapp_number" defaultValue={terapeuta.whatsapp_number ?? ''}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="5511999999999" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Google Place ID <span className="text-gray-400">(para convite de review)</span></label>
            <input name="google_place_id" defaultValue={terapeuta.google_place_id ?? ''}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="ChIJ..." />
          </div>
        </div>
        <button type="submit" disabled={isPending}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
          {isPending ? 'Salvando…' : 'Salvar perfil'}
        </button>
      </form>
    </div>
  )
}
