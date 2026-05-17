import api from './api'

const authService = {
  login: async (usuario, clave) => {
    try {
      const response = await api.post('/auth/login', {
        usuario,
        clave,
      })

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        }
      }

      return {
        success: false,
        error: response.data.error || 'Error en login',
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Error al conectar con el servidor',
      }
    }
  },

  logout: () => {
    localStorage.removeItem('usuario')
    localStorage.removeItem('empresaActual')
  },

  getCurrentUser: () => {
    try {
      const usuarioStr = localStorage.getItem('usuario')
      return usuarioStr ? JSON.parse(usuarioStr) : null
    } catch (e) {
      console.error('Error parsing user:', e)
      return null
    }
  },

  getEmpresaActual: () => {
    return localStorage.getItem('empresaActual')
  },

  setEmpresa: (empresaCodigo) => {
    localStorage.setItem('empresaActual', empresaCodigo)
  },
}

export default authService
