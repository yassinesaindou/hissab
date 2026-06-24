import type { Config } from "tailwindcss";

const config: Config = {
  // ...your existing config (content, theme, plugins, etc.)
  theme: {
    extend: {
      // ...your existing extend
      keyframes: {
        scan: {
          "0%, 100%": { top: "0%" },
          "50%": { top: "calc(100% - 2px)" },
        },
      },
      animation: {
        scan: "scan 2s ease-in-out infinite",
      },
    },
  },
};

export default config;