import type { Metadata } from 'next'
import Link from 'next/link'
import RecuperarSenhaForm from './RecuperarSenhaForm'

export const metadata: Metadata = { title: 'Recuperar senha — Prontuario.ai' }

export default function RecuperarSenhaPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-teal-700 mb-1">Prontuario.ai</h1>
          <h2 className="text-xl font-bold text-gray-900">Recuperar senha</h2>
          <p className="text-sm text-gray-500 mt-1">
            Enviaremos um link para redefinir sua senha.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <RecuperarSenhaForm />
        </div>

        <p className="text-center text-sm text-gray-500">
          Lembrou a senha?{' '}
          <Link href="/login" className="text-teal-600 font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
