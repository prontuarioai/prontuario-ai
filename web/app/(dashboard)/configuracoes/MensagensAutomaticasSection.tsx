'use client'

import { useState, useTransition } from 'react'
import { salvarMensagensAutomaticasAction } from '@/app/actions/configuracoes'

interface Props {
  mensagemAniversario: string
  horaMensagens: string
}

export default function MensagensAutomaticasSection({ mensagemAniversario, horaMensagens }: Props) {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function handleAction(formData: FormData) {
    setError(''); setSuccess(false)
    startTransition(async () => {
      const res = await salvarMensagensAutomaticasAction(formData)
      if (res?.error) setError(res.error)
      else setSuccess(true)
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-gray-900">Mensagens automáticas</h2>
        <p className="text-xs text-gray-400 mt-0.5">Personalize as mensagens enviadas automaticamente via WhatsApp</p>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">Salvo com sucesso.</p>}

      <form action={handleAction} className="space-y-5">

        {/* Aniversariantes */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎂</span>
            <label className="text-sm font-medium text-gray-800">Mensagem de aniversário</label>
          </div>
          <textarea
            name="mensagem_aniversario"
            rows={3}
            defaultValue={mensagemAniversario}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            placeholder="Olá, {nome}! Feliz aniversário! 🎉"
          />
          <p className="text-xs text-gray-400">
            Use <code className="bg-gray-100 px-1 rounded">{'{nome}'}</code> para incluir o nome do paciente.
            Enviada no dia do aniversário no horário configurado abaixo.
          </p>
        </div>

        {/* Horário */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Horário de envio</label>
            <input
              name="hora_mensagens_automaticas"
              type="time"
              defaultValue={horaMensagens}
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <p className="text-xs text-gray-400 flex-1 pt-5">
            Horário em que as mensagens automáticas serão enviadas (fuso de Brasília).
          </p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          {isPending ? 'Salvando…' : 'Salvar mensagens'}
        </button>
      </form>
    </div>
  )
}
