import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.vegagerdin.is' },
      { protocol: 'http', hostname: '*.vegagerdin.is' },
      { protocol: 'https', hostname: 'vegasja.vegagerdin.is' },
    ],
  },
}

export default nextConfig
