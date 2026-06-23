'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getBrand } from '@/lib/brands'

type Role = 'admin' | 'profissional' | 'secretaria'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: Role[]
  modulo?: string
}

const nav: NavItem[] = [
  { href: '/dashboard',          label: 'Dashboard',              icon: HomeIcon,         roles: ['admin', 'profissional'] },
  { href: '/pacientes',          label: 'Pacientes',               icon: UsersIcon,        roles: ['admin', 'profissional'] },
  { href: '/agenda',             label: 'Agenda',                  icon: CalendarIcon,     roles: ['admin', 'profissional', 'secretaria'] },
  { href: '/sessoes',            label: 'Sessões',                  icon: ClipboardIcon,    roles: ['admin', 'profissional'] },
  { href: '/chat/profissional',  label: 'Chat do Profissional',   icon: ChatProIcon,      roles: ['admin', 'profissional'],               modulo: 'whatsapp' },
  { href: '/chat/equipe',        label: 'Chat de Agendamento',    icon: ChatEquipeIcon,   roles: ['admin', 'profissional', 'secretaria'], modulo: 'whatsapp' },
  { href: '/chat/interno',       label: 'Chat da Equipe',          icon: ChatInternoIcon,  roles: ['admin', 'profissional', 'secretaria'], modulo: 'whatsapp' },
  { href: '/whatsapp',           label: 'WhatsApp',                icon: WhatsAppIcon,     roles: ['admin', 'profissional'],               modulo: 'whatsapp' },
  { href: '/social',             label: 'Redes Sociais',           icon: ShareIcon,        roles: ['admin', 'profissional'],               modulo: 'social' },
  { href: '/configuracoes',      label: 'Configurações',           icon: CogIcon,          roles: ['admin', 'profissional', 'secretaria'] },
]

interface Props {
  terapeuta: {
    nome: string
    foto_url: string | null
    plano: string
    plano_cortesia?: boolean
    trial_fim: string
    role: string
    enabled_modules?: string[]
    brand_context?: string | null
  }
  eventosNaoLidos: number
  notificacoesNaoLidas: number
}

const roleLabel: Record<string, string> = {
  admin:        'Admin',
  profissional: 'Profissional',
  secretaria:   'Secretária',
}

export default function Sidebar({ terapeuta, eventosNaoLidos }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const role = (terapeuta.role ?? 'admin') as Role
  const enabledModules = terapeuta.enabled_modules ?? ['agenda']
  const brandName = getBrand(terapeuta.brand_context).name
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const visibleNav = nav.filter(item =>
    item.roles.includes(role) &&
    (item.modulo ? enabledModules.includes(item.modulo) : true)
  )

  return (
    <>
      {/* Botão hambúrguer — mobile only */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-30 p-2 rounded-xl bg-white border border-gray-200 shadow-sm text-gray-600"
        aria-label="Abrir menu"
      >
        <MenuIcon className="w-5 h-5" />
      </button>

      {/* Backdrop mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'flex flex-col h-full bg-white border-r border-gray-100 shrink-0 transition-all duration-200',
          collapsed ? 'md:w-16' : 'md:w-60',
          'fixed md:relative inset-y-0 left-0 z-50 md:z-auto w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        {/* Cabeçalho */}
        <div className="border-b border-gray-100 flex items-center h-[61px] px-3 gap-2">
          {!collapsed && (
            <span className="text-base font-bold text-brand-700 flex-1 truncate hidden md:block">
              {brandName}
            </span>
          )}
          <span className="text-base font-bold text-brand-700 flex-1 truncate md:hidden">
            {brandName}
          </span>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ml-auto shrink-0"
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-xl hover:bg-gray-100 text-gray-400 shrink-0 ml-auto"
            aria-label="Fechar menu"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {visibleNav.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={[
                  'flex items-center gap-3 py-2 rounded-xl text-sm font-medium transition-colors',
                  collapsed ? 'justify-center px-0' : 'px-3',
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                ].join(' ')}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="flex-1">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Banner cortesia */}
        {!collapsed && terapeuta.plano_cortesia && role === 'admin' && (
          <div className="mx-3 mb-3 bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-800">
            <p className="font-semibold">Acesso cortesia</p>
            <p className="text-purple-600">Acesso gratuito liberado</p>
          </div>
        )}

        {/* Banner trial */}
        {!collapsed && terapeuta.plano === 'trial' && !terapeuta.plano_cortesia && role === 'admin' && (
          <div className="mx-3 mb-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            <p className="font-medium">Trial gratuito</p>
            <p>Expira em {new Date(terapeuta.trial_fim).toLocaleDateString('pt-BR')}</p>
            <Link href="/configuracoes" className="text-amber-700 font-semibold underline">
              Assinar agora
            </Link>
          </div>
        )}

        {/* Usuário */}
        <div className={['border-t border-gray-100 p-3 flex items-center gap-2', collapsed ? 'justify-center' : ''].join(' ')}>
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm shrink-0">
            {terapeuta.nome.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{terapeuta.nome}</p>
                <p className="text-xs text-gray-400">{roleLabel[role] ?? role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg"
                title="Sair"
              >
                <LogoutIcon className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  )
}

// ── Ícones ──────────────────────────────────────────────

function MenuIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
}
function XIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
}
function ChevronLeftIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
}
function ChevronRightIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
}
function HomeIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
}
function UsersIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
}
function CalendarIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
}
function ClipboardIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
}
function ChatProIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
}
function ChatEquipeIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>
}
function ChatInternoIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
}
function WhatsAppIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.418A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M8.5 8.5c.5 1 1.5 2.5 3 3.5s2.5 1.5 3.5 2c.3.15.65.05.85-.2l.65-.9c.2-.25.55-.3.8-.1l2 1.4c.25.18.3.53.1.78-.8 1.1-2.1 1.7-3.4 1.52-2.1-.3-4.8-1.8-6.5-3.5s-3.2-4.4-3.5-6.5c-.18-1.3.42-2.6 1.52-3.4.25-.2.6-.15.78.1l1.4 2c.2.25.15.6-.1.8l-.9.65a.61.61 0 00-.2.85z" /></svg>
}
function ShareIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
}
function CogIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}
function LogoutIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
}
