import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/login',
  '/cadastro',
  '/onboarding',
  '/convite',
  '/recuperar-senha',
  '/redefinir-senha',
  '/precos',
  '/triagem',
  '/avaliacao',
  '/agendar',
  '/api/auth',
  '/api/triagens/responder',
  '/api/avaliacoes/responder',
  '/api/google/callback',
  '/api/stripe/webhook',
  '/api/agendar',
]

const WHATSAPP_PATHS = [
  '/chat/profissional',
  '/chat/equipe',
  '/chat/interno',
  '/whatsapp',
  '/api/whatsapp',
]

const SOCIAL_PATHS = [
  '/social',
  '/api/social',
]

function isApiPath(pathname: string) {
  return pathname.startsWith('/api/')
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p)) || pathname === '/'

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(cookie =>
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    )
    return redirectResponse
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(cookie =>
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    )
    return redirectResponse
  }

  // Module gating: only query DB when the path requires a non-default module
  if (user) {
    const requiresWhatsapp = WHATSAPP_PATHS.some(p => pathname.startsWith(p))
    const requiresSocial = SOCIAL_PATHS.some(p => pathname.startsWith(p))

    if (requiresWhatsapp || requiresSocial) {
      const { data: terapeuta } = await supabase
        .from('terapeutas')
        .select('enabled_modules')
        .eq('id', user.id)
        .single()

      const enabledModules: string[] = terapeuta?.enabled_modules ?? ['agenda']

      if (requiresWhatsapp && !enabledModules.includes('whatsapp')) {
        if (isApiPath(pathname)) {
          return NextResponse.json({ error: 'Módulo não contratado' }, { status: 403 })
        }
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        url.searchParams.set('modulo', 'indisponivel')
        const redirectResponse = NextResponse.redirect(url)
        supabaseResponse.cookies.getAll().forEach(cookie =>
          redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
        )
        return redirectResponse
      }

      if (requiresSocial && !enabledModules.includes('social')) {
        if (isApiPath(pathname)) {
          return NextResponse.json({ error: 'Módulo não contratado' }, { status: 403 })
        }
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        url.searchParams.set('modulo', 'indisponivel')
        const redirectResponse = NextResponse.redirect(url)
        supabaseResponse.cookies.getAll().forEach(cookie =>
          redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
        )
        return redirectResponse
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon-192.png|icon-512.png|manifest.json|robots.txt).*)'],
}
