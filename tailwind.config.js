/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1800px",
      },
    },
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        label: "rgb(var(--label) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        label2: "rgb(var(--label-2) / <alpha-value>)",
        popover: "rgb(var(--popover) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        secondary: "rgb(var(--secondary) / <alpha-value>)",
        destructive: "rgb(var(--destructive) / <alpha-value>)",
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
