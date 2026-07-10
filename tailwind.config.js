/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF7F2',
        forest: {
          50: '#f0f4e8',
          100: '#ddeac7',
          200: '#b8d28a',
          300: '#8fb84d',
          400: '#6fa030',
          500: '#2D5016',
          600: '#254312',
          700: '#1c340e',
          800: '#12250a',
          900: '#091506',
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
