/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lavender: '#b9b8f2',
        navy: '#0b0b2b',
        orange: '#ff8a1e',
        red: '#e63b2e',
        yellow: '#ffc900',
        green: '#33ff66',
        dark: '#111111',
      },
      fontFamily: {
        heading: ['"Anton"', 'sans-serif'],
        tech: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'brutal-sm': '3px 3px 0 #111111',
        'brutal': '5px 5px 0 #111111',
        'brutal-lg': '7px 7px 0 #111111',
        'brutal-orange': '4px 4px 0 #ff8a1e',
        'brutal-yellow': '4px 4px 0 #ffc900',
        'brutal-green': '4px 4px 0 #33ff66',
      }
    },
  },
  plugins: [],
}
