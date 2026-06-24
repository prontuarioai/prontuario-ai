import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import TriagemPublica from './TriagemPublica'

export default async function TriagemPage({ params }: { params: { token: string } }) {
  const supabase = createServiceClient()

  const { data: triagem } = await supabase
    .from('triagens')
    .select('id, respondida_em, sessoes(inicio), pacientes(nome), terapeutas(nome)')
    .eq('token', params.token)
    .single()

  if (!triagem) notFound()

  if (triagem.respondida_em) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center space-y-3 max-w-sm">
          <p className="text-5xl">✅</p>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Triagem já respondida</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Você já enviou suas respostas. Até a sessão! 🌱
          </p>
        </div>
      </div>
    )
  }

  const sessao = (triagem as any).sessoes
  const paciente = (triagem as any).pacientes
  const terapeuta = (triagem as any).terapeutas

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8 space-y-1">
          <p className="text-sm text-gray-400">Triagem pré-sessão</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Olá, {paciente?.nome?.split(' ')[0]}!</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sessão com {terapeuta?.nome} em{' '}
            {sessao?.inicio && new Date(sessao.inicio).toLocaleDateString('pt-BR', {
              weekday: 'long', day: 'numeric', month: 'long',
            })}
          </p>
        </div>
        <TriagemPublica token={params.token} triagemId={triagem.id} />
      </div>
    </div>
  )
}
