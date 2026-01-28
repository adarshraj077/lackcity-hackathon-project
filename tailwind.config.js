/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      fontFamily: {
        heading: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        // Custom brand colors
        brand: {
          green: '#bfd200',
          blue: '#0466c8',
          red: '#ba181b',
          purple: '#9d4edd',
          light: '#e9ecef',
          dark: '#1b2021',
        }
      }
    },
  },
  plugins: [],
}
