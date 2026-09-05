import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif']
      },
      colors: {
        ink: '#14211f',
        paper: '#f7faf8',
        mint: '#0f8b7b',
        saffron: '#c9731b',
        river: '#285e8e',
        danger: '#b42318'
      },
      boxShadow: {
        soft: '0 18px 45px rgba(20, 33, 31, 0.10)'
      }
    }
  },
  plugins: []
} satisfies Config;