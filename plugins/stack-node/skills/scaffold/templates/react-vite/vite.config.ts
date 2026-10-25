import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // The API answers on the dev server's own origin, as the web server does in production.
    proxy: {
      '/api': { target: loadEnv(mode, process.cwd(), '').VITE_API_URL || 'http://localhost:5000', changeOrigin: true },
    },
  },
}))
