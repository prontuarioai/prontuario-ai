import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DisponibilidadesForm from './DisponibilidadesForm'

export default async function DisponibilidadesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: terapeuta }, { data: disponibilidades }] = await Promise.all([
    supabase.from('terapeutas').select('slug').eq('id', user.id).single(),
    supabase
      .from('disponibilidades')
      .select('*')
      .eq('terapeuta_id', user.id)
      .eq('ativo', true)
      .order('dia_semana')
      .order('hora_inicio'),
  ])

  if (!terapeuta) redirect('/login')

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/agenda"
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Voltar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disponibilidade</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure seus horários para agendamento online</p>
        </div>
      </div>

      <DisponibilidadesForm
        disponibilidades={disponibilidades ?? []}
        slug={terapeuta.slug}
      />
    </div>
  )
}
