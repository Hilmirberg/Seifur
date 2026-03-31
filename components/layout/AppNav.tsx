'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'

interface AppNavProps {
  orientation: 'horizontal' | 'vertical'
}

const NAV_ITEMS = [
  { key: 'map',       href: '/map',       icon: '🗺️' },
  { key: 'ferdaLag',  href: '/ferdaLag',  icon: '🚗' },
  { key: 'weather',   href: '/weather',   icon: '🌦️' },
  { key: 'roads',     href: '/roads',     icon: '🛣️' },
  { key: 'cameras',   href: '/cameras',   icon: '📷' },
  { key: 'avalanche', href: '/avalanche', icon: '⛰️' },
] as const

function getCurrentLocale(): string {
  if (typeof document === 'undefined') return 'en'
  const match = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/)
  return match?.[1] ?? 'en'
}

export default function AppNav({ orientation }: AppNavProps) {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const [, startTransition] = useTransition()
  const [locale, setLocaleState] = useState<string>(() =>
    typeof document !== 'undefined' ? getCurrentLocale() : 'en'
  )

  function toggleLocale() {
    const next = locale === 'en' ? 'is' : 'en'
    document.cookie = `locale=${next}; path=/; max-age=31536000`
    setLocaleState(next)
    startTransition(() => {
      window.location.reload()
    })
  }

  if (orientation === 'horizontal') {
    return (
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <span className="font-bold text-blue-700 text-xl tracking-tight">Seifur</span>
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ key, href, icon }) => (
            <Link
              key={key}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${pathname.startsWith(href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
              <span>{icon}</span>
              <span>{t(key as keyof ReturnType<typeof t>)}</span>
            </Link>
          ))}
          <button
            onClick={toggleLocale}
            className="ml-3 px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            title="Toggle language / Skipta tungumáli"
          >
            {locale === 'en' ? 'IS' : 'EN'}
          </button>
        </div>
      </div>
    )
  }

  // Mobile bottom nav
  return (
    <div className="flex items-center justify-around h-14">
      {NAV_ITEMS.map(({ key, href, icon }) => (
        <Link
          key={key}
          href={href}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-0
            ${pathname.startsWith(href)
              ? 'text-blue-700'
              : 'text-gray-500'
            }`}
        >
          <span className="text-lg leading-none">{icon}</span>
          <span className="text-[10px] font-medium leading-none truncate max-w-[48px]">
            {t(key as keyof ReturnType<typeof t>)}
          </span>
        </Link>
      ))}
      <button
        onClick={toggleLocale}
        className="flex flex-col items-center gap-0.5 px-2 py-1 text-gray-500"
      >
        <span className="text-lg leading-none">🌐</span>
        <span className="text-[10px] font-medium">{locale === 'en' ? 'IS' : 'EN'}</span>
      </button>
    </div>
  )
}
