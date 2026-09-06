import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT ?? '5173';

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Function form: the object form silently emitted an empty react-vendor
        // chunk while react/react-dom stayed in the entry chunk.
        manualChunks(id: string) {
          const normalizedId = id.replace(/\\/g, '/');
          if (!normalizedId.includes('/node_modules/')) return undefined;
          if (
            normalizedId.includes('/node_modules/react/') ||
            normalizedId.includes('/node_modules/react-dom/') ||
            normalizedId.includes('/node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }
          if (normalizedId.includes('/node_modules/@supabase/')) return 'supabase';
          if (normalizedId.includes('/node_modules/@paddle/')) return 'paddle';
          if (
            normalizedId.includes('/node_modules/recharts/') ||
            normalizedId.includes('/node_modules/d3-') ||
            normalizedId.includes('/node_modules/victory-vendor/')
          ) {
            return 'charts';
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET ?? 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
