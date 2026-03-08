import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('lucide-react') || id.includes('recharts')) {
            return 'vendor-ui';
          }
          if (id.includes('date-fns')) {
            return 'vendor-utils';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
