import axios from 'axios'

// En desarrollo usa el proxy de Vite. En producción usa la URL real.
const API_BASE = import.meta.env.PROD
  ? 'https://inventario-app-production-e8c8.up.railway.app/api'
  : '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add empresa header if available
    const empresaActual = localStorage.getItem('empresaActual')
    if (empresaActual) {
      config.headers['X-Empresa'] = empresaActual
    }

    // Quién está actuando. El servidor lo usa para impedir que alguien edite
    // sus propios permisos.
    try {
      const u = JSON.parse(localStorage.getItem('usuario') || 'null')
      if (u?.codigo) config.headers['X-Usuario'] = String(u.codigo)
    } catch { /* sesión ilegible, se omite */ }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      // Clear session and redirect to login
      localStorage.removeItem('usuario')
      localStorage.removeItem('empresaActual')
      window.location.href = '/index.html'
    }

    return Promise.reject(error)
  }
)

export default api
export { API_BASE }
