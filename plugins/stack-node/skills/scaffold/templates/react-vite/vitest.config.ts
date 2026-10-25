import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'

// Separate from vite.config.ts so test-only settings don't leak into the build.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // The API client reads VITE_API_URL; pin it so MSW handlers match a known origin.
    env: { VITE_API_URL: 'http://localhost' },
  },
})
