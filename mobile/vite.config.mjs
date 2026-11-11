import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

import { webPreview } from "./web/preview-plugin.js";

export default defineConfig(({ mode }) => ({
  root: fileURLToPath(new URL("./", import.meta.url)),
  base: "./",
  plugins: mode === "web-preview" ? [react(), webPreview()] : [react()],
  build: { outDir: mode === "web-preview" ? "dist-web" : "dist" },
  server: { proxy: { "/api/mobile": "http://localhost:3002" } },
}));
