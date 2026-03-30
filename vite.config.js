import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    legacy({
      targets: ['defaults', 'not IE 11', 'Chrome 50', 'Safari 10', 'Samsung 6.2'],
      polyfills: ['es.promise', 'es.array.iterator', 'es.object.assign', 'es.symbol', 'es.array.from'],
      modernPolyfills: true,
      renderLegacyChunks: true
    })
  ],
  build: {
    target: ['chrome50', 'es2015'],
    minify: 'terser',
    modulePreload: false, // CRITICAL: Stop using modern preloading which uses import.meta/import.meta.resolve
    cssTarget: 'chrome50',
    terserOptions: {
      compress: {
        defaults: true,
        drop_console: false,
      },
      format: {
        comments: false,
      },
      safari10: true,
    }
  },
  base: './', // CRITICAL for Capacitor/Old TVs blank screen fix
  server: {
    host: true
  }
})


