import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import AcceptForm from './AcceptForm'

export default async function ConvitePage({ params }: { params: { token: string } }) {
  const service = createServiceClient()
  const { data: convite } = await service
    .from('convites')
    .select('*, clinicas(nome)')
    .eq('token', params.token)
    .is('aceito_em', null)
    .single()

  if (!convite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <div className="text-center space-y-3">
          <p className="text-2xl">❌</p>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Convite inválido</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Este convite não existe ou já foi utilizado.</p>
          <a href="/login" className="block text-sm text-brand-600 hover:underline">
            Ir para o login
          </a>
        </div>
      </div>
    )
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/cadastro?convite=${params.token}`)
  }

  const clinicaNome = (convite.clinicas as { nome: string } | null)?.nome ?? 'Clínica'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 space-y-6">
        <div className="text-center">
          <span className="text-2xl font-bold text-brand-700">Agenda Online AI</span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-3">Você foi convidado(a)!</h2>
        </div>
        <AcceptForm token={params.token} clinicaNome={clinicaNome} role={convite.role} />
      </div>
    </div>
  )
}
