'use client'

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <p className="text-4xl">😕</p>
        <h2 className="text-lg font-bold text-gray-900">Algo deu errado</h2>
        <p className="text-sm text-gray-500">Não foi possível carregar esta página.</p>
        <button
          onClick={reset}
          className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-5 py-2 rounded-xl transition-colors text-sm"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
