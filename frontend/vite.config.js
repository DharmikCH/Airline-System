import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The backend only accepts requests from CLIENT_URL (localhost:5173).
    // If this port is busy Vite would quietly move to 5174, and every API call
    // would then fail with a confusing CORS error. Failing loudly is clearer.
    strictPort: true
  }
});
