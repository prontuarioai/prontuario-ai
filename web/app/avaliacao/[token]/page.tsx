import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import AvaliacaoPublica from './AvaliacaoPublica'

export default async function AvaliacaoPage({ params }: { params: { token: string } }) {
  const supabase = createServiceClient()

  const { data: avaliacao } = await supabase
    .from('avaliacoes_pos_sessao')
    .select('id, respondida_em, terapeutas(nome, google_place_id), pacientes(nome)')
    .eq('token', params.token)
    .single()

  if (!avaliacao) notFound()

  if (avaliacao.respondida_em) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center space-y-3 max-w-sm">
          <p className="text-5xl">⭐</p>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Avaliação já enviada</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Obrigado pelo seu feedback!</p>
        </div>
      </div>
    )
  }

  const terapeuta = (avaliacao as any).terapeutas
  const paciente = (avaliacao as any).pacientes

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8 space-y-1">
          <p className="text-sm text-gray-400">Avaliação pós-sessão</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Como foi a sessão?</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {paciente?.nome?.split(' ')[0]}, sua opinião é muito importante para {terapeuta?.nome}.
          </p>
        </div>
        <AvaliacaoPublica
          token={params.token}
          googlePlaceId={terapeuta?.google_place_id}
        />
      </div>
    </div>
  )
}
