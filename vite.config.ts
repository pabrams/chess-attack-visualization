import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isProduction = process.env.NODE_ENV === 'production';
const ghPagesMode = process.env.GH_PAGES === 'true';

export default defineConfig({
  plugins: [react()],
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
  base: ghPagesMode ? '/monkey-drill/' : '/',
});
