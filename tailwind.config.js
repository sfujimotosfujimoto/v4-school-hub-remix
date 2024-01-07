/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    fontFamily: {
      sans: ["Josefin Sans", "Zen Kaku Gothic New", "sans-serif"],
    },
    extend: {
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-6deg)" },
          "50%": { transform: "rotate(6deg)" },
        },
      },
      animation: {
        "pulse-slow": "pulse 3s linear infinite",
        wiggle: "wiggle 0.5s ease-in-out infinite",
      },
      colors: {
        sfgreen: {
          50: "hsl(182, 70%, 80%)",
          100: "hsl(182, 65%, 75%)",
          200: "hsl(182, 60%, 70%)",
          300: "hsl(182, 55%, 65%)",
          400: "hsl(182, 50%, 60%)",
          500: "hsl(182, 45%, 55%)",
          600: "hsl(182, 40%, 50%)",
        },
        sfred: {
          50: "hsl(1, 80%, 85%)",
          100: "hsl(1, 75%, 80%)",
          200: "hsl(1, 70%, 75%)",
          300: "hsl(1, 65%, 70%)",
          400: "hsl(1, 60%, 65%)",
          500: "hsl(1, 55%, 60%)",
          600: "hsl(1, 50%, 55%)",
        },
        sfyellow: {
          50: "hsl(33, 80%, 85%)",
          100: "hsl(33, 75%, 80%)",
          200: "hsl(33, 70%, 75%)",
          300: "hsl(33, 65%, 70%)",
          400: "hsl(33, 60%, 65%)",
          500: "hsl(33, 55%, 60%)",
          600: "hsl(33, 50%, 55%)",
        },
        sfblue: {
          200: "hsl(215, 31%, 42%)",
          300: "hsl(215, 31%, 32%)",
          400: "hsl(215, 31%, 22%)",
          500: "hsl(215, 31%, 12%)",
        },
        sftext: {
          900: "hsl(215, 31%, 18%)",
        },
      },
      height: {
        screen: ["100vh", "100dvh"],
      },
      minHeight: {
        screen: ["100vh", "100dvh"],
      },
      maxHeight: {
        screen: ["100vh", "100dvh"],
      },
      gridTemplateColumns: {
        sidebar: "200px 1fr",
      },
      gridTemplateRows: {
        layout: "auto 1fr auto",
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: "hsl(182, 50%, 60%)",

          secondary: "hsl(1, 65%, 70%)a",

          accent: "hsl(33, 70%, 75%)",

          neutral: "hsl(182, 50%, 60%)",

          "base-100": "#ffffff",

          info: "hsl(182, 50%, 60%)",

          success: "hsl(182, 50%, 60%)",

          warning: "hsl(33, 70%, 75%)",

          error: "hsl(1, 65%, 70%)",
        },
      },
      // "winter",
    ],
  },
}
