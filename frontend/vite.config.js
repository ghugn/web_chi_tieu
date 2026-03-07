import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-ui': ['lucide-react', 'recharts'],
          'vendor-utils': ['date-fns']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
