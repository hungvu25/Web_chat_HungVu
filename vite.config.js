import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Cho phép truy cập từ bên ngoài
    strictPort: false,
    allowedHosts: ['.ngrok-free.app'], // Cho phép tất cả subdomain ngrok
    hmr: {
      clientPort: 443 // Cho ngrok
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      // Proxy Socket.IO to backend to avoid mixed content when using ngrok
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
