/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'crypto-blue': '#627eea', // Ethereum blue
        'crypto-orange': '#f7931a', // Bitcoin orange
        'crypto-green': '#14f195', // Solana green
        'supabase': '#3ECF8E', // Supabase brand color
      },
    },
  },
  plugins: [],
};