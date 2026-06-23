'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { enviarMensagemPacienteAction } from '@/app/actions/comunicacao'

interface Conversa {
  pacienteId: string
  pacienteNome: string
  whatsapp: string | null
  ultimaMensagem: string
  ultimaData: string
  naoLidos: number
}

interface Mensagem {
  id: string
  mensagem: string
  direcao: string
  categoria: string | null
  created_at: string
}

export default function ChatProfissionalClient({
  conversas,
  usuarioId,
}: {
  conversas: Conversa[]
  usuarioId: string
}) {
  const [selecionado, setSelecionado] = useState<string | null>(conversas[0]?.pacienteId ?? null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [texto, setTexto] = useState('')
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const conversaAtual = conversas.find(c => c.pacienteId === selecionado)

  useEffect(() => {
    if (!selecionado) return
    setLoadingMsgs(true)
    supabase
      .from('eventos_entre_sessoes')
      .select('id, mensagem, direcao, categoria, created_at')
      .eq('terapeuta_id', usuarioId)
      .eq('paciente_id', selecionado)
      .or('fonte.eq.profissional,fonte.is.null')
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        setMensagens(data ?? [])
        setLoadingMsgs(false)
      })
  }, [selecionado])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens.length])

  function handleEnviar(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || !selecionado) return
    const msg = texto
    setTexto('')
    startTransition(async () => {
      await enviarMensagemPacienteAction(selecionado, msg)
      // Recarregar mensagens
      const { data } = await supabase
        .from('eventos_entre_sessoes')
        .select('id, mensagem, direcao, categoria, created_at')
        .eq('terapeuta_id', usuarioId)
        .eq('paciente_id', selecionado)
        .or('fonte.eq.profissional,fonte.is.null')
        .order('created_at', { ascending: true })
        .limit(100)
      setMensagens(data ?? [])
    })
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Lista de conversas */}
      <div className="w-72 shrink-0 border-r border-gray-100 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h1 className="text-base font-bold text-gray-900">Chat do Profissional</h1>
          <p className="text-xs text-gray-400 mt-0.5">Mensagens dos seus pacientes</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversas.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-2xl mb-2">💬</p>
              <p className="text-xs text-gray-400">Nenhuma conversa ainda.</p>
            </div>
          ) : (
            conversas.map(c => (
              <button
                key={c.pacienteId}
                onClick={() => setSelecionado(c.pacienteId)}
                className={[
                  'w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors',
                  selecionado === c.pacienteId ? 'bg-brand-50 border-l-2 border-l-brand-500' : '',
                ].join(' ')}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm shrink-0">
                    {c.pacienteNome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.pacienteNome}</p>
                      {c.naoLidos > 0 && (
                        <span className="bg-brand-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                          {c.naoLidos > 9 ? '9+' : c.naoLidos}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{c.ultimaMensagem}</p>
                    <p className="text-xs text-gray-300 mt-0.5">
                      {new Date(c.ultimaData).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Área da conversa */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {!selecionado || !conversaAtual ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-sm text-gray-400">Selecione uma conversa</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header da conversa */}
            <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold">
                {conversaAtual.pacienteNome.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{conversaAtual.pacienteNome}</p>
                {conversaAtual.whatsapp && (
                  <p className="text-xs text-gray-400">{conversaAtual.whatsapp}</p>
                )}
              </div>
              <Link
                href={`/pacientes/${selecionado}`}
                className="text-xs text-brand-600 hover:text-brand-800 font-medium"
              >
                Ver prontuário →
              </Link>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingMsgs ? (
                <p className="text-center text-xs text-gray-400">Carregando…</p>
              ) : mensagens.length === 0 ? (
                <p className="text-center text-xs text-gray-400">Nenhuma mensagem ainda.</p>
              ) : (
                mensagens.map(m => (
                  <div key={m.id} className={`flex ${m.direcao === 'saida' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                      m.direcao === 'saida'
                        ? 'bg-brand-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{m.mensagem}</p>
                      <p className={`text-xs mt-1 ${m.direcao === 'saida' ? 'text-brand-200' : 'text-gray-400'}`}>
                        {new Date(m.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-100 p-3">
              <form onSubmit={handleEnviar} className="flex gap-2">
                <input
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  placeholder="Enviar pelo WhatsApp do profissional…"
                  className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  disabled={isPending}
                />
                <button
                  type="submit"
                  disabled={isPending || !texto.trim()}
                  className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                >
                  {isPending ? '…' : 'Enviar'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
