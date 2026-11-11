import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

import { webPreview } from "./web/preview-plugin.js";

export default defineConfig(({ mode }) => ({
  root: fileURLToPath(new URL("./", import.meta.url)),
  base: "./",
  plugins: ["web-preview", "web-pilot"].includes(mode) ? [react(), webPreview()] : [react()],
  build: { outDir: ({ "web-preview": "dist-web", "web-pilot": "dist-pilot" })[mode] ?? "dist" },
  server: { proxy: { "/api/mobile": "http://localhost:3002" } },
}));
