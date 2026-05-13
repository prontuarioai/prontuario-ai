import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0fafa',
          100: '#ccf2f0',
          200: '#99e5e1',
          300: '#5dd0cb',
          400: '#2bb5af',
          500: '#149994',
          600: '#0d7c78',
          700: '#0b6360',
          800: '#0a4f4c',
          900: '#083d3a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
