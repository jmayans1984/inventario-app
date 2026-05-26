import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig({
  base: '/inventario-app/',
  build: {
    outDir: '../dist-pages',
    emptyOutDir: true,
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
