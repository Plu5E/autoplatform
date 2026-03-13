/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e8edf8',
          100: '#c5d0ef',
          500: '#2a52c9',
          700: '#1a3a8f',
          900: '#0e1f50',
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
