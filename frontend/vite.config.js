import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    headers: {
      // AR.js uses eval() internally — required for marker pattern compilation
      'Content-Security-Policy':
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' http: https: data: blob: ws: wss:; img-src * data: blob:; media-src * blob: data:; connect-src *;"
    }
  },
  preview: {
    host: true,
    port: 5173
  }
});