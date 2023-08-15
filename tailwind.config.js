import daisyui from "daisyui";
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  daisyui: {
    themes: [
      "light",
      "dark",
      "cupcake",
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
