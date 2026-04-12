import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/smart-irrigation/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router-dom/')) {
            return 'vendor-react';
          }

          if (id.includes('/echarts/') || id.includes('echarts-for-react')) {
            return 'vendor-echarts';
          }

          if (id.includes('/mqtt/')) {
            return 'vendor-mqtt';
          }

          if (id.includes('/jspdf/') || id.includes('/html2canvas/')) {
            return 'vendor-export';
          }

          if (id.includes('/dayjs/') || id.includes('/zustand/')) {
            return 'vendor-runtime';
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})
