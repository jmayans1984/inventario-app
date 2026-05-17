<template>
  <v-dialog
    :model-value="open"
    max-width="600"
    persistent
    @update:model-value="$emit('update:open', $event)"
  >
    <v-card rounded="xl" elevation="0" class="form-card">
      <!-- HEADER -->
      <div class="form-header">
        <div class="form-header-icon">
          <v-icon size="22" color="white">mdi-bank-outline</v-icon>
        </div>
        <div>
          <p class="form-header-title">{{ esEdicion ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria' }}</p>
          <p class="form-header-sub">{{ esEdicion ? `Código: ${form.codigo}` : 'Los campos marcados con * son obligatorios' }}</p>
        </div>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="cerrar" />
      </div>

      <v-divider />

      <v-card-text class="pa-6">
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-row dense>

            <!-- CÓDIGO (auto-generado) -->
            <v-col cols="12" sm="3">
              <v-text-field
                v-model="form.codigo"
                label="Código"
                variant="outlined"
                density="comfortable"
                readonly
                bg-color="rgba(var(--v-theme-on-surface), 0.04)"
                hint="Auto-generado"
                persistent-hint
              >
                <template #prepend-inner>
                  <v-icon size="16" style="opacity:0.4">mdi-pound</v-icon>
                </template>
              </v-text-field>
            </v-col>

            <!-- NOMBRE BANCO -->
            <v-col cols="12" sm="9">
              <v-text-field
                v-model="form.nombre_banco"
                label="Banco *"
                variant="outlined"
                density="comfortable"
                :rules="[v => !!v || 'Requerido', v => v?.length <= 15 || 'Máx 15 chars']"
                placeholder="EJ: BANESCO"
                maxlength="15"
                counter="15"
                @input="form.nombre_banco = form.nombre_banco.toUpperCase()"
              />
            </v-col>

            <!-- NOMBRE CTA -->
            <v-col cols="12" sm="8">
              <v-text-field
                v-model="form.nombre_cta"
                label="Nombre de Cuenta *"
                variant="outlined"
                density="comfortable"
                :rules="[v => !!v || 'Requerido', v => v?.length <= 25 || 'Máx 25 chars']"
                placeholder="EJ: CTA CORRIENTE PRINCIPAL"
                maxlength="25"
                counter="25"
                @input="form.nombre_cta = form.nombre_cta.toUpperCase()"
              />
            </v-col>

            <!-- TIPO CUENTA -->
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="form.tipo_cuenta"
                label="Tipo de Cuenta"
                variant="outlined"
                density="comfortable"
                placeholder="EJ: CORRIENTE"
                maxlength="15"
                @input="form.tipo_cuenta = form.tipo_cuenta.toUpperCase()"
              />
            </v-col>

            <!-- NRO CTA -->
            <v-col cols="12" sm="9">
              <v-text-field
                v-model="form.nro_cta"
                label="Número de Cuenta"
                variant="outlined"
                density="comfortable"
                placeholder="EJ: 0134-0123-45-1234567890"
                maxlength="20"
                :rules="[v => !v || v.length <= 20 || 'Máx 20 chars']"
                prepend-inner-icon="mdi-credit-card-outline"
                @input="form.nro_cta = form.nro_cta.toUpperCase()"
              />
            </v-col>

            <!-- CHEQUE -->
            <v-col cols="12" sm="3">
              <v-text-field
                v-model="form.cheque"
                label="Cheque"
                variant="outlined"
                density="comfortable"
                placeholder="0"
                :rules="reglasCheque"
                @input="sanitizarCheque"
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

      <v-card-actions class="pa-4">
        <v-btn variant="text" @click="cerrar">Cancelar</v-btn>
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
import { useCuentasBancariasStore } from '../../../stores/cuentasbancarias'

const props = defineProps({ open: Boolean, cuenta: Object })
const emit  = defineEmits(['update:open', 'close', 'guardar'])

const store    = useCuentasBancariasStore()
const formRef  = ref(null)
const errorMsg = ref('')

const reglasCheque = [
  v => v === '' || v === null || v === undefined || Number.isInteger(Number(v)) || 'Solo números enteros',
]

function sanitizarCheque() {
  // Eliminar todo lo que no sea dígito (ni signo negativo al inicio)
  const limpio = String(form.value.cheque ?? '').replace(/[^0-9]/g, '')
  form.value.cheque = limpio === '' ? '' : limpio
}

const formVacio = () => ({
  codigo: '',
  nombre_banco: '',
  nombre_cta: '',
  tipo_cuenta: '',
  nro_cta: '',
  cheque: '',
  vr_transfe: 0,
  estado: 'ACTIVA',  // Siempre ACTIVA al crear
})

const form = ref(formVacio())
const esEdicion = computed(() => !!props.cuenta?.codigo)

watch(() => props.open, async (val) => {
  if (!val) return
  errorMsg.value = ''
  if (props.cuenta) {
    form.value = {
      codigo:       props.cuenta.codigo       ?? '',
      nombre_banco: (props.cuenta.nombre_banco ?? '').toUpperCase(),
      nombre_cta:   (props.cuenta.nombre_cta  ?? '').toUpperCase(),
      tipo_cuenta:  (props.cuenta.tipo_cuenta  ?? '').toUpperCase(),
      nro_cta:      (props.cuenta.nro_cta     ?? '').toUpperCase(),
      cheque:       props.cuenta.cheque != null ? String(parseInt(props.cuenta.cheque) || '') : '',
      vr_transfe:   props.cuenta.vr_transfe   ?? 0,
      estado:       props.cuenta.estado        ?? 'ACTIVA',
    }
  } else {
    form.value = formVacio()
    // Auto-generar código
    form.value.codigo = await store.getProximoCodigo()
  }
})

async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  errorMsg.value = ''
  try {
    const datos = {
      ...form.value,
      cheque:    form.value.cheque === '' ? 0 : parseInt(form.value.cheque) || 0,
      estado:    form.value.estado || 'ACTIVA',
    }
    let resultado
    if (esEdicion.value) {
      resultado = await store.actualizarCuenta(props.cuenta.codigo, datos)
    } else {
      resultado = await store.crearCuenta(datos)
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
.form-card { border: 1px solid rgba(var(--v-theme-on-surface), 0.08); }

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

.form-header-title { font-size: 16px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); margin: 0; }
.form-header-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 2px 0 0; }
</style>
