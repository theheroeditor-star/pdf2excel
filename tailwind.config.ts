/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#172033',
        muted: '#667085',
        cloud: '#f6f8fc',
        brand: '#3659e3',
      },
      boxShadow: {
        soft: '0 20px 60px rgba(23, 32, 51, 0.08)',
      },
    },
  },
  plugins: [],
};
