import daisyui from "daisyui";
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  daisyui: {
    themes: [
      "cyberpunk",
      "dracula",
      "lofi",
      {
        mutedDark: {
          primary: "#111827",

          secondary: "#e5e7eb",

          accent: "#d1d5db",

          neutral: "#111827",

          "base-100": "#1f2937",

          info: "#60a5fa",

          success: "#4ade80",

          warning: "#fb923c",

          error: "#ef4444",
        },
      },
      {
        cookie: {
          primary: "#581b8e",

          secondary: "#84e863",

          accent: "#ffdec9",

          neutral: "#222a39",

          "base-100": "#454545",

          info: "#288de6",

          success: "#1d8c58",

          warning: "#f3b972",

          error: "#fc371d",
        },
      },
    ],
  },
  plugins: [daisyui],
};
