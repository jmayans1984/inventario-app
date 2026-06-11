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
          background: '#F2F2F7',
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

// Forzar MAYÚSCULAS en todos los inputs de texto antes de que Vue lea el valor
document.addEventListener('input', (e) => {
  const el = e.target
  if (
    (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') &&
    !['number', 'date', 'email', 'password', 'checkbox', 'radio',
      'range', 'color', 'file', 'time', 'datetime-local', 'month', 'week'].includes(el.type) &&
    !el.readOnly && !el.disabled
  ) {
    const start = el.selectionStart
    const end   = el.selectionEnd
    const upper = el.value.toUpperCase()
    if (el.value !== upper) {
      el.value = upper
      try { el.setSelectionRange(start, end) } catch {}
    }
  }
}, true)

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(vuetify)
app.mount('#app')
