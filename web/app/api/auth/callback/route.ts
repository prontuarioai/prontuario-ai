import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'email' | 'recovery' | 'invite' | 'magiclink' | null
  const next = searchParams.get('next') ?? '/dashboard'

  const response = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          )
        },
      },
    }
  )

  const oauth_error = searchParams.get('error')
  const oauth_error_desc = searchParams.get('error_description')
  if (oauth_error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(oauth_error_desc ?? oauth_error)}`)
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    return response
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (error) return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    return response
  }

  return NextResponse.redirect(`${origin}/login?error=Parâmetros ausentes no callback.`)
}
