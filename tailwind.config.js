/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#DBEAFE',
          dark: '#1E40AF'
        },
        secondary: {
          DEFAULT: '#10B981',
          hover: '#059669',
          light: '#D1FAE5',
          dark: '#047857'
        },
        accent: {
          DEFAULT: '#8B5CF6',
          hover: '#7C3AED',
          light: '#EDE9FE',
          dark: '#6D28D9'
        },
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A'
        }
      }
    }
  },
  plugins: [],
}