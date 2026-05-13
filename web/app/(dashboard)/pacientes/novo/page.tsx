import type { Metadata } from 'next'
import PacienteForm from '@/components/pacientes/PacienteForm'
import { criarPacienteAction } from '@/app/actions/pacientes'

export const metadata: Metadata = { title: 'Novo paciente' }

export default function NovoPacientePage() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <a href="/pacientes" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Pacientes
        </a>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Novo paciente</h1>
      </div>
      <PacienteForm action={criarPacienteAction} />
    </div>
  )
}
