import { sentryVitePlugin } from "@sentry/vite-plugin"
/// <reference types="vitest" />
import { vitePlugin as remix } from "@remix-run/dev"
import { installGlobals } from "@remix-run/node"
import { defineConfig } from "vite"
import { vercelPreset } from "@vercel/remix/vite"
import tsConfigPaths from "vite-tsconfig-paths"

installGlobals()

export default defineConfig({
  test: {
    // ... Specify options here.
  },

  server: {
    port: 4000,
  },

  build: {
    sourcemap: true,
  },

  plugins: [
    remix({ presets: [vercelPreset()] }),
    tsConfigPaths(),
    sentryVitePlugin({
      org: "sfujimotosfujimoto",
      project: "school-hub-remix",
    }),
  ],
})
