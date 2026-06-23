'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { type Conta, type Rede, REDES_INFO } from '../types'

interface Props {
  contasConectadas: Conta[]
}

export default function PublicarForm({ contasConectadas }: Props) {
  const router = useRouter()
  const redesDisponiveis = contasConectadas.filter(c => c.conectada)

  const [conteudo, setConteudo] = useState('')
  const [redesSelecionadas, setRedesSelecionadas] = useState<Rede[]>([])
  const [agendarPara, setAgendarPara] = useState('')
  const [modoAgendar, setModoAgendar] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  function toggleRede(rede: Rede) {
    setRedesSelecionadas(prev =>
      prev.includes(rede) ? prev.filter(r => r !== rede) : [...prev, rede]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!conteudo.trim()) { setErro('O conteúdo não pode estar vazio.'); return }
    if (!redesSelecionadas.length) { setErro('Selecione ao menos uma rede.'); return }

    setLoading(true)
    setErro('')

    const res = await fetch('/api/social/publicar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conteudo,
        redes: redesSelecionadas,
        agendarPara: modoAgendar && agendarPara ? agendarPara : undefined,
      }),
    })

    if (res.ok) {
      setSucesso(true)
      setTimeout(() => router.push('/social'), 1500)
    } else {
      const data = await res.json().catch(() => ({}))
      setErro(data.error ?? 'Erro ao publicar. Tente novamente.')
    }
    setLoading(false)
  }

  if (sucesso) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-2">
        <p className="text-2xl">✓</p>
        <p className="text-sm font-semibold text-green-800">
          {modoAgendar ? 'Post agendado com sucesso!' : 'Post publicado com sucesso!'}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">{erro}</div>
      )}

      {/* Conteúdo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Conteúdo</label>
        <textarea
          value={conteudo}
          onChange={e => setConteudo(e.target.value)}
          maxLength={2200}
          rows={5}
          placeholder="O que você quer compartilhar com seus pacientes e seguidores?"
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none transition"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{conteudo.length}/2200</p>
      </div>

      {/* Seleção de redes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Publicar em</label>
        {redesDisponiveis.length === 0 ? (
          <p className="text-sm text-gray-400">
            Nenhuma rede conectada.{' '}
            <a href="/social/contas" className="text-teal-600 underline">Conectar agora</a>
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {redesDisponiveis.map(conta => {
              const info = REDES_INFO[conta.provider]
              const selecionada = redesSelecionadas.includes(conta.provider)
              return (
                <label
                  key={conta.provider}
                  className={[
                    'flex items-center gap-2.5 border-2 rounded-2xl px-3 py-2.5 cursor-pointer transition-colors',
                    selecionada ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300',
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    checked={selecionada}
                    onChange={() => toggleRede(conta.provider)}
                    className="accent-teal-600"
                  />
                  <span className="text-sm font-medium text-gray-700">{info.label}</span>
                  {conta.nome && <span className="text-xs text-gray-400 truncate">{conta.nome}</span>}
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* Agendamento */}
      <div className="border border-gray-100 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setModoAgendar(false)}
            className={[
              'flex-1 py-2 rounded-xl text-sm font-medium transition-colors',
              !modoAgendar ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ].join(' ')}
          >
            Publicar agora
          </button>
          <button
            type="button"
            onClick={() => setModoAgendar(true)}
            className={[
              'flex-1 py-2 rounded-xl text-sm font-medium transition-colors',
              modoAgendar ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ].join(' ')}
          >
            Agendar
          </button>
        </div>

        {modoAgendar && (
          <input
            type="datetime-local"
            value={agendarPara}
            onChange={e => setAgendarPara(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        )}
      </div>

      {/* Preview simples */}
      {conteudo && redesSelecionadas.length > 0 && (
        <div className="border border-gray-100 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preview</p>
          {redesSelecionadas.map(rede => (
            <div key={rede} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-600 mb-1">{REDES_INFO[rede].label}</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-snug">
                {conteudo.length > 150 ? conteudo.slice(0, 150) + '…' : conteudo}
              </p>
            </div>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !conteudo.trim() || !redesSelecionadas.length}
        className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold py-3 rounded-2xl transition-colors text-sm"
      >
        {loading ? 'Publicando…' : modoAgendar ? 'Agendar post' : 'Publicar agora'}
      </button>
    </form>
  )
}
