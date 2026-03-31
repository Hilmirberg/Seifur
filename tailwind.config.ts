import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        road: {
          open: '#22c55e',
          slippery: '#eab308',
          difficult: '#f97316',
          closed: '#ef4444',
          unknown: '#6b7280',
        },
      },
    },
  },
  plugins: [],
}

export default config
