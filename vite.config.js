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
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-forms': ['formik', 'jose'],
          'vendor-pdf': ['jspdf'],
          'vendor-ai': ['@google/generative-ai'],
          'vendor-ui': ['react-icons', 'react-dropzone'],
        },
      },
    },
  },
})
