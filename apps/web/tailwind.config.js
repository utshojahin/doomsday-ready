/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cinematic: {
          bg: '#09090B',
          card: '#15171C',
          'card-hover': '#1C1F26',
          'card-border': '#262A35',
          red: '#E53935',
          'red-hover': '#D32F2F',
          gold: '#F5C518',
          'gold-hover': '#E5B508',
          text: '#FAFAFA',
          muted: '#A1A1AA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'cinematic': '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
        'cinematic-red': '0 8px 24px -4px rgba(229, 57, 53, 0.3)',
        'cinematic-gold': '0 8px 24px -4px rgba(245, 197, 24, 0.25)',
      },
    },
  },
  plugins: [],
}


