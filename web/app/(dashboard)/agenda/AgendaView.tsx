'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AgendarModal from './AgendarModal'

interface Sessao {
  id: string
  inicio: string
  fim: string
  status: string
  modalidade: string
  pacientes: { id: string; nome: string } | null
}

interface Paciente { id: string; nome: string }

interface Props {
  sessoes: Sessao[]
  pacientes: Paciente[]
  semanaBase: string
  pacientePreSelecionado?: string
}

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const STATUS_COLOR: Record<string, string> = {
  agendada: 'bg-blue-100 text-blue-800 border-blue-200',
  realizada: 'bg-green-100 text-green-800 border-green-200',
  cancelada: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  faltou: 'bg-red-100 text-red-700 border-red-200',
}

export default function AgendaView({ sessoes, pacientes, semanaBase, pacientePreSelecionado }: Props) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(!!pacientePreSelecionado)
  const [slotSelecionado, setSlotSelecionado] = useState<{ inicio: string; fim: string } | null>(null)

  const segunda = new Date(semanaBase)
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(segunda)
    d.setDate(d.getDate() + i)
    return d
  })

  function navSemana(dir: number) {
    const nova = new Date(segunda)
    nova.setDate(nova.getDate() + dir * 7)
    router.push(`/agenda?semana=${nova.toISOString().split('T')[0]}`)
  }

  function handleDayClick(dia: Date, hora: number) {
    const inicio = new Date(dia)
    inicio.setHours(hora, 0, 0, 0)
    const fim = new Date(inicio)
    fim.setHours(hora + 1)
    setSlotSelecionado({ inicio: inicio.toISOString(), fim: fim.toISOString() })
    setShowModal(true)
  }

  const sessoesPorDia = dias.map(dia =>
    sessoes.filter(s => {
      const d = new Date(s.inicio)
      return d.getDate() === dia.getDate() && d.getMonth() === dia.getMonth()
    })
  )

  const hoje = new Date()

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agenda</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {segunda.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })} —{' '}
            {dias[6].toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navSemana(-1)}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-900 transition-colors"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={() => router.push('/agenda')}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-900 transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={() => navSemana(1)}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-900 transition-colors"
          >
            <ChevronRight />
          </button>
          <Link
            href="/agenda/disponibilidades"
            className="text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 dark:bg-gray-900 transition-colors ml-2"
          >
            Disponibilidade
          </Link>
          <button
            onClick={() => { setSlotSelecionado(null); setShowModal(true) }}
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            + Agendar
          </button>
        </div>
      </div>

      {/* Grade semanal */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Cabeçalho dos dias */}
        <div className="grid grid-cols-8 border-b border-gray-100 dark:border-gray-700">
          <div className="p-3" />
          {dias.map((dia, i) => {
            const ehHoje = dia.toDateString() === hoje.toDateString()
            return (
              <div key={i} className={`p-3 text-center border-l border-gray-100 dark:border-gray-700 ${ehHoje ? 'bg-brand-50' : ''}`}>
                <p className="text-xs text-gray-400">{DIAS[i]}</p>
                <p className={`text-lg font-semibold mt-0.5 ${ehHoje ? 'text-brand-700' : 'text-gray-900 dark:text-white'}`}>
                  {dia.getDate()}
                </p>
              </div>
            )
          })}
        </div>

        {/* Linhas de horário */}
        <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
          {Array.from({ length: 14 }, (_, h) => h + 7).map(hora => (
            <div key={hora} className="grid grid-cols-8 border-b border-gray-50 min-h-[64px]">
              <div className="px-3 py-2 text-xs text-gray-400 text-right leading-none">
                {hora}:00
              </div>
              {dias.map((dia, di) => {
                const sessoesDaHora = sessoesPorDia[di].filter(s => new Date(s.inicio).getHours() === hora)
                const ehHoje = dia.toDateString() === hoje.toDateString()
                return (
                  <div
                    key={di}
                    className={`border-l border-gray-50 p-1 cursor-pointer hover:bg-gray-50 dark:bg-gray-900 transition-colors ${ehHoje ? 'bg-brand-50/30' : ''}`}
                    onClick={() => handleDayClick(dia, hora)}
                  >
                    {sessoesDaHora.map(s => (
                      <a
                        key={s.id}
                        href={`/sessoes/${s.id}`}
                        onClick={e => e.stopPropagation()}
                        className={`block rounded-lg border px-2 py-1 text-xs mb-1 truncate font-medium ${STATUS_COLOR[s.status] ?? ''}`}
                      >
                        {new Date(s.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {' '}{s.pacientes?.nome}
                      </a>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <AgendarModal
          pacientes={pacientes}
          slotInicial={slotSelecionado}
          pacientePreSelecionado={pacientePreSelecionado}
          onClose={() => { setShowModal(false); setSlotSelecionado(null) }}
        />
      )}
    </div>
  )
}

function ChevronLeft() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
}
function ChevronRight() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
}
