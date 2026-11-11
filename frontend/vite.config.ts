import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    /* Dev requests to /api/* are proxied to the backend so the browser stays
       same-origin: `npm run dev` in backend/ listens on :5000, while
       `vercel dev` injects the backend service's URL as BACKEND_URL via the
       service binding declared in vercel.json. */
    proxy: {
      "/api": process.env.BACKEND_URL ?? "http://localhost:5000",
    },
  },
});
