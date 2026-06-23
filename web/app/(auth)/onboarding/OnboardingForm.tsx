'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { criarClinicaAction, convidarMembroAction } from '@/app/actions/clinica'

interface Membro {
  nome: string
  role: 'profissional' | 'secretaria' | ''
}

const ROLES = [
  { value: 'profissional', label: 'Profissional de Saúde', desc: 'Acesso ao prontuário e sessões' },
  { value: 'secretaria',   label: 'Secretária',            desc: 'Acesso à agenda e agendamentos' },
] as const

type Step = 'tipo' | 'modulos' | 'form'

const MODULOS = [
  {
    id: 'agenda',
    label: 'Agenda & Prontuário',
    desc: 'Agendamento inteligente, sessões, prontuário digital',
    preco: 'Incluído',
    obrigatorio: true,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    desc: 'Atendimento por IA, triagem automática, lembretes',
    preco: '+ R$79/mês',
    obrigatorio: false,
  },
  {
    id: 'social',
    label: 'Redes Sociais & Marketing',
    desc: 'Publicação, inbox unificado de comentários e DMs',
    preco: '+ R$49/mês',
    obrigatorio: false,
  },
]

export default function OnboardingForm({ nomeDefault }: { nomeDefault: string }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('tipo')
  const [tipo, setTipo] = useState<'autonomo' | 'equipe' | null>(null)
  const [modulos, setModulos] = useState<string[]>(['agenda'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nomeClinica, setNomeClinica] = useState('')

  const [membros, setMembros] = useState<Membro[]>([{ nome: '', role: '' }])
  const [conviteLinks, setConviteLinks] = useState<{ nome: string; link: string }[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  function addMembro() {
    setMembros(prev => [...prev, { nome: '', role: '' }])
  }

  function removeMembro(i: number) {
    setMembros(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateMembro(i: number, field: keyof Membro, value: string) {
    setMembros(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m))
  }

  function toggleModulo(id: string) {
    if (id === 'agenda') return
    setModulos(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link)
    setCopied(link)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.set('nome', nomeClinica || nomeDefault)

    const result = await criarClinicaAction(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (tipo === 'equipe') {
      const validos = membros.filter(m => m.nome.trim() && m.role)
      const links: { nome: string; link: string }[] = []

      for (const m of validos) {
        const fd = new FormData()
        fd.set('nome', m.nome.trim())
        fd.set('email', '')
        fd.set('role', m.role)
        const inv = await convidarMembroAction(fd)
        if (inv?.token) {
          links.push({ nome: m.nome.trim(), link: `${location.origin}/convite/${inv.token}` })
        }
      }

      if (links.length > 0) {
        setConviteLinks(links)
        setLoading(false)
        return
      }
    }

    await redirectToCheckout()
  }

  async function redirectToCheckout() {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modulos }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        router.replace('/dashboard')
      }
    } catch {
      router.replace('/dashboard')
    }
  }

  // Tela de links de convite gerados
  if (conviteLinks.length > 0) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-green-800 mb-1">Clínica criada com sucesso!</p>
          <p className="text-xs text-green-700">Compartilhe os links abaixo com cada membro da equipe.</p>
        </div>

        <div className="space-y-2">
          {conviteLinks.map(({ nome, link }) => (
            <div key={link} className="border border-gray-200 rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-semibold text-gray-800">{nome}</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500 font-mono truncate flex-1">{link}</p>
                <button
                  onClick={() => copyLink(link)}
                  className="text-xs bg-teal-600 text-white px-2.5 py-1 rounded-lg whitespace-nowrap hover:bg-teal-700 transition-colors"
                >
                  {copied === link ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={redirectToCheckout}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
        >
          Continuar para pagamento →
        </button>
      </div>
    )
  }

  // Step 1: Seleção de tipo
  if (step === 'tipo') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500 text-center">Como você trabalha atualmente?</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setTipo('autonomo'); setStep('modulos') }}
            className="flex flex-col items-center gap-2 border-2 border-gray-200 hover:border-teal-500 rounded-2xl p-5 transition-colors group"
          >
            <span className="text-3xl">👤</span>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-teal-700">Autônomo</span>
            <span className="text-xs text-gray-400 text-center">Trabalho por conta própria</span>
          </button>
          <button
            onClick={() => { setTipo('equipe'); setStep('modulos') }}
            className="flex flex-col items-center gap-2 border-2 border-gray-200 hover:border-teal-500 rounded-2xl p-5 transition-colors group"
          >
            <span className="text-3xl">👥</span>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-teal-700">Equipe</span>
            <span className="text-xs text-gray-400 text-center">Tenho colaboradores</span>
          </button>
        </div>
      </div>
    )
  }

  // Step 2: Seleção de módulos
  if (step === 'modulos') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500 text-center">Quais módulos você precisa?</p>
        <div className="space-y-2">
          {MODULOS.map(m => {
            const ativo = modulos.includes(m.id)
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleModulo(m.id)}
                disabled={m.obrigatorio}
                className={[
                  'w-full text-left flex items-start gap-3 border-2 rounded-2xl p-4 transition-colors',
                  ativo
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 bg-white hover:border-gray-300',
                  m.obrigatorio ? 'cursor-default' : 'cursor-pointer',
                ].join(' ')}
              >
                <div className={[
                  'mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0',
                  ativo ? 'border-teal-500 bg-teal-500' : 'border-gray-300',
                ].join(' ')}>
                  {ativo && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{m.label}</p>
                  <p className="text-xs text-gray-500 leading-snug mt-0.5">{m.desc}</p>
                </div>
                <span className={[
                  'text-xs font-medium shrink-0 mt-0.5',
                  m.obrigatorio ? 'text-gray-400' : 'text-teal-700',
                ].join(' ')}>
                  {m.preco}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep('tipo')}
            className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={() => setStep('form')}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            Continuar →
          </button>
        </div>
      </div>
    )
  }

  // Step 3: Formulário de nome + membros
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome da {tipo === 'equipe' ? 'clínica' : 'prática'}
        </label>
        <input
          type="text"
          value={nomeClinica}
          onChange={e => setNomeClinica(e.target.value)}
          placeholder={nomeDefault}
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
        />
        <p className="text-xs text-gray-400 mt-1">Deixe em branco para usar seu nome</p>
      </div>

      {tipo === 'equipe' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Membros da equipe</p>
            <button
              type="button"
              onClick={addMembro}
              className="text-xs text-teal-600 hover:text-teal-800 font-medium"
            >
              + Adicionar
            </button>
          </div>

          {membros.map((m, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Nome do membro ${i + 1}`}
                  value={m.nome}
                  onChange={e => updateMembro(i, 'nome', e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {membros.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMembro(i)}
                    className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
                    title="Remover"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <p className="text-xs text-gray-500">Nível de acesso:</p>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(r => (
                    <label
                      key={r.value}
                      className={[
                        'flex items-start gap-2 rounded-lg border px-2.5 py-2 cursor-pointer transition-colors',
                        m.role === r.value
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 bg-white hover:border-gray-300',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name={`role-${i}`}
                        value={r.value}
                        checked={m.role === r.value}
                        onChange={() => updateMembro(i, 'role', r.value)}
                        className="mt-0.5 accent-teal-600"
                      />
                      <div>
                        <p className="text-xs font-medium text-gray-800">{r.label}</p>
                        <p className="text-xs text-gray-400 leading-tight">{r.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <p className="text-xs text-gray-400">
            Links de convite serão gerados para cada membro preenchido.
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setStep('modulos')}
          className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Voltar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
        >
          {loading ? 'Criando…' : 'Ir para pagamento →'}
        </button>
      </div>
    </form>
  )
}
