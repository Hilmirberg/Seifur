import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import AppNav from '@/components/layout/AppNav'
import './globals.css'

export const metadata: Metadata = {
  title: 'Seifur — Iceland Weather & Roads',
  description: 'Live Iceland weather, road conditions, cameras and travel planning',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Seifur' },
}

export const viewport: Viewport = {
  themeColor: '#1d4ed8',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className="font-sans bg-gray-50 text-gray-900">
        <NextIntlClientProvider messages={messages}>
          <div className="flex flex-col min-h-screen">
            {/* Desktop top nav */}
            <header className="hidden md:block sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
              <AppNav orientation="horizontal" />
            </header>

            {/* Page content */}
            <main className="flex-1 pb-14 md:pb-0">
              {children}
            </main>

            {/* Mobile bottom nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
              <AppNav orientation="vertical" />
            </nav>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
