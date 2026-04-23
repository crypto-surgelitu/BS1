import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/login': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/signup': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/admin/login': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/csrf-token': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})