/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pitch: {
          DEFAULT: '#1b6e3c',
          dark: '#0f4d29',
          light: '#2f8a52',
        },
        panel: '#f4efe0',
        ink: '#17251d',
      },
      fontFamily: {
        retro: ['"Trebuchet MS"', '"Verdana"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
