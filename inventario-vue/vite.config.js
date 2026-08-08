import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import pkg from './package.json'

// A dónde manda el dev server las llamadas /api. Se sobrescribe con la
// variable de entorno VITE_API_TARGET para trabajar contra un backend local.
const API_TARGET = process.env.VITE_API_TARGET
  || 'https://inventario-app-production-e8c8.up.railway.app'

export default defineConfig({
  base: '/completa/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    outDir: '../completa',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],
  server: {
    proxy: {
      // Por defecto el dev server pega contra el backend de producción.
      // Para levantar el backend en local y probar endpoints nuevos antes de
      // pushear:  VITE_API_TARGET=http://localhost:3000 npm run dev
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: API_TARGET.startsWith('https'),
      },
    },
  },
  css: {
    preprocessorOptions: {
      sass: {
        api: 'modern-compiler',
      },
    },
  },
})
