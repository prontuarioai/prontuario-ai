import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingForm from './OnboardingForm'

export default async function OnboardingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('nome, clinica_id')
    .eq('id', user.id)
    .single()

  if (!terapeuta) redirect('/cadastro?setup=1')
  if (terapeuta.clinica_id) redirect('/dashboard')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
        <div className="text-center space-y-1">
          <span className="text-2xl font-bold text-brand-700">Agenda Online AI</span>
          <h2 className="text-xl font-bold text-gray-900 mt-3">Bem-vindo(a)!</h2>
          <p className="text-sm text-gray-500">
            Vamos configurar sua prática em 30 segundos
          </p>
        </div>
        <OnboardingForm nomeDefault={terapeuta.nome} />
      </div>
    </div>
  )
}
