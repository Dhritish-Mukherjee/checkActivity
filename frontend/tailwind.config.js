/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a3a5c',
        secondary: '#2a6fa5',
        accent: '#f0a030',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        dark: '#1a1a2e',
        light: '#f8f9fa',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
