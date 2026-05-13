import type { Metadata } from 'next'
import CadastroForm from './CadastroForm'

export const metadata: Metadata = { title: 'Criar conta' }

export default function CadastroPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="min-h-screen flex">
      {/* Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 to-teal-800 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">Prontuario.ai</span>
        </div>
        <div className="space-y-6">
          <div className="bg-white/10 rounded-2xl p-6 space-y-2">
            <p className="text-3xl font-bold">14 dias grátis</p>
            <p className="text-teal-100">Sem cartão de crédito. Cancele quando quiser.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Pacientes', value: 'Ilimitados' },
              { label: 'Sessões/mês', value: 'Ilimitadas' },
              { label: 'IA inclusa', value: 'Sim' },
              { label: 'WhatsApp', value: 'Incluso' },
            ].map(item => (
              <div key={item.label} className="bg-white/10 rounded-xl p-4">
                <p className="text-teal-200 text-xs">{item.label}</p>
                <p className="text-white font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-teal-300 text-sm">© {new Date().getFullYear()} Prontuario.ai</p>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden text-center">
            <span className="text-2xl font-bold text-teal-700">Prontuario.ai</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Criar conta grátis</h2>
            <p className="mt-1 text-sm text-gray-500">14 dias de teste, sem cartão de crédito</p>
          </div>

          {searchParams.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {searchParams.error}
            </div>
          )}

          <CadastroForm />

          <p className="text-center text-sm text-gray-500">
            Já tem conta?{' '}
            <a href="/login" className="text-teal-600 font-medium hover:underline">
              Entrar
            </a>
          </p>
          <p className="text-center text-xs text-gray-400">
            Ao criar conta, você concorda com nossos{' '}
            <a href="#" className="underline">Termos de Uso</a> e{' '}
            <a href="#" className="underline">Política de Privacidade</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
