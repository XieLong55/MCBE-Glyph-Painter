import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.jpg', 'favicon.png', 'icon-192.png', 'icon-512.png', 'icon-144.png', 'screenshot-narrow.png', 'glyph_E0.png', 'glyph_E1.png', 'vite.svg'],
      manifest: {
        name: 'MCBE Glyph Painter',
        short_name: 'Glyph Painter',
        description: 'A tool for creating Minecraft Bedrock Edition glyphs',
        theme_color: '#3182ce',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: 'icon-144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        screenshots: [
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'wide',
            label: 'MCBE Glyph Painter'
          },
          {
            src: 'screenshot-narrow.png',
            sizes: '1080x1920',
            type: 'image/png',
            label: 'MCBE Glyph Painter'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    }),
  ],
})
