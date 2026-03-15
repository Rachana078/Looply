import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#8EC4DC',
          DEFAULT: '#4A87AC',
          dark: '#3A779C',
        },
        accent: {
          light: '#F0A87A',
          DEFAULT: '#D06028',
          dark: '#B85020',
        },
      },
    },
  },
  plugins: [],
}

export default config

