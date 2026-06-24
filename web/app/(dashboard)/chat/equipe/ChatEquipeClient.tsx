'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Conversa {
  pacienteId: string
  pacienteNome: string
  whatsapp: string | null
  ultimaMensagem: string
  ultimaData: string
  naoLidos: number
}

interface MensagemPaciente {
  id: string
  mensagem: string
  direcao: string
  categoria: string | null
  created_at: string
}

export default function ChatEquipeClient({
  conversasSecretaria,
  role,
}: {
  conversasSecretaria: Conversa[]
  role: string
}) {
  const [selecionado, setSelecionado] = useState<string | null>(conversasSecretaria[0]?.pacienteId ?? null)
  const [mensagensPac, setMensagensPac] = useState<MensagemPaciente[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const conversaAtual = conversasSecretaria.find(c => c.pacienteId === selecionado)

  useEffect(() => {
    if (!selecionado) return
    setLoadingMsgs(true)
    supabase
      .from('eventos_entre_sessoes')
      .select('id, mensagem, direcao, categoria, created_at')
      .eq('paciente_id', selecionado)
      .eq('fonte', 'secretaria')
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        setMensagensPac(data ?? [])
        setLoadingMsgs(false)
      })
  }, [selecionado])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagensPac.length])

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Lista de conversas */}
      <div className="w-72 shrink-0 border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h1 className="text-base font-bold text-gray-900 dark:text-white">Chat de Agendamento</h1>
          <p className="text-xs text-gray-400 mt-0.5">Mensagens via WhatsApp da Secretária</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversasSecretaria.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-2xl mb-2">📅</p>
              <p className="text-xs text-gray-400">Nenhuma conversa ainda.</p>
              <p className="text-xs text-gray-400 mt-1">As mensagens enviadas/recebidas pela secretária aparecem aqui.</p>
            </div>
          ) : (
            conversasSecretaria.map(c => (
              <button
                key={c.pacienteId}
                onClick={() => setSelecionado(c.pacienteId)}
                className={[
                  'w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 dark:bg-gray-900 transition-colors',
                  selecionado === c.pacienteId ? 'bg-brand-50 border-l-2 border-l-brand-500' : '',
                ].join(' ')}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-sm shrink-0">
                    {c.pacienteNome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.pacienteNome}</p>
                      {c.naoLidos > 0 && (
                        <span className="bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                          {c.naoLidos > 9 ? '9+' : c.naoLidos}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{c.ultimaMensagem}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Área da conversa */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
        {!selecionado || !conversaAtual ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-sm text-gray-400">Selecione uma conversa</p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-5 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold">
                {conversaAtual.pacienteNome.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{conversaAtual.pacienteNome}</p>
                <p className="text-xs text-gray-400">Via WhatsApp da Secretária</p>
              </div>
              <Link
                href={`/pacientes/${selecionado}`}
                className="text-xs text-brand-600 hover:text-brand-800 font-medium"
              >
                Ver prontuário →
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingMsgs ? (
                <p className="text-center text-xs text-gray-400">Carregando…</p>
              ) : mensagensPac.length === 0 ? (
                <p className="text-center text-xs text-gray-400">Nenhuma mensagem ainda.</p>
              ) : (
                mensagensPac.map(m => (
                  <div key={m.id} className={`flex ${m.direcao === 'saida' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                      m.direcao === 'saida'
                        ? 'bg-purple-600 text-white rounded-br-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-800 rounded-bl-sm shadow-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{m.mensagem}</p>
                      <p className={`text-xs mt-1 ${m.direcao === 'saida' ? 'text-purple-200' : 'text-gray-400'}`}>
                        {new Date(m.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {(role === 'admin' || role === 'secretaria') && (
              <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-3">
                <p className="text-xs text-gray-400 mb-2">Resposta via WhatsApp da Secretária</p>
                <form className="flex gap-2">
                  <input
                    placeholder="Envio manual via secretária (em breve)…"
                    disabled
                    className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 text-gray-400 cursor-not-allowed"
                  />
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
