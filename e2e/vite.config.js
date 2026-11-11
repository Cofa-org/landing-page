import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath } from 'node:url';

// Test server never loads the application's real .env files, including at startup.
const synthetic = {
  VITE_LANDING_BACKEND_URL: 'http://127.0.0.1:4179', VITE_LANDING_BACKEND_API_KEY: 'synthetic-only',
  VITE_LRS_URL: 'http://127.0.0.1:4179', VITE_LRS_API_KEY: 'synthetic-only',
  VITE_TURNSTILE_SITE_KEY: 'synthetic-only', VITE_THUMBMARKJS_API_KEY: 'synthetic-only',
  VITE_DEV: 'false', VITE_ENABLE_TEST_PERSONAS: 'false', VITE_SISTEMA_FRANCES_ON: 'false',
};
export default defineConfig({
  plugins: [react()], envDir: fileURLToPath(new URL('./empty-env', import.meta.url)),
  define: Object.fromEntries(Object.entries(synthetic).map(([name, value]) => [`import.meta.env.${name}`, JSON.stringify(value)])),
  server: { host: '127.0.0.1', port: 4179, strictPort: true, hmr: false },
});
