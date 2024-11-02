// theme.js
export const theme = {
    colors: {
      primary: {
        DEFAULT: '#2563EB', // Bright blue
        hover: '#1D4ED8',
        light: '#DBEAFE',
        dark: '#1E40AF'
      },
      secondary: {
        DEFAULT: '#10B981', // Emerald
        hover: '#059669',
        light: '#D1FAE5',
        dark: '#047857'
      },
      accent: {
        DEFAULT: '#8B5CF6', // Purple
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
    },
    spacing: {
      layout: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
      section: 'py-12 sm:py-16 lg:py-20',
      stack: 'space-y-6'
    },
    typography: {
      title: 'text-3xl font-bold tracking-tight text-neutral-900',
      subtitle: 'text-xl font-semibold text-neutral-700',
      body: 'text-base text-neutral-600',
      small: 'text-sm text-neutral-500'
    }
  };
  
  // Components reusable across the app
  export const components = {
    card: 'bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow duration-200',
    button: {
      primary: 'bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-colors',
      secondary: 'bg-secondary hover:bg-secondary-hover text-white font-medium py-2 px-4 rounded-lg transition-colors',
      outline: 'border border-neutral-300 hover:border-neutral-400 text-neutral-700 font-medium py-2 px-4 rounded-lg transition-colors'
    },
    input: 'w-full rounded-lg border border-neutral-300 px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent',
    label: 'block text-sm font-medium text-neutral-700 mb-1'
  };