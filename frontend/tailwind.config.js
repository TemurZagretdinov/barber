/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      colors: {
        // Core ink / surface
        ink: "#0d0d0f",
        muted: "#8b95aa",
        line: "#e8ebf0",
        canvas: "#f4f5f7",
        surface: "#ffffff",
        // Gold accent — luxury feel
        gold: {
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#c9a84c",
          600: "#a8873a",
          700: "#8a6b28",
          DEFAULT: "#c9a84c",
        },
        // Extended neutral palette
        slate: {
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },
      boxShadow: {
        // Legacy kept for backward compat
        soft:  "0 24px 60px rgba(15, 23, 42, 0.12)",
        card:  "0 1px 2px rgba(15, 23, 42, 0.04)",
        // New premium shadows
        panel: "0 4px 24px rgba(15, 23, 42, 0.07), 0 1px 2px rgba(15, 23, 42, 0.04)",
        float: "0 8px 32px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(15, 23, 42, 0.06)",
        glow:  "0 0 0 3px rgba(201, 168, 76, 0.18)",
        modal: "0 32px 80px rgba(15, 23, 42, 0.24)",
        "glow-sm": "0 0 0 2px rgba(201, 168, 76, 0.20)",
      },
      borderRadius: {
        "3xl": "1.5rem",
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%":   { opacity: "0", transform: "scale(0.94)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideDown: {
          "0%":   { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0.4" },
        },
        popIn: {
          "0%":   { opacity: "0", transform: "scale(0.80)" },
          "70%":  { transform: "scale(1.05)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        shimmer:    "shimmer 1.6s infinite linear",
        "fade-up":  "fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in":  "fadeIn 0.3s ease both",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.22,1,0.36,1) both",
        "slide-down": "slideDown 0.25s cubic-bezier(0.22,1,0.36,1) both",
        "pop-in":   "popIn 0.4s cubic-bezier(0.22,1,0.36,1) both",
        pulse:      "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

