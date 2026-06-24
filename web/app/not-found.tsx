import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <p className="text-6xl font-bold text-gray-200">404</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Página não encontrada</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          A página que você procura não existe ou foi movida.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          Ir para o dashboard
        </Link>
      </div>
    </div>
  )
}
