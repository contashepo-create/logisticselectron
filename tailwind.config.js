/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--primary)",
          light: "var(--primary-light)",
          dark: "var(--primary-dark)",
          glow: "var(--primary-glow)",
        },
      },
      fontFamily: {
        arabic: ["'IBM Plex Sans Arabic'", "'Segoe UI'", "Tahoma", "sans-serif"],
      },
    },
  },
  plugins: [],
};
