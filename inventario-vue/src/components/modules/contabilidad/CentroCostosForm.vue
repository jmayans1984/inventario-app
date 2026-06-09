<template>
  <v-dialog
    :model-value="open"
    max-width="520"
    @update:model-value="$emit('update:open', $event)"
  >
    <v-card rounded="xl" elevation="0" class="form-card">
      <!-- HEADER -->
      <div class="form-header">
        <div class="form-header-icon">
          <v-icon size="22" color="white">mdi-sitemap-outline</v-icon>
        </div>
        <div>
          <p class="form-header-title">{{ esEdicion ? 'Editar Centro de Costos' : 'Nuevo Centro de Costos' }}</p>
          <p class="form-header-sub">{{ esEdicion ? `Código: ${form.codigo}` : 'Completa los campos requeridos' }}</p>
        </div>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="cerrar" />
      </div>

      <v-divider />

      <!-- FORMULARIO -->
      <v-card-text class="pa-6">
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-row dense>

            <!-- CÓDIGO -->
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="form.codigo"
                label="Código *"
                variant="outlined"
                density="comfortable"
                :rules="reglaCodigo"
                :disabled="esEdicion"
                :hint="esEdicion ? 'No editable' : 'Máx. 3 caracteres'"
                persistent-hint
                counter="3"
                maxlength="3"
                class="mb-1"
                @input="form.codigo = form.codigo.toUpperCase()"
              />
            </v-col>

            <!-- NOMBRE -->
            <v-col cols="12" sm="8">
              <v-text-field
                v-model="form.nombre"
                label="Nombre *"
                variant="outlined"
                density="comfortable"
                :rules="reglaNombre"
                placeholder="Ej: ADMINISTRACIÓN"
                maxlength="30"
                counter="30"
                class="mb-1"
                @input="form.nombre = form.nombre.toUpperCase()"
              />
            </v-col>

          </v-row>

          <!-- ERROR -->
          <v-alert
            v-if="errorMsg"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
            closable
            @click:close="errorMsg = ''"
          >
            {{ errorMsg }}
          </v-alert>
        </v-form>
      </v-card-text>

      <v-divider />

      <!-- ACCIONES -->
      <v-card-actions class="pa-4 gap-3">
        <v-btn variant="text" color="default" @click="cerrar">Cancelar</v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          variant="elevated"
          :loading="store.loading"
          prepend-icon="mdi-content-save-outline"
          @click="handleSubmit"
        >
          {{ esEdicion ? 'Actualizar' : 'Guardar' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useCentroCostosStore } from '../../../stores/centrocostos'

const props = defineProps({
  open: Boolean,
  centroCostos: Object,
})

const emit = defineEmits(['update:open', 'close', 'guardar'])

const store = useCentroCostosStore()
const formRef = ref(null)
const errorMsg = ref('')

const formVacio = () => ({
  codigo: '',
  nombre: '',
  square_location_id: '',
})

const form = ref(formVacio())

const esEdicion = computed(() => !!props.centroCostos?.codigo)

// Sincronizar cuando se abre el modal
watch(() => props.open, async (val) => {
  if (val) {
    errorMsg.value = ''
    if (props.centroCostos) {
      form.value = {
        codigo: props.centroCostos.codigo || '',
        nombre: (props.centroCostos.nombre || '').toUpperCase(),
        square_location_id: props.centroCostos.square_location_id || '',
      }
    } else {
      form.value = formVacio()
      // Auto-generar código para crear
      form.value.codigo = await store.getProximoCodigo()
    }
  }
})

// ─── REGLAS ──────────────────────────────────────────

const reglaCodigo = [
  v => !!v || 'El código es requerido',
  v => (v && v.length >= 1) || 'Mínimo 1 carácter',
  v => (v && v.length <= 3) || 'Máximo 3 caracteres',
  v => /^[A-Z0-9]+$/.test(v) || 'Solo letras mayúsculas y números',
]

const reglaNombre = [
  v => !!v || 'El nombre es requerido',
  v => (v && v.length >= 2) || 'Mínimo 2 caracteres',
  v => (v && v.length <= 30) || 'Máximo 30 caracteres',
]

// ─── MÉTODOS ─────────────────────────────────────────

async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  errorMsg.value = ''
  try {
    const datos = {
      codigo: form.value.codigo,
      nombre: form.value.nombre.trim(),
      square_location_id: form.value.square_location_id?.trim() || '',
    }

    let resultado
    if (esEdicion.value) {
      resultado = await store.actualizarCentroCostos(props.centroCostos.codigo, datos)
    } else {
      resultado = await store.crearCentroCostos(datos)
    }

    emit('guardar', resultado)
    cerrar()
  } catch (err) {
    errorMsg.value = err.response?.data?.message || err.message || 'Error al guardar'
  }
}

function cerrar() {
  form.value = formVacio()
  errorMsg.value = ''
  formRef.value?.reset()
  emit('update:open', false)
  emit('close')
}
</script>

<style scoped>
.form-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.form-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
}

.form-header-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.form-header-title {
  font-size: 16px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}

.form-header-sub {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin: 2px 0 0;
}
</style>
