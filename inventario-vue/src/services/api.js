import axios from 'axios'

const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api'

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
