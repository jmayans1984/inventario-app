<template>
  <v-dialog :model-value="open" max-width="650" persistent @update:model-value="$emit('update:open', $event)">
    <v-card class="form-card">
      <!-- HEADER -->
      <div class="form-header">
        <div class="header-content">
          <v-icon size="32" color="white">{{ esEdicion ? 'mdi-pencil-box-outline' : 'mdi-plus-box-outline' }}</v-icon>
          <div class="header-text">
            <h2 class="header-title">{{ esEdicion ? 'EDITAR PROVEEDOR' : 'NUEVO PROVEEDOR' }}</h2>
            <p class="header-sub">{{ esEdicion ? 'Actualiza la información del proveedor' : 'Completa los datos del nuevo proveedor' }}</p>
          </div>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          color="white"
          size="small"
          @click="cerrar"
        />
      </div>

      <!-- FORMULARIO -->
      <v-card-text class="form-content">
        <v-row dense class="mt-1">

          <!-- CÓDIGO -->
          <v-col cols="12" sm="3">
            <label class="field-label">CÓDIGO</label>
            <v-text-field
              v-model="formData.codigo"
              readonly
              placeholder="Auto-generado"
              prepend-inner-icon="mdi-barcode"
              variant="outlined"
              density="comfortable"
              hide-details
              bg-color="rgba(var(--v-theme-on-surface), 0.04)"
              class="mt-1 field-readonly"
            />
          </v-col>

          <!-- NOMBRE -->
          <v-col cols="12" sm="9">
            <label class="field-label">NOMBRE <span class="required">*</span></label>
            <v-text-field
              v-model="formData.nombre"
              placeholder="NOMBRE DEL PROVEEDOR"
              prepend-inner-icon="mdi-building"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
              :error-messages="formularioTocado.nombre ? errores.nombre : []"
              maxlength="100"
              class="mt-1"
              @input="formData.nombre = formData.nombre.toUpperCase(); validarNombre()"
              @blur="formularioTocado.nombre = true; validarNombre()"
            />
          </v-col>

          <!-- DIRECCIÓN -->
          <v-col cols="12" class="mt-2">
            <label class="field-label">DIRECCIÓN <span class="optional">(Opcional)</span></label>
            <v-textarea
              v-model="formData.direccion"
              placeholder="CALLE, NÚMERO, CIUDAD..."
              prepend-inner-icon="mdi-map-marker"
              variant="outlined"
              density="comfortable"
              rows="2"
              hide-details
              maxlength="100"
              no-resize
              class="mt-1"
              @input="formData.direccion = formData.direccion.toUpperCase()"
            />
          </v-col>

          <!-- TELÉFONO -->
          <v-col cols="12" sm="6" class="mt-2">
            <label class="field-label">TELÉFONO <span class="optional">(Opcional)</span></label>
            <v-text-field
              v-model="formData.telefono1"
              placeholder="EJ: 0212-123-4567"
              prepend-inner-icon="mdi-phone"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
              :error-messages="formularioTocado.telefono1 ? errores.telefono1 : []"
              maxlength="15"
              class="mt-1"
              @input="formData.telefono1 = formData.telefono1.toUpperCase(); validarTelefono()"
              @blur="formularioTocado.telefono1 = true; validarTelefono()"
            />
          </v-col>

        </v-row>

        <!-- ERROR GENERAL -->
        <v-alert
          v-if="errorGeneral"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-4"
          closable
          @click:close="errorGeneral = ''"
        >
          {{ errorGeneral }}
        </v-alert>

        <!-- ÉXITO -->
        <v-alert
          v-if="mensajeExito"
          type="success"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          {{ mensajeExito }}
        </v-alert>
      </v-card-text>

      <!-- ACCIONES -->
      <v-card-actions class="form-actions">
        <v-spacer />
        <v-btn
          variant="text"
          @click="cerrar"
          :disabled="guardando"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          :loading="guardando"
          @click="handleGuardar"
          prepend-icon="mdi-check"
        >
          {{ esEdicion ? 'Actualizar' : 'Crear' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useProveedoresStore } from '../../../stores/proveedores'

const store = useProveedoresStore()

const props = defineProps({
  open: Boolean,
  proveedor: Object,
  onClose: Function,
  onGuardar: Function,
})

const emit = defineEmits(['update:open', 'close', 'guardar'])

// ─── STATE ───────────────────────────────────────────
const guardando = ref(false)
const errorGeneral = ref('')
const mensajeExito = ref('')
const formularioTocado = ref({
  codigo: false,
  nombre: false,
  direccion: false,
  telefono1: false,
})

const formData = ref({
  codigo: '',
  nombre: '',
  direccion: '',
  telefono1: '',
  empresa: 1,
})

const errores = ref({
  codigo: [],
  nombre: [],
  direccion: [],
  telefono1: [],
})

// ─── COMPUTED ────────────────────────────────────────

const esEdicion = computed(() => !!props.proveedor?.codigo)

const formularioValido = computed(() => {
  return (
    formData.value.nombre.trim().length >= 3 &&
    Object.values(errores.value).every(arr => arr.length === 0)
  )
})

// ─── WATCHERS ────────────────────────────────────────

watch(
  () => props.open,
  async (newVal) => {
    if (newVal && props.proveedor) {
      formData.value = {
        codigo:    props.proveedor.codigo    || '',
        nombre:    (props.proveedor.nombre   || '').toUpperCase(),
        direccion: (props.proveedor.direccion|| '').toUpperCase(),
        telefono1: (props.proveedor.telefono1|| '').toUpperCase(),
        empresa:   props.proveedor.empresa   || 1,
      }
      formularioTocado.value = {
        codigo: false,
        nombre: false,
        direccion: false,
        telefono1: false,
      }
    } else if (newVal) {
      resetForm()
      // Auto-generar código
      formData.value.codigo = await store.getProximoCodigo()
    }
    errorGeneral.value = ''
    mensajeExito.value = ''
  }
)

// ─── METHODS ─────────────────────────────────────────

function resetForm() {
  formData.value = {
    codigo: '',
    nombre: '',
    direccion: '',
    telefono1: '',
    empresa: 1,
  }
  formularioTocado.value = {
    codigo: false,
    nombre: false,
    direccion: false,
    telefono1: false,
  }
  errores.value = {
    codigo: [],
    nombre: [],
    direccion: [],
    telefono1: [],
  }
  errorGeneral.value = ''
  mensajeExito.value = ''
}

function validarNombre() {
  errores.value.nombre = []
  if (formData.value.nombre.trim().length === 0) {
    errores.value.nombre.push('El nombre es requerido')
  } else if (formData.value.nombre.trim().length < 3) {
    errores.value.nombre.push('Mínimo 3 caracteres')
  }
}

function validarTelefono() {
  errores.value.telefono1 = []
  if (formData.value.telefono1) {
    // Validar que sea solo números, guiones y espacios
    const telefonoLimpio = formData.value.telefono1.replace(/[\s\-]/g, '')
    if (!/^\d{10,15}$/.test(telefonoLimpio)) {
      errores.value.telefono1.push('Teléfono inválido')
    }
  }
}

async function handleGuardar() {
  // Validar antes de guardar
  formularioTocado.value = {
    codigo: true,
    nombre: true,
    direccion: true,
    telefono1: true,
  }

  validarNombre()
  validarTelefono()

  if (!formularioValido.value) {
    errorGeneral.value = 'Por favor, completa los campos requeridos correctamente'
    return
  }

  guardando.value = true
  errorGeneral.value = ''
  mensajeExito.value = ''

  try {
    let resultado

    if (esEdicion.value) {
      // Actualizar
      resultado = await store.actualizarProveedor(props.proveedor.codigo, {
        ...formData.value,
      })
      mensajeExito.value = 'Proveedor actualizado correctamente'
    } else {
      // Crear
      resultado = await store.crearProveedor({
        ...formData.value,
      })
      mensajeExito.value = 'Proveedor creado correctamente'
    }

    // Esperar un segundo para mostrar el mensaje
    setTimeout(() => {
      emit('guardar', resultado)
      cerrar()
    }, 1000)
  } catch (error) {
    errorGeneral.value = error.message || 'Error al guardar el proveedor'
    console.error('Error guardando:', error)
  } finally {
    guardando.value = false
  }
}

function cerrar() {
  resetForm()
  emit('update:open', false)
  emit('close')
}
</script>

<style scoped>
.form-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 16px;
  overflow: hidden;
}

/* HEADER */
.form-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-text {
  flex: 1;
}

.header-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.header-sub {
  margin: 4px 0 0 0;
  font-size: 12px;
  opacity: 0.9;
}

/* CONTENIDO */
.form-content {
  padding: 20px 24px 24px;
}

.field-label {
  display: block;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin-bottom: 4px;
}

.required {
  color: #ef4444;
  margin-left: 2px;
}

.optional {
  font-size: 9px;
  color: rgba(var(--v-theme-on-surface), 0.35);
  margin-left: 4px;
  font-weight: 600;
}

/* Campo readonly */
.field-readonly :deep(input) {
  cursor: not-allowed;
  opacity: 0.7;
}

/* ACCIONES */
.form-actions {
  padding: 16px 24px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  gap: 12px;
}
</style>
