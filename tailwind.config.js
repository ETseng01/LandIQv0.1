/**
 * Tailwind CSS Configuration File
 * 
 * This configuration file for Tailwind CSS defines the paths to scan for class usage,
 * extends the default theme with custom styles such as fonts, animations, and shadows,
 * and lists plugins (currently none are used). It is set up to ensure the final CSS bundle
 * is optimized by only including styles that are actually used in the project.
 * 
 * Author: Evan Tseng
 * Date Created: 2/26/2025
 * Last Modified: 3/2/2025
 * 
 * Usage:
 * - Fonts: 'heading' for titles using 'Montserrat', 'body' for text using 'Open Sans'.
 * - Animations: Custom animations like 'gradient', 'fadeIn', 'slideUp', 'slideDown', and 'pulse-slow'.
 * - Box Shadows: Custom shadow styles 'soft' and 'hover' for different UI depth effects.
 * 
 * Ensure this configuration aligns with project standards and adjust paths or themes as necessary.
 */


/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
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
