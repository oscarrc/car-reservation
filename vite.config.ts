import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import path from "path"
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(), 
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'favicon.svg'],
      manifest: {
        name: 'Car Reservation Management',
        short_name: 'CarReservation',
        description: 'A car reservation management system for teachers and administrators',
        theme_color: '#171717',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon_x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: 'icon_x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: 'icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable monochrome'
          }
        ]
      }
    })
  ],
  server: {
    watch: {
      usePolling: true,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tooltip'
          ],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'data-vendor': ['@tanstack/react-query', '@tanstack/react-table'],
          'date-vendor': ['date-fns', 'react-day-picker'],
          'chart-vendor': ['recharts'],
          'i18n-vendor': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          'utils-vendor': ['lucide-react', 'clsx', 'tailwind-merge', 'class-variance-authority', 'sonner', 'cmdk', 'next-themes'],
          
          // Feature chunks
          'admin-pages': [
            './src/pages/Admin/index.tsx',
            './src/pages/Admin/Fleet/index.tsx',
            './src/pages/Admin/Fleet/Car.tsx',
            './src/pages/Admin/Reservations/index.tsx',
            './src/pages/Admin/Reservations/Reservation.tsx',
            './src/pages/Admin/Users/index.tsx',
            './src/pages/Admin/Users/User.tsx',
            './src/pages/Admin/Users/AllowedEmails.tsx',
            './src/pages/Admin/Settings.tsx'
          ],
          'app-pages': [
            './src/pages/App/index.tsx',
            './src/pages/App/Fleet.tsx',
            './src/pages/App/Reservations/index.tsx',
            './src/pages/App/Reservations/Reservation.tsx',
            './src/pages/App/Onboarding.tsx'
          ],
          'auth-pages': [
            './src/pages/Auth/Login.tsx',
            './src/pages/Auth/Register.tsx',
            './src/pages/Auth/Forgot.tsx',
            './src/pages/Auth/Reset.tsx'
          ]
        }
      }
    }
  },
})
