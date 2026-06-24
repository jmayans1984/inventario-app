import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import pkg from './package.json'

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
      '/api': {
        target: 'https://inventario-app-production-e8c8.up.railway.app',
        changeOrigin: true,
        secure: true,
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
