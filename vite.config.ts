import { sentryVitePlugin } from "@sentry/vite-plugin";
/// <reference types="vitest" />
import { defineConfig } from "vite"

export default defineConfig({
  test: {
    // ... Specify options here.
  },

  build: {
    sourcemap: true
  },

  plugins: [sentryVitePlugin({
    org: "sfujimotosfujimoto",
    project: "school-hub-remix"
  })]
})