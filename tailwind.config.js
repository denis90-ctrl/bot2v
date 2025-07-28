/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        purple: {
          400: '#C084FC',
          500: '#b26ef0',
          600: '#a855f7',
        },
        gray: {
          900: '#0D0D0D',
          800: '#1A1A1A',
          700: '#2A2A2A',
          600: '#3A3A3A',
        }
      },
      fontFamily: {
        'space-grotesk': ['Space Grotesk', 'sans-serif'],
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'glow': {
          '0%': { boxShadow: '0 0 20px rgba(192, 132, 252, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(192, 132, 252, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
