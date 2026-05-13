'use client'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center space-y-4 max-w-sm">
            <p className="text-5xl">⚠️</p>
            <h2 className="text-xl font-bold text-gray-900">Erro crítico</h2>
            <p className="text-sm text-gray-500">Ocorreu um erro inesperado na aplicação.</p>
            <button
              onClick={reset}
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors text-sm"
            >
              Recarregar
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
