import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import App from './App.vue'
import router from './router'

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary:    '#667eea',
          secondary:  '#764ba2',
          success:    '#22c55e',
          warning:    '#f59e0b',
          error:      '#ef4444',
          info:       '#3b82f6',
          background: '#f1f5f9',
          surface:    '#ffffff',
        },
      },
      dark: {
        colors: {
          primary:    '#667eea',
          secondary:  '#764ba2',
          success:    '#22c55e',
          warning:    '#f59e0b',
          error:      '#ef4444',
          info:       '#3b82f6',
          background: '#0f172a',
          surface:    '#1e293b',
        },
      },
    },
  },
  icons: { defaultSet: 'mdi' },
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(vuetify)
app.mount('#app')
