import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Aapka App Ka Naam',        // <-- Yahan apna naam likhein
        short_name: 'ShortName',           // <-- Chhota naam
        description: 'Mera Pehla PWA App!',
        theme_color: '#ffffff',
        background_color: '#000000',
        display: 'standalone',             // <-- Ye line app ko alag window mein kholegi
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          }
        ]
      }
    })
  ]
});