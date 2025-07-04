/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Couleurs de marque ÉQUATION TRAVAUX
        'equation': {
          'navy': '#000630',      // Bleu marine principal
          'gold': '#EDBD35',      // Jaune doré
          'white': '#FFFFFF',     // Blanc
          'navy-light': '#1a1f5c', // Variation plus claire du navy
          'navy-dark': '#000420',   // Variation plus foncée du navy
          'gold-light': '#f5d666', // Variation plus claire du gold
          'gold-dark': '#d4a429',  // Variation plus foncée du gold
        },
        // Couleurs fonctionnelles basées sur la palette
        'primary': {
          50: '#f0f1ff',
          100: '#e6e8ff',
          200: '#d1d6ff',
          300: '#b3bbff',
          400: '#8b96ff',
          500: '#6366f1',
          600: '#000630',
          700: '#000520',
          800: '#000415',
          900: '#00030a',
        },
        'secondary': {
          50: '#fefdf0',
          100: '#fefae6',
          200: '#fef3c7',
          300: '#fde68a',
          400: '#fcd34d',
          500: '#EDBD35',
          600: '#d4a429',
          700: '#b8891e',
          800: '#9c6f18',
          900: '#7c5914',
        },
        'success': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        'warning': {
          50: '#fefdf0',
          100: '#fefae6',
          200: '#fef3c7',
          300: '#fde68a',
          400: '#fcd34d',
          500: '#EDBD35',
          600: '#d4a429',
          700: '#b8891e',
          800: '#9c6f18',
          900: '#7c5914',
        },
        'error': {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'equation': '0 4px 6px -1px rgba(0, 6, 48, 0.1), 0 2px 4px -1px rgba(0, 6, 48, 0.06)',
        'equation-lg': '0 10px 15px -3px rgba(0, 6, 48, 0.1), 0 4px 6px -2px rgba(0, 6, 48, 0.05)',
        'equation-xl': '0 20px 25px -5px rgba(0, 6, 48, 0.1), 0 10px 10px -5px rgba(0, 6, 48, 0.04)',
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [],
};