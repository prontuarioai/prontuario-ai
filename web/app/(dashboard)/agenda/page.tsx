import { createClient } from '@/lib/supabase/server'
import AgendaView from './AgendaView'

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { semana?: string; paciente?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const baseDate = searchParams.semana ? new Date(searchParams.semana) : new Date()
  const segunda = getSegunda(baseDate)
  const domingo = new Date(segunda)
  domingo.setDate(domingo.getDate() + 6)
  domingo.setHours(23, 59, 59)

  const [{ data: sessoes }, { data: pacientes }] = await Promise.all([
    supabase
      .from('sessoes')
      .select('id, inicio, fim, status, modalidade, pacientes(id, nome)')
      .eq('terapeuta_id', user!.id)
      .gte('inicio', segunda.toISOString())
      .lte('inicio', domingo.toISOString())
      .order('inicio'),
    supabase
      .from('pacientes')
      .select('id, nome')
      .eq('terapeuta_id', user!.id)
      .eq('ativo', true)
      .order('nome'),
  ])

  return (
    <AgendaView
      sessoes={sessoes ?? []}
      pacientes={pacientes ?? []}
      semanaBase={segunda.toISOString()}
      pacientePreSelecionado={searchParams.paciente}
    />
  )
}

function getSegunda(data: Date): Date {
  const d = new Date(data)
  const dia = d.getDay()
  const diff = dia === 0 ? -6 : 1 - dia
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}
