import api from './api'
import { useAuthStore } from '../stores/auth'

export const busquedaGlobalService = {
  async buscar(q) {
    const empresa = useAuthStore().empresa
    if (!empresa || !q || q.trim().length < 2) return []
    const { data } = await api.get('/busqueda-global', { params: { empresa, q: q.trim() } })
    return data.success ? data.data : []
  },
}

export default busquedaGlobalService
