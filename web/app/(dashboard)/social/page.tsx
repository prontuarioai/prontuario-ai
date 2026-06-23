import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { type Conta, type Rede, REDES_INFO } from './types'

async function fetchContas(token: string): Promise<Conta[]> {
  const socialApiUrl = process.env.SOCIAL_API_URL
  if (!socialApiUrl) return []
  const res = await fetch(`${socialApiUrl}/accounts`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 60 },
  }).catch(() => null)
  if (!res?.ok) return []
  const data = await res.json()
  return data.contas ?? []
}

export default async function SocialPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const contas = session ? await fetchContas(session.access_token) : []
  const contasConectadas = contas.filter(c => c.conectada)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Redes Sociais & Marketing</h1>
          <p className="text-sm text-gray-500 mt-1">
            {contasConectadas.length > 0
              ? `${contasConectadas.length} ${contasConectadas.length === 1 ? 'rede conectada' : 'redes conectadas'}`
              : 'Nenhuma rede conectada ainda'}
          </p>
        </div>
        <Link
          href="/social/publicar"
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-2xl transition-colors"
        >
          + Criar post
        </Link>
      </div>

      {/* Cards de redes conectadas */}
      {contasConectadas.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {contasConectadas.map(conta => {
            const info = REDES_INFO[conta.provider]
            return (
              <div key={conta.provider} className="border border-gray-200 rounded-2xl p-4 bg-white space-y-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: info.cor }}
                >
                  {info.label[0]}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">{info.label}</p>
                  {conta.nome && <p className="text-xs text-gray-400 truncate">{conta.nome}</p>}
                </div>
                <span className="text-xs text-green-600 bg-green-50 rounded-full px-2 py-0.5">Conectada</span>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center space-y-3">
          <p className="text-3xl">📱</p>
          <p className="text-sm font-medium text-gray-700">Conecte suas redes sociais</p>
          <p className="text-xs text-gray-400">
            Publique conteúdo e monitore comentários de Instagram, Facebook, Google Business e YouTube.
          </p>
          <Link
            href="/social/contas"
            className="inline-block bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Conectar contas
          </Link>
        </div>
      )}

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/social/inbox"
          className="flex items-center gap-4 border border-gray-200 rounded-2xl p-5 bg-white hover:bg-gray-50 transition-colors group"
        >
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 group-hover:bg-brand-100 transition-colors">
            <InboxIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Caixa de entrada</p>
            <p className="text-xs text-gray-400">Comentários e DMs de todas as redes</p>
          </div>
          <ChevronRightIcon className="w-4 h-4 text-gray-300 ml-auto" />
        </Link>

        <Link
          href="/social/publicar"
          className="flex items-center gap-4 border border-gray-200 rounded-2xl p-5 bg-white hover:bg-gray-50 transition-colors group"
        >
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 group-hover:bg-brand-100 transition-colors">
            <PencilIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Criar post</p>
            <p className="text-xs text-gray-400">Publique em múltiplas redes de uma vez</p>
          </div>
          <ChevronRightIcon className="w-4 h-4 text-gray-300 ml-auto" />
        </Link>
      </div>

      {/* Link para gerenciar contas */}
      <div className="flex justify-end">
        <Link href="/social/contas" className="text-xs text-brand-600 hover:underline">
          Gerenciar contas conectadas →
        </Link>
      </div>
    </div>
  )
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
    </svg>
  )
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  )
}
