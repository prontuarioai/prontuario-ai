import type { Metadata } from 'next'
import LoginForm from './LoginForm'

export const metadata: Metadata = { title: 'Entrar' }

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string }
}) {
  return (
    <div className="min-h-screen flex">
      {/* Painel esquerdo — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 to-teal-800 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">Agenda Online AI</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            Gestão clínica inteligente para terapeutas
          </h1>
          <p className="text-teal-100 text-lg">
            Prontuário digital, triagens automáticas, transcrição por IA e muito mais.
          </p>
          <div className="flex flex-col gap-3 pt-4">
            {['Triagem pré-sessão via WhatsApp', 'Transcrição e resumo com IA', 'Agenda integrada ao Google Calendar', 'Avaliação pós-sessão automática'].map(f => (
              <div key={f} className="flex items-center gap-2 text-teal-100">
                <svg className="w-5 h-5 text-teal-300 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-teal-300 text-sm">© {new Date().getFullYear()} Agenda Online AI</p>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden text-center">
            <span className="text-2xl font-bold text-teal-700">Agenda Online AI</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h2>
            <p className="mt-1 text-sm text-gray-500">Entre com sua conta para continuar</p>
          </div>

          {searchParams.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {searchParams.error}
            </div>
          )}
          {searchParams.message && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-sm text-teal-700">
              {searchParams.message}
            </div>
          )}

          <LoginForm />

          <p className="text-center text-sm text-gray-500">
            Não tem conta?{' '}
            <a href="/cadastro" className="text-teal-600 font-medium hover:underline">
              Criar conta grátis
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
