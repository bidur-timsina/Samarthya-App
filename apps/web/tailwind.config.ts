import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e8edf7',
          100: '#c5d0eb',
          200: '#9fb1dd',
          300: '#7892cf',
          400: '#5a7ac5',
          500: '#3B63BB',
          600: '#2d52a8',
          700: '#1f3e8e',
          800: '#1A3A8A',
          900: '#0D2B6B',
          950: '#071843',
        },
        dark: {
          bg:      '#0D1117',
          surface: '#161B22',
          card:    '#1C2230',
          border:  '#2A3346',
          muted:   '#8B96A7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #0D2B6B 0%, #1A3A8A 50%, #3B63BB 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
