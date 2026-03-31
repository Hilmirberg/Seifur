'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AppNavProps {
  orientation: 'horizontal' | 'vertical'
}

const NAV_ITEMS = [
  { label: 'Map',       href: '/map',       icon: '🗺️' },
  { label: 'Journey',   href: '/ferdaLag',  icon: '🚗' },
  { label: 'Weather',   href: '/weather',   icon: '🌦️' },
  { label: 'Roads',     href: '/roads',     icon: '🛣️' },
  { label: 'Cameras',   href: '/cameras',   icon: '📷' },
  { label: 'Avalanche', href: '/avalanche', icon: '⛰️' },
] as const

export default function AppNav({ orientation }: AppNavProps) {
  const pathname = usePathname()

  if (orientation === 'horizontal') {
    return (
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <span className="font-bold text-blue-700 text-xl tracking-tight">Seifur</span>
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ label, href, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${pathname.startsWith(href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  // Mobile bottom nav
  return (
    <div className="flex items-center justify-around h-14">
      {NAV_ITEMS.map(({ label, href, icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-0
            ${pathname.startsWith(href)
              ? 'text-blue-700'
              : 'text-gray-500'
            }`}
        >
          <span className="text-lg leading-none">{icon}</span>
          <span className="text-[10px] font-medium leading-none truncate max-w-[48px]">{label}</span>
        </Link>
      ))}
    </div>
  )
}
