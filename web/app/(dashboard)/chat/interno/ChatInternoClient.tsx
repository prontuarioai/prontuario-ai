'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { enviarMensagemInternaAction } from '@/app/actions/chatInterno'

interface MensagemInterna {
  id: string
  mensagem: string
  remetente_id: string
  remetente_nome: string
  created_at: string
}

export default function ChatInternoClient({
  mensagensInternas,
  usuarioId,
  nomeUsuario,
  clinicaId,
}: {
  mensagensInternas: MensagemInterna[]
  usuarioId: string
  nomeUsuario: string
  clinicaId: string | null
}) {
  const [msgs, setMsgs] = useState<MensagemInterna[]>(mensagensInternas)
  const [texto, setTexto] = useState('')
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs.length])

  function handleEnviar(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return
    const msg = texto
    setTexto('')
    startTransition(async () => {
      await enviarMensagemInternaAction(msg)
      if (clinicaId) {
        const { data } = await supabase
          .from('chat_interno')
          .select('id, mensagem, remetente_id, remetente_nome, created_at')
          .eq('clinica_id', clinicaId)
          .order('created_at', { ascending: true })
          .limit(200)
        setMsgs(data ?? [])
      }
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-5 py-4">
        <h1 className="text-base font-bold text-gray-900 dark:text-white">Chat da Equipe</h1>
        <p className="text-xs text-gray-400 mt-0.5">Comunicação interna entre membros da clínica</p>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50 dark:bg-gray-900">
        {msgs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-3xl mb-2">👋</p>
              <p className="text-sm text-gray-400">Nenhuma mensagem ainda.</p>
              <p className="text-xs text-gray-400 mt-1">Comece a conversa com sua equipe!</p>
            </div>
          </div>
        ) : (
          msgs.map(m => {
            const isMeu = m.remetente_id === usuarioId
            return (
              <div key={m.id} className={`flex ${isMeu ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${isMeu ? '' : 'flex items-end gap-2'}`}>
                  {!isMeu && (
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold text-xs shrink-0 mb-1">
                      {m.remetente_nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={`rounded-2xl px-3 py-2 ${
                    isMeu ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-white dark:bg-gray-800 text-gray-800 rounded-bl-sm shadow-sm'
                  }`}>
                    {!isMeu && (
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5">{m.remetente_nome}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{m.mensagem}</p>
                    <p className={`text-xs mt-1 ${isMeu ? 'text-brand-200' : 'text-gray-400'}`}>
                      {new Date(m.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-3">
        <form onSubmit={handleEnviar} className="flex gap-2">
          <input
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder={clinicaId ? 'Mensagem para a equipe…' : 'Você precisa estar em uma clínica para usar o chat.'}
            className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 dark:bg-gray-900 disabled:text-gray-400"
            disabled={isPending || !clinicaId}
          />
          <button
            type="submit"
            disabled={isPending || !texto.trim() || !clinicaId}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            {isPending ? '…' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  )
}
