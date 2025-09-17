/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ecoGreen: "#4ADE80",
        ecoDark: "#166534",
        ecoTeal: "#0D9488",
        ecoTealLight: "#14B8A6",
        ecoCream: "#F9FAFB",
        ecoBlack: "#111827",
      },
    },
  },
  plugins: [],
}