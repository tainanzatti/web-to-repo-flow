/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef5ff", 100: "#d9e8ff", 200: "#bcd7ff", 300: "#8ebdff",
          400: "#5996ff", 500: "#3385ff", 600: "#1b6bf6", 700: "#1454dc",
          800: "#1745b2", 900: "#193d8c", 950: "#15265a",
        },
        ink: {
          50: "#f6f7f9", 100: "#eceef2", 200: "#d4d8e0", 300: "#aeb5c4",
          400: "#828c9f", 500: "#636d82", 600: "#515868", 700: "#434850",
          800: "#3a3e46", 900: "#33363c", 950: "#1e2025",
        },
        success: {
          50: "#f0fdf4", 100: "#dcfce7", 200: "#bbf7d0", 300: "#86efac",
          400: "#4ade80", 500: "#22c55e", 600: "#16a34a", 700: "#15803d",
          800: "#166534", 900: "#14532d",
        },
        warning: {
          50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d",
          400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309",
          800: "#92400e", 900: "#78350f",
        },
        error: {
          50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5",
          400: "#f87171", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c",
          800: "#991b1b", 900: "#7f1d1d",
        },
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease-out",
        slideUp: "slideUp 0.3s ease-out",
        slideIn: "slideIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        slideIn: { from: { opacity: "0", transform: "translateX(-8px)" }, to: { opacity: "1", transform: "translateX(0)" } },
      },
    },
  },
  plugins: [],
};
