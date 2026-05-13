'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Ponto {
  data_referencia: string
  valence: number
}

interface Props {
  dados: Ponto[]
}

export default function EvolucaoEmocionalChart({ dados }: Props) {
  if (!dados || dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-400">
        Nenhum dado emocional ainda.
      </div>
    )
  }

  const chartData = dados.map(p => ({
    data: format(parseISO(p.data_referencia), 'dd/MM', { locale: ptBR }),
    valor: Number((((p.valence + 1) / 2) * 10).toFixed(1)),
  }))

  const ultimos7 = chartData.slice(-7)
  const media = ultimos7.reduce((s, p) => s + p.valor, 0) / ultimos7.length
  const primeira = ultimos7[0]?.valor ?? 5
  const tendencia = media > primeira + 0.5 ? '↑' : media < primeira - 0.5 ? '↓' : '→'
  const tendenciaColor = tendencia === '↑' ? 'text-green-600' : tendencia === '↓' ? 'text-red-500' : 'text-gray-500'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Últimos 30 dias</p>
        <span className={`text-sm font-semibold ${tendenciaColor}`}>
          {tendencia} {tendencia === '↑' ? 'Melhora' : tendencia === '↓' ? 'Queda' : 'Estável'}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="gradEmocional" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="data" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            formatter={(v: number) => [v.toFixed(1), 'Humor']}
          />
          <ReferenceLine y={5} stroke="#e5e7eb" strokeDasharray="4 4" />
          <Area type="monotone" dataKey="valor" stroke="#0d9488" strokeWidth={2} fill="url(#gradEmocional)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
