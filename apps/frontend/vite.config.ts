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
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  preview: {
    host: true,
    allowedHosts: ['localhost', '.onrender.com'],
    proxy: {
      '/api': 'http://localhost:3000',
      '/login': 'http://localhost:3000',
      '/logout': 'http://localhost:3000',
      '/callback': 'http://localhost:3000',
      '/upload': 'http://localhost:3000',
      '/employees': 'http://localhost:3000',
      '/employee': 'http://localhost:3000',
      '/content': 'http://localhost:3000',
      '/servicereqs': 'http://localhost:3000',
      '/assigned': 'http://localhost:3000',
  }
  },
})
