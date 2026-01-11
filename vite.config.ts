import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // This defines global constants that will be replaced at build time.
  // This is the standard way to make process.env variables available in a Vite-based browser app.
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY),
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'esnext'
  }
});