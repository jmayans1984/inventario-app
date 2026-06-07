import api from './api'
import { useAuthStore } from '../stores/auth'

export const notificacionesService = {

  async obtenerNotificaciones() {
    const authStore = useAuthStore()
    const res = await api.get('/notificaciones', {
      params: { usuario: authStore.userName }
    })
    return res.data
  },

  async obtenerCountSinLeer() {
    const authStore = useAuthStore()
    const res = await api.get('/notificaciones/sin-leer/count', {
      params: { usuario: authStore.userName }
    })
    return res.data
  },

  async marcarComoLeida(id) {
    const authStore = useAuthStore()
    const res = await api.patch(`/notificaciones/${id}/leer`, {}, {
      params: { usuario: authStore.userName }
    })
    return res.data
  },

  async obtenerPreferencias() {
    const authStore = useAuthStore()
    const res = await api.get('/preferencias-notificaciones', {
      params: { usuario: authStore.userName }
    })
    return res.data
  },

  async actualizarPreferencia(tipo, activa) {
    const authStore = useAuthStore()
    const res = await api.put(`/preferencias-notificaciones/${tipo}`, { activa }, {
      params: { usuario: authStore.userName }
    })
    return res.data
  },
}

export default notificacionesService
