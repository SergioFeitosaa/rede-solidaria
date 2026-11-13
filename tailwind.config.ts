import type { Config } from "tailwindcss";

/**
 * Tokens do design system.
 * Toda a identidade visual vive aqui: trocar a paleta ou a tipografia do produto
 * é mexer neste arquivo (e não em dezenas de classes espalhadas pelas telas).
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefbf6",
          100: "#d3f5e8",
          200: "#a9ead3",
          300: "#71d8b8",
          400: "#3cbf99",
          500: "#1ba381",
          600: "#0f8468",
          700: "#0d6a56",
          800: "#0d5445",
          900: "#0c453a",
          950: "#04271f"
        },
        sand: {
          50: "#faf8f4",
          100: "#f2eee5",
          200: "#e6dcc9",
          300: "#d6c4a4"
        },
        /* Superfícies e texto */
        canvas: "#f5f7f6",
        surface: "#ffffff",
        line: "#e3e8e5",
        muted: "#5c6b66",
        ink: "#16211e",
        /* Semânticos */
        alert: "#9a5b00",
        danger: "#a51d1d",
        success: "#0f7a5f"
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI Variable Text",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif"
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"]
      },
      fontSize: {
        /* Escala tipográfica explícita — evita "cada tela no seu tamanho" */
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.04em" }],
        xs: ["0.75rem", { lineHeight: "1.1rem" }],
        sm: ["0.875rem", { lineHeight: "1.35rem" }],
        base: ["1rem", { lineHeight: "1.6rem" }],
        lg: ["1.125rem", { lineHeight: "1.7rem" }],
        xl: ["1.375rem", { lineHeight: "1.9rem", letterSpacing: "-0.01em" }],
        "2xl": ["1.75rem", { lineHeight: "2.15rem", letterSpacing: "-0.015em" }],
        "3xl": ["2.125rem", { lineHeight: "2.5rem", letterSpacing: "-0.02em" }],
        "4xl": ["2.625rem", { lineHeight: "2.9rem", letterSpacing: "-0.025em" }],
        "5xl": ["3.25rem", { lineHeight: "3.4rem", letterSpacing: "-0.03em" }]
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.5rem",
        "4xl": "2rem"
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16, 34, 28, 0.04), 0 8px 24px -12px rgba(16, 34, 28, 0.18)",
        lift: "0 2px 4px rgba(16, 34, 28, 0.05), 0 18px 40px -18px rgba(16, 34, 28, 0.28)",
        deck: "0 24px 48px -24px rgba(16, 34, 28, 0.35)"
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      },
      animation: {
        "fade-up": "fade-up 0.24s ease-out both",
        "pop-in": "pop-in 0.2s ease-out both",
        shimmer: "shimmer 1.4s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
