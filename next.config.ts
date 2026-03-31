import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.vegagerdin.is' },
      { protocol: 'http', hostname: '*.vegagerdin.is' },
      { protocol: 'https', hostname: 'vegasja.vegagerdin.is' },
    ],
  },
}

export default withNextIntl(nextConfig)
