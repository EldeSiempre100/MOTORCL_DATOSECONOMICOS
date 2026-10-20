import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 3002, strictPort: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/\/node_modules\/(react|react-dom|react-is|scheduler)\//.test(id)) return 'react-vendor';
          if (id.includes('/node_modules/recharts/') || id.includes('/node_modules/d3-')) return 'charts-vendor';
          return undefined;
        },
      },
    },
  },
});
