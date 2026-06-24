import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AgendamentoPúblicoForm from './AgendamentoPublicoForm'

export default async function AgendarPublicoPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('id, nome, bio, especialidades, foto_url, slug')
    .eq('slug', params.slug)
    .single()

  if (!terapeuta) notFound()

  const { data: disponibilidades } = await supabase
    .from('disponibilidades')
    .select('*')
    .eq('terapeuta_id', terapeuta.id)
    .eq('ativo', true)

  const { data: sessoesOcupadas } = await supabase
    .from('sessoes')
    .select('inicio, fim')
    .eq('terapeuta_id', terapeuta.id)
    .eq('status', 'agendada')
    .gte('inicio', new Date().toISOString())

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        {/* Perfil do terapeuta */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-2xl mx-auto">
            {terapeuta.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{terapeuta.nome}</h1>
            {terapeuta.bio && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">{terapeuta.bio}</p>}
          </div>
          {terapeuta.especialidades?.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {terapeuta.especialidades.map((e: string) => (
                <span key={e} className="bg-brand-50 text-brand-700 text-xs px-3 py-1 rounded-full">{e}</span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-5">Solicitar agendamento</h2>
          <AgendamentoPúblicoForm
            slug={params.slug}
            terapeutaId={terapeuta.id}
            disponibilidades={disponibilidades ?? []}
            sessoesOcupadas={sessoesOcupadas ?? []}
          />
        </div>
      </div>
    </div>
  )
}
