import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
    resolve: {
    alias: {
      'chess.js': path.resolve(__dirname, 'local-mods/chess.js/dist/esm/chess.js'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    headers: {
      'Cache-Control': 'no-store',
    },
    watch: {
      usePolling: true,
    },
  },
  base: '/',
});
