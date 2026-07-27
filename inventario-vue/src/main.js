import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import './style.css'
import App from './App.vue'
import router from './router'

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary:        '#B8720B',
          'on-primary':   '#1B1815',
          secondary:      '#4F46E5',
          success:        '#15803D',
          warning:        '#B45309',
          error:          '#DC2626',
          info:           '#0284C7',
          background:     '#FAF9F5',
          surface:        '#FFFFFF',
          'on-surface':   '#1B1815',
        },
      },
      dark: {
        colors: {
          primary:        '#F0A83C',
          'on-primary':   '#1B1508',
          secondary:      '#818CF8',
          success:        '#4ADE80',
          warning:        '#FBBF24',
          error:          '#F87171',
          info:           '#38BDF8',
          background:     '#14120F',
          surface:        '#1D1A15',
          'on-surface':   '#F5F1E8',
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
