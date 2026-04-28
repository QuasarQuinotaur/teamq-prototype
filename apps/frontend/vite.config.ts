import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  envDir: path.resolve(__dirname, "../../"),
  /**
   * Proxy API through the dev server so long requests (e.g. AI summary) are less likely to be
   * dropped by the browser than a bare cross-origin call to :3000 (common on Safari).
   * Use VITE_BACKEND_URL=http://localhost:5173 (same port as Vite) so /api hits this proxy.
   */
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
        timeout: 600_000,
        proxyTimeout: 600_000,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
  preview: {
    host: true,
    allowedHosts: ['localhost', '.onrender.com'],
    proxy: {
      '/api': 'http://localhost:3000'
  }
  },
})
