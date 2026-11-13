import type { Config } from "tailwindcss";

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
        ink: "#1c2b27",
        alert: "#9a5b00",
        danger: "#a51d1d"
      },
      maxWidth: { prose2: "42rem" }
    }
  },
  plugins: []
};

export default config;
