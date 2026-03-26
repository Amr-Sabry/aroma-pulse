/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#0f1117",
        "surface-2": "#161922",
        "surface-3": "#1e2330",
        border: "#2a2f3e",
        primary: {
          DEFAULT: "#7c3aed",
          hover: "#6d28d9",
          light: "#a78bfa",
        },
        accent: {
          green: "#22c55e",
          red: "#ef4444",
          yellow: "#f59e0b",
          orange: "#f97316",
          sky: "#0ea5e9",
          purple: "#a855f7",
        },
      },
      fontFamily: {
        brand: ["var(--font-orbitron)", "sans-serif"],
        ui: ["var(--font-outfit)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.4)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.6)",
        glow: "0 0 20px rgba(124,58,237,0.4)",
        "glow-green": "0 0 20px rgba(34,197,94,0.4)",
      },
      borderRadius: {
        card: "1.5rem",
        inner: "1rem",
        btn: "0.75rem",
        badge: "1.25rem",
        pill: "3rem",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-right": "slideRight 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideRight: {
          from: { opacity: "0", transform: "translateX(-10px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
