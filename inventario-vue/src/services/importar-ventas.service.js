import api from './api'
import { useAuthStore } from '../stores/auth'

const ENDPOINT = '/tesoreria/importar-ventas'

function getEmpresaActiva() {
  const authStore = useAuthStore()
  return authStore.empresa
}

export const importarVentasService = {
  // Importar ventas desde CSV
  async importarCSV(file, params = {}) {
    try {
      const empresa = getEmpresaActiva()
      const formData = new FormData()
      formData.append('file', file)
      formData.append('empresa', empresa)

      // Añadir parámetros adicionales si existen
      Object.keys(params).forEach(key => {
        formData.append(key, params[key])
      })

      const response = await api.post(`${ENDPOINT}/csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error importando CSV:', error)
      throw error
    }
  },

  // Validar archivo antes de importar
  async validarCSV(file) {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
          try {
            const csv = e.target.result
            const lines = csv.trim().split('\n')

            if (lines.length < 2) {
              reject(new Error('El archivo debe tener al menos una fila de encabezados y una fila de datos'))
            }

            // Parsear primera línea (headers)
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

            // Validar que tenga campos mínimos requeridos
            const camposRequeridos = ['fecha', 'cliente', 'monto']
            const faltanCampos = camposRequeridos.filter(campo => !headers.includes(campo))

            if (faltanCampos.length > 0) {
              reject(new Error(`Faltan campos requeridos: ${faltanCampos.join(', ')}`))
            }

            // Parsear datos
            const registros = lines.slice(1).map((line, idx) => {
              const valores = line.split(',').map(v => v.trim())
              const registro = {}
              headers.forEach((header, i) => {
                registro[header] = valores[i] || ''
              })
              return { ...registro, fila: idx + 2 }
            }).filter(r => r.fecha || r.cliente || r.monto) // Filtrar filas vacías

            resolve({
              valido: true,
              headers,
              registros,
              totalRegistros: registros.length
            })
          } catch (error) {
            reject(error)
          }
        }

        reader.onerror = () => {
          reject(new Error('Error al leer el archivo'))
        }

        reader.readAsText(file)
      })
    } catch (error) {
      throw error
    }
  },

  // Obtener histórico de importaciones
  async getHistorico(params = {}) {
    try {
      const empresa = getEmpresaActiva()
      const response = await api.get(`${ENDPOINT}/historico`, {
        params: { ...params, empresa }
      })
      return response.data
    } catch (error) {
      console.error('Error obteniendo histórico:', error)
      throw error
    }
  },

  // Descargar plantilla de ejemplo
  async descargarPlantilla() {
    try {
      const response = await api.get(`${ENDPOINT}/plantilla`, {
        responseType: 'blob'
      })

      // Crear blob URL y descargar
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'plantilla_ventas.csv')
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)

      return response.data
    } catch (error) {
      console.error('Error descargando plantilla:', error)
      throw error
    }
  }
}

export default importarVentasService
