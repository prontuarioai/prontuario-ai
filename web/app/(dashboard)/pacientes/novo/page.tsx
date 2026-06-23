import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PacienteForm from '@/components/pacientes/PacienteForm'
import { criarPacienteAction } from '@/app/actions/pacientes'

export const metadata: Metadata = { title: 'Novo paciente' }

export default async function NovoPacientePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('clinica_id, role')
    .eq('id', user.id)
    .single()

  if (terapeuta?.role === 'secretaria') redirect('/pacientes')

  let profissionais: { id: string; nome: string }[] = []
  if (terapeuta?.role === 'admin' && terapeuta.clinica_id) {
    const { data } = await supabase
      .from('terapeutas')
      .select('id, nome')
      .eq('clinica_id', terapeuta.clinica_id)
      .in('role', ['admin', 'profissional'])
      .order('nome')
    profissionais = data ?? []
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <a href="/pacientes" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Pacientes
        </a>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Novo paciente</h1>
      </div>
      <PacienteForm
        action={criarPacienteAction}
        profissionais={profissionais}
        currentUserId={user.id}
      />
    </div>
  )
}
