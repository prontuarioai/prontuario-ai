import { createClient } from '@/lib/supabase/server'
import { type Conta } from '../types'
import ContasManager from './ContasManager'

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

export default async function ContasPage({
  searchParams,
}: {
  searchParams: { conectado?: string }
}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const contas = session ? await fetchContas(session.access_token) : []

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contas Conectadas</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Conecte suas redes sociais para publicar e monitorar comentários diretamente da plataforma.
        </p>
      </div>

      <ContasManager
        contasIniciais={contas}
        conectado={searchParams.conectado === 'true'}
      />
    </div>
  )
}
