import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/live-price': 'http://localhost:3000',
      '/prediction-data': 'http://localhost:3000',
      '/technical-analysis': 'http://localhost:3000',
      '/trading-signals': 'http://localhost:3000',
      '/support-resistance': 'http://localhost:3000',
      '/latest-prediction': 'http://localhost:3000',
      '/predict': 'http://localhost:3000',
      '/socket.io': { target: 'http://localhost:3000', ws: true },
    },
  },
});
