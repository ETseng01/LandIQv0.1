/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#065f46', // emerald-800
          hover: '#064e3b', // emerald-900
        },
        secondary: {
          DEFAULT: '#404040', // neutral-700
          hover: '#262626', // neutral-800
        },
        accent: {
          DEFAULT: '#059669', // emerald-600
          hover: '#047857', // emerald-700
        },
        background: {
          light: '#f0fdf4', // emerald-50
          dark: '#fafafa', // neutral-50
        }
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        body: ['Open Sans', 'sans-serif'],
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'fadeIn': 'fadeIn 0.5s ease-in-out',
        'slideUp': 'slideUp 0.5s ease-in-out',
        'slideDown': 'slideDown 0.5s ease-in-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        'gradient': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        'fadeIn': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slideUp': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slideDown': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'soft': '0px 4px 24px rgba(0, 0, 0, 0.12)',
        'hover': '0px 8px 32px rgba(0, 0, 0, 0.16)',
      },
    },
  },
  plugins: [],
}