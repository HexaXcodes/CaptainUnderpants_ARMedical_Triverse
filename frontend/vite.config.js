import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    headers: {
      // AR.js uses eval() and loads its artoolkit WASM via a data: URI (base64
      // embedded in aframe-ar.js). Both 'wasm-unsafe-eval' and data: in
      // connect-src are required — without them artoolkit silently falls back
      // to a JS path that cannot detect custom .patt markers.
      'Content-Security-Policy':
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' http: https: data: blob: ws: wss:; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' data: blob:; img-src * data: blob:; media-src * blob: data:; connect-src * data: blob:; worker-src blob: data: 'self';"
    }
  },
  preview: {
    host: true,
    port: 5173
  }
});