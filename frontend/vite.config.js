import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In dev the UI runs on :5173 and the API on :8000 — proxy the API paths so the
// browser only ever talks to one origin (same as the bundled production setup,
// where FastAPI serves both). Override with VITE_API_URL if you need a remote API.
const API_TARGET = process.env.VITE_API_URL || 'http://localhost:8000'
const proxied = ['/api', '/auth', '/proposals', '/allocate', '/scoring', '/partners', '/stats', '/meta', '/health', '/docs', '/openapi.json']

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: Object.fromEntries(
      proxied.map((p) => [p, { target: API_TARGET, changeOrigin: true }]),
    ),
  },
})
