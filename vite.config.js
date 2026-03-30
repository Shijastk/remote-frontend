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
      targets: ['defaults', 'not IE 11', 'Chrome 50'], // Extreme target
      modernTargets: ['chrome 50'], // Force the module version to also be very simple
      polyfills: ['es.promise', 'es.array.iterator', 'es.object.assign', 'es.symbol', 'es.array.from', 'es.promise.finally', 'es.set'],
      modernPolyfills: true,
      renderLegacyChunks: true
    })

  ],
  build: {
    target: 'es2015',
    minify: 'terser',
    modulePreload: false, // CRITICAL: Stop using modern preloading which uses import.meta.resolve
    cssTarget: 'chrome50',
    terserOptions: {
      compress: {
        defaults: true,
      },
      safari10: true,
    }
  },
  base: './', // CRITICAL for Capacitor/Old TVs blank screen fix
  server: {
    host: true
  }
})
