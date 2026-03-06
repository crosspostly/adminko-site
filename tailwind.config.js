/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./site/public/**/*.{html,js}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#E50914",
        "primary-hover": "#b00303",
        "background-light": "#F9FAFB",
        "background-dark": "#111827",
        "surface-light": "#FFFFFF",
        "surface-dark": "#1F2937",
        "text-light": "#1F2937",
        "text-dark": "#F3F4F6",
        "text-muted-light": "#6B7280",
        "text-muted-dark": "#9CA3AF",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),
  ],
};