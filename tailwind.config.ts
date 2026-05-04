import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#0969DA',
        secondary: '#8250DF',
        success: '#1A7F37',
        warning: '#9A6700',
        danger: '#CF222E',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"SF Mono"',
          '"Fira Code"',
          'Consolas',
          'monospace',
        ],
      },
      borderRadius: {
        primer: '6px',
      },
      boxShadow: {
        'primer-sm': '0 1px 3px rgba(31,35,40,0.12)',
        'primer-md': '0 3px 6px rgba(140,149,159,0.15)',
        'primer-lg': '0 8px 24px rgba(140,149,159,0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
export default config
