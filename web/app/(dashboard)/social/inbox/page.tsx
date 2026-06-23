import Link from 'next/link'
import InboxList from './InboxList'

export default function InboxPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/social" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ChevronLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Caixa de entrada</h1>
          <p className="text-sm text-gray-500">Comentários e mensagens de todas as redes</p>
        </div>
      </div>

      <InboxList />
    </div>
  )
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  )
}
