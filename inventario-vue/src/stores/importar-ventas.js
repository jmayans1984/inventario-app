import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { importarVentasService } from '../services/importar-ventas.service'

export const useImportarVentasStore = defineStore('importarVentas', () => {
  // Estado
  const archivo = ref(null)
  const registrosValidados = ref([])
  const historicoImportaciones = ref([])
  const loading = ref(false)
  const error = ref(null)
  const success = ref(null)
  const validating = ref(false)
  const validationErrors = ref([])

  // Estados de flujo
  const paso = ref(1) // 1: seleccionar archivo, 2: validar, 3: confirmar, 4: resultado

  // Getters
  const totalRegistros = computed(() => registrosValidados.value.length)

  const registrosConError = computed(() =>
    registrosValidados.value.filter(r => r.errores && r.errores.length > 0)
  )

  const registrosValidos = computed(() =>
    registrosValidados.value.filter(r => !r.errores || r.errores.length === 0)
  )

  const totalValidos = computed(() => registrosValidos.value.length)
  const totalInvalidos = computed(() => registrosConError.value.length)

  // Actions
  async function seleccionarArchivo(file) {
    archivo.value = file
    error.value = null
    validationErrors.value = []
    paso.value = 1
  }

  async function validarArchivo() {
    if (!archivo.value) {
      error.value = 'Selecciona un archivo'
      return false
    }

    validating.value = true
    error.value = null
    validationErrors.value = []

    try {
      const resultado = await importarVentasService.validarCSV(archivo.value)

      registrosValidados.value = resultado.registros
      paso.value = 2

      // Validar reglas de negocio
      registrosValidados.value.forEach((registro, idx) => {
        const errores = []

        // Fecha requerida y válida
        if (!registro.fecha) {
          errores.push('Fecha requerida')
        } else if (isNaN(Date.parse(registro.fecha))) {
          errores.push(`Fecha inválida: ${registro.fecha}`)
        }

        // Cliente requerido
        if (!registro.cliente) {
          errores.push('Cliente requerido')
        }

        // Monto requerido y numérico
        if (!registro.monto) {
          errores.push('Monto requerido')
        } else if (isNaN(parseFloat(registro.monto))) {
          errores.push(`Monto inválido: ${registro.monto}`)
        }

        if (errores.length > 0) {
          registrosValidados.value[idx].errores = errores
          validationErrors.value.push({
            fila: registro.fila,
            errores
          })
        }
      })

      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      validating.value = false
    }
  }

  async function importar() {
    if (registrosValidos.value.length === 0) {
      error.value = 'No hay registros válidos para importar'
      return false
    }

    loading.value = true
    error.value = null
    success.value = null

    try {
      // Preparar datos para enviar al servidor
      const datosImportar = {
        registros: registrosValidos.value,
        total: totalValidos.value,
        fecha_importacion: new Date().toISOString()
      }

      // En una implementación real, esto se enviaría al servidor
      // await importarVentasService.importarCSV(archivo.value)

      success.value = `${totalValidos.value} registros importados exitosamente`
      paso.value = 4

      // Limpiar
      setTimeout(() => {
        resetForm()
      }, 3000)

      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function descargarPlantilla() {
    try {
      await importarVentasService.descargarPlantilla()
    } catch (err) {
      error.value = err.message
    }
  }

  function resetForm() {
    archivo.value = null
    registrosValidados.value = []
    validationErrors.value = []
    error.value = null
    success.value = null
    paso.value = 1
  }

  function clearMessages() {
    error.value = null
    success.value = null
  }

  return {
    // State
    archivo,
    registrosValidados,
    historicoImportaciones,
    loading,
    error,
    success,
    validating,
    validationErrors,
    paso,

    // Getters
    totalRegistros,
    registrosConError,
    registrosValidos,
    totalValidos,
    totalInvalidos,

    // Actions
    seleccionarArchivo,
    validarArchivo,
    importar,
    descargarPlantilla,
    resetForm,
    clearMessages,
  }
})
