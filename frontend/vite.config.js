import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The backend only accepts requests from CLIENT_URL (localhost:5173). If
    // this port is busy, Vite would normally drift to 5174, where every API
    // call would then be blocked by CORS with a confusing browser error.
    // Failing loudly here is much easier to diagnose.
    strictPort: true
  }
});
