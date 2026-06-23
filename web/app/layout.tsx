import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import './globals.css'
import { brandFromHost, getBrand } from '@/lib/brands'

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get('host') ?? ''
  const brand = getBrand(brandFromHost(host))
  return {
    title: { default: brand.name, template: `%s | ${brand.name}` },
    description: brand.description,
    manifest: '/manifest.json',
    appleWebApp: { capable: true, statusBarStyle: 'default', title: brand.name },
  }
}

export const viewport: Viewport = {
  themeColor: '#0d9488',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const host = (await headers()).get('host') ?? ''
  const brandCtx = brandFromHost(host)

  return (
    <html lang="pt-BR" data-brand={brandCtx}>
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
