import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: "8080",
    allowedHosts: ["75e45e9c-885d-42b6-965d-1d3b0dad2d9b-00-r2faw419s965.riker.replit.dev", ".replit.dev", "demand-scan-march-11-ianpilon.replit.app"],
  },
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
      {
        find: "lib",
        replacement: resolve(__dirname, "lib"),
      },
    ],
  },
});
