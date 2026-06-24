'use client'

import { useState, useTransition } from 'react'

interface Disponibilidade {
  dia_semana: number
  hora_inicio: string
  hora_fim: string
}

interface Props {
  slug: string
  terapeutaId: string
  disponibilidades: Disponibilidade[]
  sessoesOcupadas: { inicio: string; fim: string }[]
}

export default function AgendamentoPublicoForm({ slug, terapeutaId, disponibilidades, sessoesOcupadas }: Props) {
  const [step, setStep] = useState<'dados' | 'confirmar' | 'sucesso'>('dados')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [queixa, setQueixa] = useState('')
  const [dataSelecionada, setDataSelecionada] = useState('')
  const [horaSelecionada, setHoraSelecionada] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const diasNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  function getProximasDatas() {
    const datas: Date[] = []
    const hoje = new Date()
    for (let i = 1; i <= 30 && datas.length < 14; i++) {
      const d = new Date(hoje)
      d.setDate(hoje.getDate() + i)
      const diaSemana = d.getDay()
      if (disponibilidades.some(disp => disp.dia_semana === diaSemana)) {
        datas.push(d)
      }
    }
    return datas
  }

  function getHorasParaData(data: string) {
    if (!data) return []
    const d = new Date(data)
    const diaSemana = d.getDay()
    const disps = disponibilidades.filter(disp => disp.dia_semana === diaSemana)
    const horas: string[] = []

    for (const disp of disps) {
      const [hIni, mIni] = disp.hora_inicio.split(':').map(Number)
      const [hFim] = disp.hora_fim.split(':').map(Number)
      for (let h = hIni; h < hFim; h++) {
        const horaStr = `${h.toString().padStart(2, '0')}:${mIni.toString().padStart(2, '0')}`
        const inicio = new Date(data)
        inicio.setHours(h, mIni, 0, 0)
        const ocupada = sessoesOcupadas.some(s => {
          const si = new Date(s.inicio)
          const sf = new Date(s.fim)
          return inicio >= si && inicio < sf
        })
        if (!ocupada) horas.push(horaStr)
      }
    }
    return horas
  }

  async function handleConfirmar() {
    if (!nome || !dataSelecionada || !horaSelecionada) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }
    setError('')
    setStep('confirmar')
  }

  async function handleAgendar() {
    startTransition(async () => {
      const [hora, minuto] = horaSelecionada.split(':').map(Number)
      const inicio = new Date(dataSelecionada)
      inicio.setHours(hora, minuto, 0, 0)
      const fim = new Date(inicio)
      fim.setHours(hora + 1)

      const res = await fetch('/api/agendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          terapeutaId,
          nome,
          email,
          whatsapp,
          queixa,
          inicio: inicio.toISOString(),
          fim: fim.toISOString(),
          modalidade: 'presencial',
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error ?? 'Erro ao agendar. Tente novamente.'); return }

      setStep('sucesso')
    })
  }

  if (step === 'sucesso') {
    return (
      <div className="text-center space-y-4 py-8">
        <p className="text-5xl">🎉</p>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Agendamento solicitado!</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Entraremos em contato para confirmar sua consulta.
          {whatsapp && ' Você receberá um lembrete pelo WhatsApp.'}
        </p>
      </div>
    )
  }

  if (step === 'confirmar') {
    const [hora] = horaSelecionada.split(':').map(Number)
    const dataFormatada = new Date(dataSelecionada).toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long'
    })
    return (
      <div className="space-y-5">
        <div className="bg-brand-50 rounded-xl p-4 space-y-2">
          <p className="font-semibold text-brand-900">Confirmar agendamento</p>
          <p className="text-sm text-brand-800">{nome}</p>
          <p className="text-sm text-brand-800 capitalize">{dataFormatada} às {horaSelecionada}</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button onClick={() => setStep('dados')} className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:bg-gray-900">
            Voltar
          </button>
          <button
            onClick={handleAgendar}
            disabled={isPending}
            className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            {isPending ? 'Agendando…' : 'Confirmar agendamento'}
          </button>
        </div>
      </div>
    )
  }

  const proximasDatas = getProximasDatas()
  const horas = getHorasParaData(dataSelecionada)

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-200">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nome completo *</label>
          <input value={nome} onChange={e => setNome(e.target.value)} required
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Seu nome" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email *</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="seu@email.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">WhatsApp</label>
          <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="11999999999" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Motivo da consulta</label>
          <textarea value={queixa} onChange={e => setQueixa(e.target.value)} rows={2}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            placeholder="Conte um pouco sobre o que te traz…" />
        </div>
      </div>

      {proximasDatas.length > 0 ? (
        <>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Selecione uma data *</p>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {proximasDatas.slice(0, 14).map(d => {
                const iso = d.toISOString().split('T')[0]
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => { setDataSelecionada(iso); setHoraSelecionada('') }}
                    className={`p-2 rounded-xl text-center border transition-colors ${
                      dataSelecionada === iso
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'border-gray-200 dark:border-gray-700 hover:border-brand-300 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <p className="text-xs">{diasNomes[d.getDay()]}</p>
                    <p className="text-sm font-semibold">{d.getDate()}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {dataSelecionada && horas.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Selecione um horário *</p>
              <div className="flex flex-wrap gap-2">
                {horas.map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHoraSelecionada(h)}
                    className={`px-4 py-2 rounded-xl text-sm border font-medium transition-colors ${
                      horaSelecionada === h
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'border-gray-200 dark:border-gray-700 hover:border-brand-300 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-400">Nenhuma disponibilidade cadastrada no momento.</p>
      )}

      <button
        onClick={handleConfirmar}
        disabled={!nome || !dataSelecionada || !horaSelecionada}
        className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        Continuar
      </button>
    </div>
  )
}
