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
            <v-col cols="12" sm="5">
              <v-text-field
                v-model="form.nombre_banco"
                label="Banco *"
                variant="outlined"
                density="comfortable"
                :rules="[v => !!v || 'Requerido', v => v?.length <= 15 || 'Máx 15 chars']"
                placeholder="Ej: Banesco"
                maxlength="15"
                counter="15"
              />
            </v-col>

            <!-- ESTADO -->
            <v-col cols="12" sm="4">
              <v-select
                v-model="form.estado"
                label="Estado *"
                :items="['ACTIVA', 'INACTIVA']"
                variant="outlined"
                density="comfortable"
                :rules="[v => !!v || 'Requerido']"
              >
                <template #item="{ item, props: itemProps }">
                  <v-list-item v-bind="itemProps">
                    <template #prepend>
                      <v-icon :color="item.value === 'ACTIVA' ? 'success' : 'default'" size="14">mdi-circle</v-icon>
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>

            <!-- NOMBRE CTA -->
            <v-col cols="12" sm="8">
              <v-text-field
                v-model="form.nombre_cta"
                label="Nombre de Cuenta *"
                variant="outlined"
                density="comfortable"
                :rules="[v => !!v || 'Requerido', v => v?.length <= 25 || 'Máx 25 chars']"
                placeholder="Ej: Cuenta Corriente Principal"
                maxlength="25"
                counter="25"
              />
            </v-col>

            <!-- TIPO CUENTA -->
            <v-col cols="12" sm="4">
              <v-select
                v-model="form.tipo_cuenta"
                label="Tipo de Cuenta"
                :items="tiposCuenta"
                variant="outlined"
                density="comfortable"
                clearable
              />
            </v-col>

            <!-- NRO CTA -->
            <v-col cols="12" sm="8">
              <v-text-field
                v-model="form.nro_cta"
                label="Número de Cuenta"
                variant="outlined"
                density="comfortable"
                placeholder="Ej: 0134-0123-45-1234567890"
                maxlength="20"
                :rules="[v => !v || v.length <= 20 || 'Máx 20 chars']"
                prepend-inner-icon="mdi-credit-card-outline"
              />
            </v-col>

            <!-- CHEQUE -->
            <v-col cols="12" sm="4">
              <v-select
                v-model="form.cheque"
                label="Maneja Cheque"
                :items="[{ title: 'Sí', value: 1 }, { title: 'No', value: 0 }]"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="comfortable"
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

const store   = useCuentasBancariasStore()
const formRef = ref(null)
const errorMsg = ref('')

const tiposCuenta = ['Corriente', 'Ahorro', 'Especial', 'Fideicomiso', 'Nómina']

const formVacio = () => ({
  codigo: '',
  nombre_banco: '',
  nombre_cta: '',
  tipo_cuenta: 'Corriente',
  nro_cta: '',
  cheque: 0,
  vr_transfe: 0,
  estado: 'ACTIVA',
})

const form = ref(formVacio())
const esEdicion = computed(() => !!props.cuenta?.codigo)

watch(() => props.open, async (val) => {
  if (!val) return
  errorMsg.value = ''
  if (props.cuenta) {
    form.value = {
      codigo:      props.cuenta.codigo      ?? '',
      nombre_banco:props.cuenta.nombre_banco ?? '',
      nombre_cta:  props.cuenta.nombre_cta  ?? '',
      tipo_cuenta: props.cuenta.tipo_cuenta  ?? 'Corriente',
      nro_cta:     props.cuenta.nro_cta     ?? '',
      cheque:      props.cuenta.cheque      ?? 0,
      vr_transfe:  props.cuenta.vr_transfe  ?? 0,
      estado:      props.cuenta.estado      ?? 'ACTIVA',
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
    const datos = { ...form.value }
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
