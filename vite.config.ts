import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 5173,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: env.BRAND_NAME || 'Luxury Business Suite',
          short_name: env.BRAND_NAME || 'Luxury Suite',
          description: `Gestión de ${env.BRAND_NAME || 'Lujo'} Simplificada`,
          theme_color: '#D4AF37',
          background_color: '#050505',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            {
              src: 'https://cdn-icons-png.flaticon.com/512/3771/3771518.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'https://cdn-icons-png.flaticon.com/512/3771/3771518.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // React core — always needed, cache long-term
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
              return 'vendor-react';
            }
            // UI libraries: lucide, sonner, framer-motion
            if (id.includes('node_modules/lucide-react') || id.includes('node_modules/sonner') || id.includes('node_modules/framer-motion')) {
              return 'vendor-ui';
            }
            // Data & query: tanstack, zod
            if (id.includes('node_modules/@tanstack') || id.includes('node_modules/zod')) {
              return 'vendor-data';
            }
            // Charts: recharts
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
              return 'vendor-charts';
            }
            // Heavy utilities: xlsx (Excel), date-fns
            if (id.includes('node_modules/xlsx') || id.includes('node_modules/date-fns')) {
              return 'vendor-heavy';
            }
            // Supabase and API clients
            if (id.includes('node_modules/@supabase') || id.includes('node_modules/@google')) {
              return 'vendor-cloud';
            }
          }
        }
      }
    }
  }
});