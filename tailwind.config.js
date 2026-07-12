/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF7F2',
        forest: {
          50: '#FFF5B8',
          100: '#FFEE94',
          200: '#FBE070',
          300: '#F7D34E',
          400: '#F2C94C',
          500: '#F2C94C',
          600: '#D9A62E',
          700: '#B8860B',
          800: '#8C6608',
          900: '#5C4305',
        },
        gold: {
          50: '#fdf8ec',
          100: '#f9edca',
          200: '#f3d98a',
          300: '#edc34d',
          400: '#C9A84C',
          500: '#b8922a',
          600: '#9a7820',
          700: '#7a5e18',
          800: '#5c4611',
          900: '#3d2e0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
