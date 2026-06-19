import api from './api'
import { useAuthStore } from '../stores/auth'

export const adminActualizacionesService = {
  async crearActualizacion(titulo, mensaje, usuarios_receptores = null) {
    const authStore = useAuthStore()
    const res = await api.post('/admin/actualizaciones', {
      empresa: authStore.empresa,
      titulo,
      mensaje,
      usuarios_receptores
    })
    return res.data
  }
}

export default adminActualizacionesService
