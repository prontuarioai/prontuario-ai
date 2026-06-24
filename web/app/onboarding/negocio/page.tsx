import { redirect } from 'next/navigation'
import EscolherNegocio from './EscolherNegocio'

interface Local {
  nome: string
  placeId: string | null
}

export default function EscolherNegocioPage({
  searchParams,
}: {
  searchParams: { locations?: string; from?: string }
}) {
  let locais: Local[] = []
  try {
    locais = JSON.parse(decodeURIComponent(searchParams.locations ?? '[]'))
  } catch {
    redirect('/dashboard')
  }

  if (!locais.length) redirect('/dashboard')

  const redirectTo = searchParams.from === 'configuracoes' ? '/configuracoes' : '/dashboard'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Qual é o seu negócio?</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Encontramos {locais.length} páginas no Google Meus Negócios. Escolha qual usar para receber avaliações dos seus pacientes.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <EscolherNegocio locais={locais} redirectTo={redirectTo} />
        </div>
      </div>
    </div>
  )
}
