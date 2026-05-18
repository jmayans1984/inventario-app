<template>
  <v-dialog
    :model-value="open"
    max-width="860"
    persistent
    @update:model-value="$emit('update:open', $event)"
  >
    <v-card rounded="xl" elevation="0" class="form-card">

      <!-- ══ HEADER ══════════════════════════════════════════════════════ -->
      <div class="form-header">
        <div class="form-header-icon">
          <v-icon size="24" color="white">mdi-receipt-text-outline</v-icon>
        </div>
        <div class="form-header-text">
          <p class="form-header-title">{{ esEdicion ? 'Editar Gasto' : 'Nuevo Gasto' }}</p>
          <p class="form-header-sub">
            {{ esEdicion ? `Modificando comprobante #${form.codigo}` : 'Registra un nuevo comprobante de gasto' }}
          </p>
        </div>
        <v-spacer />
        <span v-if="esEdicion" class="codigo-badge"># {{ form.codigo }}</span>
        <span v-else class="codigo-badge auto">AUTO</span>
        <v-btn icon="mdi-close" variant="text" size="small" color="white" @click="cerrar" class="ml-2" />
      </div>

      <!-- ══ BODY ═════════════════════════════════════════════════════════ -->
      <v-card-text class="form-body">
        <v-form ref="formRef" @submit.prevent="handleSubmit">

          <!-- ── SECCIÓN 1: Comprobante ─────────────────────────────── -->
          <div class="form-section">
            <div class="section-label">
              <v-icon size="15" color="#667eea">mdi-calendar-check-outline</v-icon>
              <span>Comprobante</span>
            </div>
            <v-row dense class="mt-1">
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="form.fecha"
                  label="Fecha *"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  :rules="reglaFecha"
                  prepend-inner-icon="mdi-calendar"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="form.factura"
                  label="N° Factura"
                  variant="outlined"
                  density="comfortable"
                  placeholder="FAC-2026-001"
                  maxlength="50"
                  prepend-inner-icon="mdi-file-document-outline"
                  @input="form.factura = form.factura.toUpperCase()"
                />
              </v-col>
            </v-row>
          </div>

          <!-- ── SECCIÓN 2: Proveedor ──────────────────────────────── -->
          <div class="form-section">
            <div class="section-label">
              <v-icon size="15" color="#667eea">mdi-truck-outline</v-icon>
              <span>Proveedor & Clasificación</span>
            </div>
            <v-row dense class="mt-1">
              <v-col cols="12" sm="7">
                <v-autocomplete
                  v-model="form.proveedor"
                  label="Proveedor *"
                  variant="outlined"
                  density="comfortable"
                  :rules="reglaProveedor"
                  :items="proveedoresOptions"
                  item-title="nombre"
                  item-value="codigo"
                  placeholder="Escribe para buscar..."
                  prepend-inner-icon="mdi-account-tie-outline"
                  no-data-text="No hay proveedores"
                  clearable
                />
              </v-col>
              <v-col cols="12" sm="5">
                <v-autocomplete
                  v-model="form.ccosto"
                  label="Centro de Costos *"
                  variant="outlined"
                  density="comfortable"
                  :rules="reglaCentroCostos"
                  :items="centrosCostosOptions"
                  item-title="nombre"
                  item-value="codigo"
                  placeholder="Selecciona..."
                  prepend-inner-icon="mdi-office-building-outline"
                  no-data-text="No hay centros de costos"
                  clearable
                />
              </v-col>
            </v-row>
          </div>

          <!-- ── SECCIÓN 3: Contabilización ────────────────────────── -->
          <div class="form-section">
            <div class="section-label">
              <v-icon size="15" color="#667eea">mdi-bank-outline</v-icon>
              <span>Contabilización</span>
            </div>
            <v-row dense class="mt-1">
              <v-col cols="12" sm="6">
                <v-autocomplete
                  v-model="form.forma_pago"
                  label="Forma de Pago *"
                  variant="outlined"
                  density="comfortable"
                  :rules="reglaFormaPago"
                  :items="formasPagoOptions"
                  item-title="nombre_cta"
                  item-value="id"
                  placeholder="Selecciona cuenta bancaria..."
                  prepend-inner-icon="mdi-credit-card-outline"
                  no-data-text="No hay formas de pago"
                  clearable
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-autocomplete
                  v-model="form.cuenta"
                  label="Cuenta Contable *"
                  variant="outlined"
                  density="comfortable"
                  :rules="reglaCuenta"
                  :items="cuentasContablesOptions"
                  item-title="nombre"
                  item-value="codigo"
                  placeholder="Escribe para buscar..."
                  prepend-inner-icon="mdi-book-open-outline"
                  no-data-text="No hay cuentas"
                  clearable
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="form.concepto"
                  label="Concepto / Descripción"
                  variant="outlined"
                  density="comfortable"
                  placeholder="Opcional"
                  maxlength="100"
                  prepend-inner-icon="mdi-text-short"
                  @input="form.concepto = form.concepto.toUpperCase()"
                />
              </v-col>
            </v-row>
          </div>

          <!-- ── SECCIÓN 4: Montos ──────────────────────────────────── -->
          <div class="form-section montos-section">
            <div class="section-label">
              <v-icon size="15" color="#667eea">mdi-cash-multiple</v-icon>
              <span>Montos</span>
            </div>
            <v-row dense class="mt-1">
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model.number="form.subtotal"
                  label="Subtotal *"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  :rules="reglaSubtotal"
                  type="number"
                  step="0.01"
                  min="0"
                  prepend-inner-icon="mdi-currency-usd"
                  @input="calcularTotal"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model.number="form.impuestos"
                  label="Impuestos / Tax"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  type="number"
                  step="0.01"
                  min="0"
                  prepend-inner-icon="mdi-currency-usd"
                  @input="calcularTotal"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  :model-value="formatMoneda(form.total)"
                  label="Total Pagado"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  readonly
                  prepend-inner-icon="mdi-cash-check"
                  class="total-readonly-field"
                />
              </v-col>
            </v-row>
          </div>

          <!-- ERROR -->
          <v-alert
            v-if="errorMsg"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-2"
            closable
            @click:close="errorMsg = ''"
          >
            {{ errorMsg }}
          </v-alert>

        </v-form>
      </v-card-text>

      <!-- ══ FOOTER ═══════════════════════════════════════════════════════ -->
      <div class="form-footer">
        <v-btn variant="text" color="error" size="large" @click="cerrar" prepend-icon="mdi-close">
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          size="large"
          :loading="store.loading"
          prepend-icon="mdi-content-save-outline"
          @click="handleSubmit"
          class="btn-save"
        >
          {{ esEdicion ? 'Actualizar Gasto' : 'Guardar Gasto' }}
        </v-btn>
      </div>

    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useGestionGastosStore } from '../../../stores/gestiongastos'
import { proveedoresService } from '../../../services/proveedores.service'
import { centroCostosService } from '../../../services/centrocostos.service'
import { cuentasContablesService } from '../../../services/cuentascontables.service'
import { cuentasBancariasService } from '../../../services/cuentasbancarias.service'
import { formatMoneda } from '../../../utils/formatters'

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
const formasPagoOptions = ref([])

const searchProveedor = ref('')
const searchCentroCostos = ref('')
const searchCuenta = ref('')

const formVacio = () => ({
  codigo: '',
  fecha: new Date().toISOString().split('T')[0],
  factura: '',
  proveedor: '',
  ccosto: '',
  forma_pago: '',
  cuenta: '',
  concepto: '',
  subtotal: 0,
  impuestos: 0,
  total: 0,
})

const form = ref(formVacio())

const esEdicion = computed(() => !!props.gasto?.codigo)

// Cargar opciones al montar
onMounted(async () => {
  try {
    // Proveedores (cargar todos)
    const prov = await proveedoresService.getProveedores({ limit: 2000 })
    if (prov.data) proveedoresOptions.value = prov.data
    else if (Array.isArray(prov)) proveedoresOptions.value = prov

    // Centros de Costos (cargar todos)
    const centros = await centroCostosService.getCentrosCostos({ limit: 2000 })
    if (centros.data) centrosCostosOptions.value = centros.data
    else if (Array.isArray(centros)) centrosCostosOptions.value = centros

    // Cuentas Contables
    const cuentas = await cuentasContablesService.getCuentasContables({ limit: 500 })
    if (cuentas.data) cuentasContablesOptions.value = cuentas.data
    else if (Array.isArray(cuentas)) cuentasContablesOptions.value = cuentas

    // Formas de Pago desde Cuentas Bancarias (filtrado por empresa)
    const cuentasBank = await cuentasBancariasService.getCuentas({ limit: 500 })
    if (cuentasBank.data) formasPagoOptions.value = cuentasBank.data
    else if (Array.isArray(cuentasBank)) formasPagoOptions.value = cuentasBank
    else if (cuentasBank) formasPagoOptions.value = cuentasBank
  } catch (err) {
    console.error('Error cargando opciones:', err)
  }
})

// Sincronizar cuando se abre el modal
watch(() => props.open, async (val) => {
  if (val) {
    errorMsg.value = ''
    searchProveedor.value = ''
    searchCentroCostos.value = ''
    searchCuenta.value = ''
    if (props.gasto) {
      form.value = {
        codigo: props.gasto.codigo || '',
        fecha: props.gasto.fecha || '',
        factura: props.gasto.factura || '',
        proveedor: props.gasto.proveedor || '',
        ccosto: props.gasto.ccosto || '',
        forma_pago: props.gasto.forma_pago || '',
        cuenta: props.gasto.cuenta || '',
        concepto: (props.gasto.concepto || '').toUpperCase(),
        subtotal: props.gasto.subtotal || 0,
        impuestos: props.gasto.impuestos || 0,
        total: props.gasto.total || 0,
      }
    } else {
      // No pre-generar el código — se asigna en el servidor al guardar
      // Esto evita que múltiples usuarios vean el mismo código
      form.value = formVacio()
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
  // Concepto es opcional - sin validación requerida
]

const reglaSubtotal = [
  v => v !== null && v !== undefined && v !== '' || 'El subtotal es requerido',
  v => v >= 0 || 'El valor debe ser mayor a 0',
]

// ─── MÉTODOS ─────────────────────────────────────────

function calcularTotal() {
  form.value.total = (form.value.subtotal || 0) + (form.value.impuestos || 0)
}

async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  errorMsg.value = ''
  try {
    const datos = {
      fecha: form.value.fecha,
      factura: form.value.factura.trim() || null,
      proveedor: form.value.proveedor,
      ccosto: form.value.ccosto,
      forma_pago: form.value.forma_pago,
      cuenta: form.value.cuenta,
      concepto: form.value.concepto.trim(),
      subtotal: form.value.subtotal,
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
/* ═══ CARD ═══════════════════════════════════════════════════════════ */
.form-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  overflow: hidden;
}

/* ═══ HEADER ═════════════════════════════════════════════════════════ */
.form-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.form-header-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.form-header-text { flex: 1; }

.form-header-title {
  color: white;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.3px;
  margin: 0;
}

.form-header-sub {
  color: rgba(255, 255, 255, 0.65);
  font-size: 12px;
  margin: 3px 0 0;
}

.codigo-badge {
  background: rgba(255,255,255,0.18);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  border: 1px solid rgba(255,255,255,0.3);
  white-space: nowrap;
}
.codigo-badge.auto {
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.7);
  font-style: italic;
  letter-spacing: 1px;
}

/* ═══ BODY ════════════════════════════════════════════════════════════ */
.form-body {
  padding: 16px 24px !important;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ═══ SECCIONES ══════════════════════════════════════════════════════ */
.form-section {
  background: rgba(var(--v-theme-on-surface), 0.02);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-left: 3px solid #667eea;
  border-radius: 10px;
  padding: 10px 14px 8px;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #667eea;
  margin-bottom: 4px;
}

/* ═══ TOTAL READONLY FIELD ═══════════════════════════════════════════ */
.montos-section { border-left-color: #764ba2; }

.total-readonly-field :deep(.v-field) {
  background: linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%) !important;
}
.total-readonly-field :deep(.v-field__outline__start),
.total-readonly-field :deep(.v-field__outline__notch),
.total-readonly-field :deep(.v-field__outline__end) {
  border-color: rgba(102,126,234,0.6) !important;
  border-width: 2px !important;
}
.total-readonly-field :deep(.v-field__input) {
  font-size: 18px;
  font-weight: 800;
  color: #667eea;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
}
.total-readonly-field :deep(.v-label) {
  color: #667eea !important;
  font-weight: 600;
}
.total-readonly-field :deep(.v-icon) {
  color: #667eea !important;
}

/* ═══ FOOTER ═════════════════════════════════════════════════════════ */
.form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 28px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.01);
}

.btn-save {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  font-weight: 600;
  letter-spacing: 0.3px;
  min-width: 160px;
}
</style>
