<template>
  <v-dialog
    :model-value="open"
    max-width="800"
    persistent
    @update:model-value="$emit('update:open', $event)"
  >
    <v-card rounded="xl" elevation="0" class="form-card">
      <!-- HEADER -->
      <div class="form-header">
        <div class="form-header-icon">
          <v-icon size="22" color="white">mdi-receipt-text-outline</v-icon>
        </div>
        <div>
          <p class="form-header-title">{{ esEdicion ? 'Editar Gasto' : 'Nuevo Gasto' }}</p>
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

            <!-- CÓDIGO (READ-ONLY) -->
            <v-col cols="12" sm="3">
              <v-text-field
                v-model="form.codigo"
                label="Código *"
                variant="outlined"
                density="comfortable"
                :disabled="true"
                hint="Auto-generado"
                persistent-hint
              />
            </v-col>

            <!-- FECHA -->
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="form.fecha"
                label="Fecha *"
                type="date"
                variant="outlined"
                density="comfortable"
                :rules="reglaFecha"
                class="mb-1"
              />
            </v-col>

            <!-- FACTURA -->
            <v-col cols="12" sm="5">
              <v-text-field
                v-model="form.numero_factura"
                label="Número Factura"
                variant="outlined"
                density="comfortable"
                placeholder="Ej: FAC-2026-001"
                maxlength="50"
              />
            </v-col>

            <!-- PROVEEDOR -->
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.proveedor_id"
                label="Proveedor *"
                variant="outlined"
                density="comfortable"
                :rules="reglaProveedor"
                :items="proveedoresOptions"
                item-title="nombre"
                item-value="id"
                placeholder="Selecciona un proveedor"
                class="mb-1"
              />
            </v-col>

            <!-- CENTRO DE COSTOS -->
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.centro_costos_id"
                label="Centro de Costos *"
                variant="outlined"
                density="comfortable"
                :rules="reglaCentroCostos"
                :items="centrosCostosOptions"
                item-title="nombre"
                item-value="codigo"
                placeholder="Selecciona un centro"
                class="mb-1"
              />
            </v-col>

            <!-- FORMA DE PAGO -->
            <v-col cols="12" sm="4">
              <v-select
                v-model="form.forma_pago"
                label="Forma de Pago *"
                variant="outlined"
                density="comfortable"
                :rules="reglaFormaPago"
                :items="formasPagoOptions"
                placeholder="Selecciona forma de pago"
                class="mb-1"
              />
            </v-col>

            <!-- CUENTA CONTABLE -->
            <v-col cols="12" sm="4">
              <v-select
                v-model="form.cuenta_contable_id"
                label="Cuenta Contable *"
                variant="outlined"
                density="comfortable"
                :rules="reglaCuenta"
                :items="cuentasContablesOptions"
                item-title="nombre"
                item-value="codigo"
                placeholder="Selecciona una cuenta"
                class="mb-1"
              />
            </v-col>

            <!-- CONCEPTO -->
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="form.concepto"
                label="Concepto *"
                variant="outlined"
                density="comfortable"
                :rules="reglaConcepto"
                placeholder="Descripción del gasto"
                maxlength="100"
                counter="100"
                @input="form.concepto = form.concepto.toUpperCase()"
              />
            </v-col>

            <!-- VALOR BASE -->
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="form.valor_base"
                label="Valor Base *"
                variant="outlined"
                density="comfortable"
                :rules="reglaValorBase"
                type="number"
                step="0.01"
                min="0"
                @input="calcularTotal"
              />
            </v-col>

            <!-- IMPUESTOS -->
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="form.impuestos"
                label="Impuestos"
                variant="outlined"
                density="comfortable"
                type="number"
                step="0.01"
                min="0"
                @input="calcularTotal"
              />
            </v-col>

            <!-- TOTAL (READ-ONLY) -->
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="form.total"
                label="Total"
                variant="outlined"
                density="comfortable"
                :disabled="true"
                type="number"
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
import { ref, watch, computed, onMounted } from 'vue'
import { useGestionGastosStore } from '../../../stores/gestiongastos'
import { proveedoresService } from '../../../services/proveedores.service'
import { centroCostosService } from '../../../services/centrocostos.service'
import { cuentasContablesService } from '../../../services/cuentascontables.service'

const props = defineProps({
  open: Boolean,
  gasto: Object,
})

const emit = defineEmits(['update:open', 'close', 'guardar'])

const store = useGestionGastosStore()
const formRef = ref(null)
const errorMsg = ref('')

const proveedoresOptions = ref([])
const centrosCostosOptions = ref([])
const cuentasContablesOptions = ref([])

const formasPagoOptions = [
  { value: 'CONTADO', name: 'Contado' },
  { value: 'CREDITO_15', name: 'Crédito 15 días' },
  { value: 'CREDITO_30', name: 'Crédito 30 días' },
  { value: 'CREDITO_60', name: 'Crédito 60 días' },
  { value: 'TARJETA', name: 'Tarjeta de Crédito' },
  { value: 'TRANSFERENCIA', name: 'Transferencia Bancaria' },
]

const formVacio = () => ({
  codigo: '',
  fecha: new Date().toISOString().split('T')[0],
  numero_factura: '',
  proveedor_id: '',
  centro_costos_id: '',
  forma_pago: '',
  cuenta_contable_id: '',
  concepto: '',
  valor_base: 0,
  impuestos: 0,
  total: 0,
})

const form = ref(formVacio())

const esEdicion = computed(() => !!props.gasto?.codigo)

// Cargar opciones al montar
onMounted(async () => {
  try {
    // Proveedores
    const prov = await proveedoresService.getProveedores({ limit: 500 })
    if (prov.data) proveedoresOptions.value = prov.data
    else if (Array.isArray(prov)) proveedoresOptions.value = prov

    // Centros de Costos
    const centros = await centroCostosService.getCentrosCostos({ limit: 500 })
    if (centros.data) centrosCostosOptions.value = centros.data
    else if (Array.isArray(centros)) centrosCostosOptions.value = centros

    // Cuentas Contables
    const cuentas = await cuentasContablesService.getCuentasContables({ limit: 500 })
    if (cuentas.data) cuentasContablesOptions.value = cuentas.data
    else if (Array.isArray(cuentas)) cuentasContablesOptions.value = cuentas
  } catch (err) {
    console.error('Error cargando opciones:', err)
  }
})

// Sincronizar cuando se abre el modal
watch(() => props.open, async (val) => {
  if (val) {
    errorMsg.value = ''
    if (props.gasto) {
      form.value = {
        codigo: props.gasto.codigo || '',
        fecha: props.gasto.fecha || '',
        numero_factura: props.gasto.numero_factura || '',
        proveedor_id: props.gasto.proveedor_id || '',
        centro_costos_id: props.gasto.centro_costos_id || '',
        forma_pago: props.gasto.forma_pago || '',
        cuenta_contable_id: props.gasto.cuenta_contable_id || '',
        concepto: (props.gasto.concepto || '').toUpperCase(),
        valor_base: props.gasto.valor_base || 0,
        impuestos: props.gasto.impuestos || 0,
        total: props.gasto.total || 0,
      }
    } else {
      form.value = formVacio()
      // Auto-generar código
      form.value.codigo = await store.getProximoCodigo()
    }
  }
})

// ─── REGLAS ──────────────────────────────────────────

const reglaFecha = [
  v => !!v || 'La fecha es requerida',
]

const reglaProveedor = [
  v => !!v || 'Debe seleccionar un proveedor',
]

const reglaCentroCostos = [
  v => !!v || 'Debe seleccionar un centro de costos',
]

const reglaFormaPago = [
  v => !!v || 'Debe seleccionar una forma de pago',
]

const reglaCuenta = [
  v => !!v || 'Debe seleccionar una cuenta contable',
]

const reglaConcepto = [
  v => !!v || 'El concepto es requerido',
  v => (v && v.length >= 3) || 'Mínimo 3 caracteres',
]

const reglaValorBase = [
  v => v !== null && v !== undefined && v !== '' || 'El valor base es requerido',
  v => v >= 0 || 'El valor debe ser mayor a 0',
]

// ─── MÉTODOS ─────────────────────────────────────────

function calcularTotal() {
  form.value.total = (form.value.valor_base || 0) + (form.value.impuestos || 0)
}

async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  errorMsg.value = ''
  try {
    const datos = {
      fecha: form.value.fecha,
      numero_factura: form.value.numero_factura.trim() || null,
      proveedor_id: form.value.proveedor_id,
      centro_costos_id: form.value.centro_costos_id,
      forma_pago: form.value.forma_pago,
      cuenta_contable_id: form.value.cuenta_contable_id,
      concepto: form.value.concepto.trim(),
      valor_base: form.value.valor_base,
      impuestos: form.value.impuestos || 0,
      total: form.value.total,
    }

    let resultado
    if (esEdicion.value) {
      resultado = await store.actualizarGasto(props.gasto.codigo, datos)
    } else {
      resultado = await store.crearGasto(datos)
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
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.form-header-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.form-header-title {
  color: white;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.3px;
  margin: 0;
}

.form-header-sub {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  margin-top: 4px;
}
</style>
