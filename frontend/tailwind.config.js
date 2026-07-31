/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      colors: {
        logo: {
          green: '#109648',
          'green-dark': '#0b7838',
          'green-light': '#e8f5ed',
          orange: '#ff6600',
          'orange-dark': '#e05500',
          'orange-light': '#fff0e6',
        }
      }
    },
  },
  plugins: [],
}
