import { createClient } from '@/lib/supabase/server'
import EventoActions from './EventoActions'
import MarcarTodosButton from './MarcarTodosButton'

const CATEGORIA_COLOR: Record<string, string> = {
  crise: 'border-l-red-500 bg-red-50',
  recaida: 'border-l-orange-400 bg-orange-50',
  progresso: 'border-l-green-500 bg-green-50',
  cotidiano: 'border-l-blue-400 bg-blue-50',
  outro: 'border-l-gray-300 bg-white',
}

const CATEGORIA_LABEL: Record<string, string> = {
  crise: '🔴 Crise',
  recaida: '🟠 Recaída',
  progresso: '🟢 Progresso',
  cotidiano: '🔵 Cotidiano',
  outro: '⚪ Outro',
}

export default async function EventosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: eventos } = await supabase
    .from('eventos_entre_sessoes')
    .select('id, mensagem, categoria, intensidade_emocional, lido, created_at, pacientes(id, nome)')
    .eq('terapeuta_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const naoLidos = eventos?.filter(e => !e.lido).length ?? 0

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventos entre sessões</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Mensagens dos pacientes fora das sessões
            {naoLidos > 0 && <span className="ml-2 bg-teal-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{naoLidos} novo{naoLidos > 1 ? 's' : ''}</span>}
          </p>
        </div>
        {naoLidos > 0 && <MarcarTodosButton />}
      </div>

      {eventos && eventos.length > 0 ? (
        <div className="space-y-3">
          {eventos.map((e: any) => (
            <div
              key={e.id}
              className={`rounded-2xl border-l-4 border border-gray-100 p-4 transition-colors ${CATEGORIA_COLOR[e.categoria ?? 'outro']}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <a href={`/pacientes/${e.pacientes?.id}`} className="text-sm font-semibold text-gray-900 hover:text-teal-700 transition-colors">
                      {e.pacientes?.nome}
                    </a>
                    {!e.lido && <div className="w-2 h-2 bg-teal-500 rounded-full" />}
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(e.created_at).toLocaleString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{e.mensagem}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">{CATEGORIA_LABEL[e.categoria ?? 'outro']}</span>
                    {e.intensidade_emocional && (
                      <span className="text-xs text-gray-400">· Intensidade: {e.intensidade_emocional}/10</span>
                    )}
                  </div>
                </div>
                <EventoActions
                  eventoId={e.id}
                  categoriaAtual={e.categoria ?? 'outro'}
                  intensidadeAtual={e.intensidade_emocional ?? 5}
                  lido={e.lido}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-sm text-gray-400">Nenhum evento registrado.</p>
          <p className="text-xs text-gray-400 mt-1">Mensagens do WhatsApp aparecem aqui automaticamente.</p>
        </div>
      )}
    </div>
  )
}
