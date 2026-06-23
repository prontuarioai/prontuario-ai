import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { type Conta } from '../types'
import PublicarForm from './PublicarForm'

async function fetchContas(token: string): Promise<Conta[]> {
  const socialApiUrl = process.env.SOCIAL_API_URL
  if (!socialApiUrl) return []
  const res = await fetch(`${socialApiUrl}/accounts`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null)
  if (!res?.ok) return []
  const data = await res.json()
  return data.contas ?? []
}

export default async function PublicarPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const contas = session ? await fetchContas(session.access_token) : []

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/social" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ChevronLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Criar post</h1>
          <p className="text-sm text-gray-500">Publique nas suas redes conectadas</p>
        </div>
      </div>

      <PublicarForm contasConectadas={contas} />
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
