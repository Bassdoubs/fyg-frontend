/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        accent: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        blue: {
          // Couleurs compatibles avec le mode sombre
          '100': '#dbeafe',
          '200': '#bfdbfe',
          '300': '#93c5fd',
          '400': '#60a5fa',
          '500': '#3b82f6',
          '600': '#2563eb',
          '700': '#1d4ed8',
          '800': '#1e40af',
          '900': '#1e3a8a',
        },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'float': 'float 6s ease-in-out infinite',
        'gradient': 'gradient 8s ease infinite',
        'shine': 'shine 1.5s ease-in-out',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        shine: {
          '0%': { 
            backgroundPosition: '-100%',
            opacity: 0.5,
          },
          '100%': { 
            backgroundPosition: '200%',
            opacity: 1,
          },
        },
      },
      boxShadow: {
        card: '0 4px 16px rgba(79, 70, 229, 0.1)',
        'card-hover': '0 8px 24px rgba(79, 70, 229, 0.2)',
        'card-dark': '0 4px 16px rgba(0, 0, 0, 0.4)',
        'card-dark-hover': '0 8px 24px rgba(0, 0, 0, 0.5)',
        'button': '0 4px 12px rgba(79, 70, 229, 0.2)',
        'button-hover': '0 8px 20px rgba(79, 70, 229, 0.3)',
        'glow': '0 0 20px rgba(99, 102, 241, 0.4)',
        'glow-pink': '0 0 20px rgba(236, 72, 153, 0.4)',
      },
      backgroundImage: {
        'gradient-light': 'linear-gradient(135deg, #f8fafc, #eff6ff, #eef2ff)',
        'gradient-dark': 'linear-gradient(135deg, #0f172a, #1e1b4b, #0f172a)',
        'gradient-brand': 'linear-gradient(135deg, #4f46e5, #3730a3)',
        'gradient-accent': 'linear-gradient(135deg, #ec4899, #be185d)',
        'gradient-shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
        'gradient-shimmer-dark': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
        'gradient-conic': 'conic-gradient(from 180deg, #4f46e5, #ec4899, #4f46e5)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
    },
  },
  plugins: [],
} 