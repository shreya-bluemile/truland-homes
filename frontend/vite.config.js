import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development, /api requests are forwarded to the Laravel server so no CORS setup is needed.
// 127.0.0.1 (not localhost): Node may resolve localhost to IPv6, while `php artisan serve` listens on IPv4.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
})
