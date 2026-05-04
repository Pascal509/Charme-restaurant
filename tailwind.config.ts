import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}", "./src/features/**/*.{ts,tsx}", "./src/hooks/**/*.{ts,tsx}", "./src/lib/**/*.{ts,tsx}", "./src/services/**/*.{ts,tsx}", "./src/store/**/*.{ts,tsx}", "./src/types/**/*.{ts,tsx}"] ,
  theme: {
    extend: {
      colors: {
        brand: {
          cinnabar: "var(--brand-cinnabar)",
          jade: "var(--brand-jade)",
          ink: "var(--brand-ink)",
          rice: "var(--brand-rice)",
          gold: "var(--brand-gold)",
          obsidian: "var(--brand-obsidian)",
          seal: "var(--brand-seal)"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        cjk: ["var(--font-cjk)", "sans-serif"]
      },
      boxShadow: {
        soft: "0 20px 50px rgba(0, 0, 0, 0.35)",
        crisp: "0 12px 30px rgba(0, 0, 0, 0.28)",
        focus: "0 0 0 3px rgba(201, 169, 110, 0.35)"
      },
      borderRadius: {
        sm: "6px",
        md: "12px",
        lg: "18px"
      }
    }
  },
  plugins: []
};

export default config;
