import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  esbuild: {
    drop: ['console', 'debugger'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Solo agrupar si es código de vendor real, no icons
          if (id.includes('node_modules')) {
            // React core - siempre juntos
            if (id.includes('react-dom') || id.includes('react/')) {
              return 'vendor-react'
            }
            // Forms y auth
            if (id.includes('formik') || id.includes('jose')) {
              return 'vendor-forms'
            }
            // PDF - solo cargar cuando se necesita (lazy load via dynamic import)
            if (id.includes('jspdf')) {
              return 'vendor-pdf'
            }
            // AI - no se usa en el simulador
            if (id.includes('@google/generative-ai')) {
              return 'vendor-ai'
            }
            // NO agrupar react-icons - dejar que cada subpath sea su propio chunk
            // Vite hace treeshaking mejor cuando no forzamos grupos
          }
        },
      },
    },
  },
})