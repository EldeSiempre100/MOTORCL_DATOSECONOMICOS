/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        paper: '#F5F4F0',
        ink: '#252724',
        accent: '#315d4f',
      },
      boxShadow: {
        'hairline': '0 1px 2px rgba(30, 30, 24, 0.025)',
      },
    },
  },
  plugins: [],
};
