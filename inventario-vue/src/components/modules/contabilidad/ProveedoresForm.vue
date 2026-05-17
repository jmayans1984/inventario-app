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
        <div class="form-grid">
          <!-- CÓDIGO (solo lectura en edición) -->
          <div class="form-field">
            <label class="field-label">
              CÓDIGO
              <span v-if="!esEdicion" class="required">*</span>
            </label>
            <v-text-field
              v-model="formData.codigo"
              :readonly="esEdicion"
              placeholder="Auto-generado"
              prepend-inner-icon="mdi-barcode"
              variant="outlined"
              density="compact"
              hide-details
              :error="formularioTocado.codigo && errores.codigo"
              :error-messages="formularioTocado.codigo ? errores.codigo : []"
              @blur="formularioTocado.codigo = true"
            />
          </div>

          <!-- NOMBRE -->
          <div class="form-field">
            <label class="field-label">
              NOMBRE
              <span class="required">*</span>
            </label>
            <v-text-field
              v-model="formData.nombre"
              placeholder="Nombre del proveedor"
              prepend-inner-icon="mdi-building"
              variant="outlined"
              density="compact"
              hide-details
              :error="formularioTocado.nombre && errores.nombre"
              :error-messages="formularioTocado.nombre ? errores.nombre : []"
              @blur="formularioTocado.nombre = true; validarNombre()"
              @input="validarNombre"
              maxlength="100"
            />
            <p class="char-count">{{ formData.nombre.length }}/100</p>
          </div>

          <!-- DIRECCIÓN -->
          <div class="form-field full-width">
            <label class="field-label">
              DIRECCIÓN
              <span class="optional">(Opcional)</span>
            </label>
            <v-textarea
              v-model="formData.direccion"
              placeholder="Calle, número, ciudad..."
              prepend-inner-icon="mdi-map-marker"
              variant="outlined"
              density="compact"
              rows="2"
              hide-details
              maxlength="100"
              @blur="formularioTocado.direccion = true"
            />
            <p class="char-count">{{ formData.direccion.length }}/100</p>
          </div>

          <!-- TELÉFONO 1 -->
          <div class="form-field">
            <label class="field-label">
              TELÉFONO
              <span class="optional">(Opcional)</span>
            </label>
            <v-text-field
              v-model="formData.telefono1"
              placeholder="ej: 0212-123-4567"
              prepend-inner-icon="mdi-phone"
              variant="outlined"
              density="compact"
              hide-details
              :error="formularioTocado.telefono1 && errores.telefono1"
              :error-messages="formularioTocado.telefono1 ? errores.telefono1 : []"
              @blur="formularioTocado.telefono1 = true; validarTelefono()"
              @input="validarTelefono"
              maxlength="15"
            />
          </div>

          <!-- DEPARTAMENTO -->
          <div class="form-field">
            <label class="field-label">
              DEPARTAMENTO
              <span class="optional">(Opcional)</span>
            </label>
            <v-select
              v-model="formData.departamen"
              :items="departamentos"
              placeholder="Selecciona un departamento"
              prepend-inner-icon="mdi-sitemap"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @blur="formularioTocado.departamen = true"
            />
          </div>
        </div>

        <!-- MENSAJE DE ERROR GENERAL -->
        <div v-if="errorGeneral" class="error-alert">
          <v-icon size="20">mdi-alert-circle-outline</v-icon>
          <span>{{ errorGeneral }}</span>
        </div>

        <!-- MENSAJE DE ÉXITO -->
        <div v-if="mensajeExito" class="success-alert">
          <v-icon size="20">mdi-check-circle-outline</v-icon>
          <span>{{ mensajeExito }}</span>
        </div>
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
  departamen: false,
})

const formData = ref({
  codigo: '',
  nombre: '',
  direccion: '',
  telefono1: '',
  departamen: '',
  empresa: 1, // Por ahora hardcodeado, después usaremos auth store
})

const errores = ref({
  codigo: [],
  nombre: [],
  direccion: [],
  telefono1: [],
  departamen: [],
})

const departamentos = [
  'Logística',
  'Compras',
  'Suministros',
  'Almacén',
  'Administración',
  'Finanzas',
  'Operaciones',
  'Otro',
]

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
  (newVal) => {
    if (newVal && props.proveedor) {
      // Cargar datos del proveedor
      formData.value = {
        codigo: props.proveedor.codigo || '',
        nombre: props.proveedor.nombre || '',
        direccion: props.proveedor.direccion || '',
        telefono1: props.proveedor.telefono1 || '',
        departamen: props.proveedor.departamen || '',
        empresa: props.proveedor.empresa || 1,
      }
      formularioTocado.value = {
        codigo: false,
        nombre: false,
        direccion: false,
        telefono1: false,
        departamen: false,
      }
    } else if (newVal) {
      // Nuevo proveedor
      resetForm()
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
    departamen: '',
    empresa: 1,
  }
  formularioTocado.value = {
    codigo: false,
    nombre: false,
    direccion: false,
    telefono1: false,
    departamen: false,
  }
  errores.value = {
    codigo: [],
    nombre: [],
    direccion: [],
    telefono1: [],
    departamen: [],
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
    departamen: true,
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
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field.full-width {
  grid-column: 1 / -1;
}

.field-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.required {
  color: #ef4444;
  margin-left: 2px;
}

.optional {
  font-size: 10px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  margin-left: 4px;
}

.char-count {
  font-size: 10px;
  color: rgba(var(--v-theme-on-surface), 0.3);
  text-align: right;
  margin: 0;
}

/* ALERTAS */
.error-alert,
.success-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 16px;
}

.error-alert {
  background: rgba(#ef4444, 0.1);
  color: #ef4444;
  border-left: 3px solid #ef4444;
}

.success-alert {
  background: rgba(#22c55e, 0.1);
  color: #22c55e;
  border-left: 3px solid #22c55e;
}

/* ACCIONES */
.form-actions {
  padding: 16px 24px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  gap: 12px;
}

@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-field {
    grid-column: 1 !important;
  }
}
</style>
