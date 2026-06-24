'use client'

import { useState, useTransition } from 'react'

interface Props {
  sessaoId: string
  status: string
  triagemEnviada: boolean
  avaliacaoRespondida: boolean
  marcarRealizadaAction: (id: string) => Promise<{ error?: string; ok?: boolean } | void>
  enviarTriagemAction: (id: string) => Promise<{ error?: string; ok?: boolean } | void>
  enviarAvaliacaoAction: (id: string) => Promise<{ error?: string; ok?: boolean } | void>
}

export default function SessaoActions({
  sessaoId,
  status,
  triagemEnviada,
  avaliacaoRespondida,
  marcarRealizadaAction,
  enviarTriagemAction,
  enviarAvaliacaoAction,
}: Props) {
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function run(action: (id: string) => Promise<{ error?: string; ok?: boolean } | void>, label: string) {
    setMsg(null)
    startTransition(async () => {
      const res = await action(sessaoId)
      if (res?.error) setMsg({ type: 'error', text: res.error })
      else setMsg({ type: 'ok', text: `${label} com sucesso!` })
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-3">
      <h2 className="font-semibold text-gray-900 dark:text-white">Ações</h2>

      {msg && (
        <p className={`text-xs rounded-xl px-3 py-2 ${
          msg.type === 'ok'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          {msg.text}
        </p>
      )}

      <div className="space-y-2">
        {status === 'agendada' && (
          <button
            disabled={isPending}
            onClick={() => run(marcarRealizadaAction, 'Sessão marcada como realizada')}
            className="w-full text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 px-4 py-2 rounded-xl transition-colors"
          >
            {isPending ? 'Aguarde…' : 'Marcar como realizada'}
          </button>
        )}

        <button
          disabled={isPending}
          onClick={() => run(enviarTriagemAction, triagemEnviada ? 'Triagem reenviada' : 'Triagem enviada')}
          className="w-full text-sm font-medium text-brand-700 border border-brand-200 hover:bg-brand-50 disabled:opacity-50 px-4 py-2 rounded-xl transition-colors"
        >
          {isPending ? 'Aguarde…' : triagemEnviada ? 'Reenviar triagem' : 'Enviar triagem agora'}
        </button>

        {status === 'realizada' && !avaliacaoRespondida && (
          <button
            disabled={isPending}
            onClick={() => run(enviarAvaliacaoAction, 'Avaliação enviada')}
            className="w-full text-sm font-medium text-purple-700 border border-purple-200 hover:bg-purple-50 disabled:opacity-50 px-4 py-2 rounded-xl transition-colors"
          >
            {isPending ? 'Aguarde…' : 'Enviar avaliação pós-sessão'}
          </button>
        )}
      </div>
    </div>
  )
}
