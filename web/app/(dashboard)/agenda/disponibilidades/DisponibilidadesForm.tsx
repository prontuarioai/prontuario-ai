'use client'

import { useState, useTransition } from 'react'
import { adicionarDisponibilidadeAction, removerDisponibilidadeAction } from '@/app/actions/disponibilidades'

interface Disponibilidade {
  id: string
  dia_semana: number
  hora_inicio: string
  hora_fim: string
}

interface Props {
  disponibilidades: Disponibilidade[]
  slug: string
}

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function DisponibilidadesForm({ disponibilidades, slug }: Props) {
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [removendo, setRemovendo] = useState<string | null>(null)

  const porDia = DIAS.map((_, i) => ({
    dia: i,
    slots: disponibilidades.filter(d => d.dia_semana === i).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)),
  }))

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await adicionarDisponibilidadeAction(fd)
      if (result?.error) setError(result.error)
      else (e.target as HTMLFormElement).reset()
    })
  }

  async function handleRemove(id: string) {
    setRemovendo(id)
    await removerDisponibilidadeAction(id)
    setRemovendo(null)
  }

  const linkPublico = `${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/agendar/${slug}`

  return (
    <div className="space-y-6">
      {/* Link público */}
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-teal-900">Seu link de agendamento público</p>
          <p className="text-xs text-teal-700 mt-0.5 font-mono break-all">/agendar/{slug}</p>
        </div>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(linkPublico)}
          className="shrink-0 text-xs text-teal-700 border border-teal-300 px-3 py-1.5 rounded-xl hover:bg-teal-100 transition-colors"
        >
          Copiar link
        </button>
      </div>

      {/* Adicionar slot */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Adicionar horário disponível</h3>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
        )}
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Dia da semana</label>
            <select
              name="dia_semana"
              required
              className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {DIAS.map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Das</label>
            <input
              name="hora_inicio"
              type="time"
              required
              defaultValue="08:00"
              className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Até</label>
            <input
              name="hora_fim"
              type="time"
              required
              defaultValue="18:00"
              className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            {isPending ? 'Adicionando…' : 'Adicionar'}
          </button>
        </form>
        <p className="text-xs text-gray-400">
          Cada slot representa um bloco de disponibilidade. Horários de 1h são gerados automaticamente dentro do bloco.
        </p>
      </div>

      {/* Grade por dia */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Sua disponibilidade semanal</h3>
        {disponibilidades.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum horário cadastrado. Adicione acima para que pacientes possam agendar.</p>
        ) : (
          <div className="space-y-3">
            {porDia.filter(d => d.slots.length > 0).map(({ dia, slots }) => (
              <div key={dia} className="flex items-start gap-3">
                <span className="w-8 text-xs font-semibold text-gray-500 pt-1.5 shrink-0">
                  {DIAS_CURTOS[dia]}
                </span>
                <div className="flex flex-wrap gap-2 flex-1">
                  {slots.map(slot => (
                    <div
                      key={slot.id}
                      className="flex items-center gap-1.5 bg-teal-50 text-teal-800 text-xs font-medium px-3 py-1.5 rounded-xl border border-teal-100"
                    >
                      <span>{slot.hora_inicio.slice(0, 5)}–{slot.hora_fim.slice(0, 5)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemove(slot.id)}
                        disabled={removendo === slot.id}
                        className="text-teal-500 hover:text-red-500 transition-colors ml-1 disabled:opacity-40"
                        title="Remover"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
