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
        background: "#080C14",
        surface: "#0F172A",
        surfaceCard: "#131E35",
        surfaceBorder: "#1E293B",
        gold: {
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
        },
        emerald: {
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
        },
        telebirr: {
          light: "#E0F2FE",
          DEFAULT: "#0284C7",
          dark: "#0369A1",
        },
        chapa: {
          light: "#DCFCE7",
          DEFAULT: "#16A34A",
          dark: "#15803D",
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "Inter", "sans-serif"],
        heading: ["var(--font-outfit)", "Inter", "sans-serif"],
      },
      boxShadow: {
        glowGold: "0 0 25px -5px rgba(245, 158, 11, 0.3)",
        glowEmerald: "0 0 25px -5px rgba(16, 185, 129, 0.3)",
        glowTelebirr: "0 0 25px -5px rgba(2, 132, 199, 0.4)",
      },
      animation: {
        'shimmer': 'shimmer 2.5s infinite linear',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'hologram': 'hologram 4s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        hologram: {
          '0%, 100%': { opacity: 0.6, filter: 'hue-rotate(0deg)' },
          '50%': { opacity: 0.9, filter: 'hue-rotate(45deg)' },
        }
      }
    },
  },
  plugins: [],
};
