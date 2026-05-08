/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          deep: "#020817",
          card: "#0a0f1e",
          glass: "rgba(10,15,30,0.6)",
        },
        background: {
          primary: "#050d1a",
          card: "#0d1b2e",
          surface: "#0f2744",
          hover: "#1e3a5f",
        },
        ai: {
          blue: "#0ea5e9",
          indigo: "#6366f1",
          purple: "#8b5cf6",
          glow: "#38bdf8",
          cyan: "#22d3ee",
        },
        priority: {
          alta: "#ef4444",
          media: "#f59e0b",
          baja: "#10b981",
        },
        border: {
          thin: "#0ea5e920",
          blue: "#0ea5e9",
          indigo: "#6366f1",
        },
        text: {
          primary: "#f8fafc",
          secondary: "#94a3b8",
          muted: "#1e293b",
          mono: "#38bdf8",
          gradient: "transparent",
        },
        glow: {
          blue: "#0ea5e940",
          indigo: "#6366f140",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      keyframes: {
        borderGlow: {
          "0%, 100%": { borderColor: "#0ea5e920" },
          "50%": { borderColor: "#0ea5e9" },
        },
        shine: {
          "0%": { backgroundPosition: "0% 0%" },
          "50%": { backgroundPosition: "100% 100%" },
          "100%": { backgroundPosition: "0% 0%" },
        },
        gradient: {
          "100%": { backgroundPosition: "var(--bg-size, 300%) 0" },
        },
        meteor: {
          "0%": { transform: "rotate(var(--angle)) translateX(0)", opacity: "1" },
          "70%": { opacity: "1" },
          "100%": { transform: "rotate(var(--angle)) translateX(-500px)", opacity: "0" },
        },
      },
      animation: {
        borderGlow: "borderGlow 3s ease-in-out infinite",
        shine: "shine var(--duration) infinite linear",
        gradient: "gradient 8s linear infinite",
        meteor: "meteor 5s linear infinite",
      },
    },
  },
  plugins: [],
}

