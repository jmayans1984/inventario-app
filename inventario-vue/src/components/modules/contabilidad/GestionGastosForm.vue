<template>
  <v-dialog
    :model-value="open"
    max-width="1080"
    scrollable
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
            {{ esEdicion
              ? `Modificando comprobante #${form.codigo}`
              : 'Una factura de compra · distribuida en uno o varios centros de costo y cuentas' }}
          </p>
        </div>
        <v-spacer />
        <span v-if="esEdicion" class="codigo-badge"># {{ form.codigo }}</span>
        <span v-else class="codigo-badge auto">AUTO</span>
        <v-btn icon="mdi-close" variant="text" size="small" color="white" @click="cerrar" class="ml-2" />
      </div>

      <!-- ══ BODY ═════════════════════════════════════════════════════════ -->
      <v-card-text class="form-body">

        <!-- ── SECCIÓN 1: Comprobante (datos de la factura, compartidos) ── -->
        <div class="form-section">
          <div class="section-label">
            <v-icon size="15" color="#667eea">mdi-file-document-outline</v-icon>
            <span>Comprobante · Factura de Compra</span>
          </div>
          <v-row dense class="mt-1">
            <v-col cols="12" sm="3">
              <v-text-field
                v-model="form.fecha"
                label="Fecha *"
                type="date"
                variant="outlined"
                density="comfortable"
                hide-details
                prepend-inner-icon="mdi-calendar"
              />
            </v-col>
            <v-col cols="12" sm="3">
              <v-text-field
                v-model="form.factura"
                label="N° Factura"
                variant="outlined"
                density="comfortable"
                hide-details
                placeholder="FAC-2026-001"
                maxlength="50"
                prepend-inner-icon="mdi-pound"
                @input="form.factura = form.factura.toUpperCase()"
              />
            </v-col>
            <v-col cols="12" sm="3">
              <v-autocomplete
                v-model="form.proveedor"
                label="Proveedor *"
                variant="outlined"
                density="comfortable"
                hide-details
                :items="proveedoresOptions"
                item-title="nombre"
                item-value="codigo"
                placeholder="Buscar..."
                prepend-inner-icon="mdi-account-tie-outline"
                no-data-text="No hay proveedores"
                clearable
              />
            </v-col>
            <v-col cols="12" sm="3">
              <v-autocomplete
                v-model="form.forma_pago"
                label="Forma de Pago *"
                variant="outlined"
                density="comfortable"
                hide-details
                :items="formasPagoOptions"
                item-title="nombre_cta"
                item-value="codigo"
                placeholder="Cuenta bancaria..."
                prepend-inner-icon="mdi-credit-card-outline"
                no-data-text="No hay formas de pago"
                clearable
              />
            </v-col>
          </v-row>
        </div>

        <!-- ── SECCIÓN 2: Distribución del gasto ─────────────────────── -->
        <div class="form-section dist-section">
          <div class="section-label" style="color:#0ea5e9">
            <v-icon size="15" color="#0ea5e9">mdi-call-split</v-icon>
            <span>Distribución del Gasto</span>
            <span class="dist-hint">divide la factura entre centros de costo y cuentas contables</span>
          </div>

          <div v-for="(ln, idx) in form.lineas" :key="ln.uid" class="dist-linea">
            <div class="dist-linea-num">{{ idx + 1 }}</div>
            <v-row dense class="dist-linea-fields">
              <v-col cols="12" sm="3">
                <v-autocomplete
                  v-model="ln.ccosto"
                  label="Centro de Costos *"
                  variant="outlined"
                  density="compact"
                  hide-details
                  :items="centrosCostosOptions"
                  item-title="nombre"
                  item-value="codigo"
                  no-data-text="Sin centros"
                  clearable
                />
              </v-col>
              <v-col cols="12" sm="3">
                <v-autocomplete
                  v-model="ln.cuenta"
                  label="Cuenta Contable *"
                  variant="outlined"
                  density="compact"
                  hide-details
                  :items="cuentasContablesOptions"
                  item-title="nombre"
                  item-value="codigo"
                  no-data-text="Sin cuentas"
                  clearable
                />
              </v-col>
              <v-col cols="12" sm="2">
                <v-text-field
                  v-model="ln.concepto"
                  label="Concepto"
                  variant="outlined"
                  density="compact"
                  hide-details
                  maxlength="100"
                  @input="ln.concepto = ln.concepto.toUpperCase()"
                />
              </v-col>
              <v-col cols="6" sm="1.5" style="min-width:110px">
                <v-text-field
                  v-model.number="ln.subtotal"
                  label="Subtotal *"
                  variant="outlined"
                  density="compact"
                  hide-details
                  type="number"
                  step="0.01"
                  min="0"
                />
              </v-col>
              <v-col cols="6" sm="1.5" style="min-width:100px">
                <v-text-field
                  v-model.number="ln.impuestos"
                  label="Imp/Tax"
                  variant="outlined"
                  density="compact"
                  hide-details
                  type="number"
                  step="0.01"
                  min="0"
                />
              </v-col>
              <v-col cols="12" sm="1" class="dist-linea-total-col">
                <div class="dist-linea-total">{{ formatMoneda(totalLinea(ln)) }}</div>
              </v-col>
            </v-row>
            <v-btn
              v-if="!esEdicion && form.lineas.length > 1"
              icon variant="text" size="x-small" color="#ef4444"
              class="dist-linea-del"
              title="Quitar línea"
              @click="quitarLinea(idx)"
            >
              <v-icon size="16">mdi-delete-outline</v-icon>
            </v-btn>

            <!-- Chip de materia prima cuando la cuenta coincide -->
            <div v-if="esMateriaPrima(ln)" class="mp-chip-row">
              <button class="mp-chip" :class="{ 'mp-chip-ok': ln.materiaPrima?.items?.length }" @click="abrirMateriaPrima(idx)">
                <v-icon size="13">{{ ln.materiaPrima?.items?.length ? 'mdi-check-circle' : 'mdi-package-variant-plus' }}</v-icon>
                <template v-if="ln.materiaPrima?.items?.length">
                  {{ ln.materiaPrima.items.length }} producto{{ ln.materiaPrima.items.length !== 1 ? 's' : '' }} · {{ formatMoneda(totalItemsMp(ln.materiaPrima)) }}
                  <span v-if="ln.materiaPrima.afectaInventario" class="mp-chip-tag">+INVENTARIO</span>
                  <span v-if="ln.materiaPrima.actualizaCosto" class="mp-chip-tag">+COSTO</span>
                </template>
                <template v-else>
                  Registrar entrada de almacén (materia prima)
                </template>
              </button>
            </div>
          </div>

          <v-btn
            v-if="!esEdicion"
            variant="tonal"
            color="#0ea5e9"
            size="small"
            class="mt-2"
            prepend-icon="mdi-plus"
            @click="agregarLinea"
          >
            Agregar línea
          </v-btn>
        </div>

        <!-- ── SECCIÓN 3: Totales de la factura ──────────────────────── -->
        <div class="form-section totales-section">
          <div class="tot-grid">
            <div class="tot-item">
              <span class="tot-lbl">SUBTOTAL</span>
              <span class="tot-val">{{ formatMoneda(sumSubtotal) }}</span>
            </div>
            <div class="tot-item">
              <span class="tot-lbl">IMPUESTOS</span>
              <span class="tot-val">{{ formatMoneda(sumImpuestos) }}</span>
            </div>
            <div class="tot-item tot-item-final">
              <span class="tot-lbl">TOTAL PAGADO</span>
              <span class="tot-val tot-val-final">{{ formatMoneda(sumTotal) }}</span>
            </div>
          </div>
          <div v-if="!esEdicion" class="tot-nota">
            <v-icon size="13" color="#0ea5e9">mdi-information-outline</v-icon>
            Se registrará{{ form.lineas.length > 1 ? `n ${form.lineas.length} gastos` : ' 1 gasto' }} y
            <strong>un solo movimiento bancario</strong> por {{ formatMoneda(sumTotal) }}
          </div>
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
          :loading="store.loading || guardando"
          prepend-icon="mdi-content-save-outline"
          @click="handleSubmit"
          class="btn-save"
        >
          {{ esEdicion ? 'Actualizar Gasto' : 'Guardar Gasto' }}
        </v-btn>
      </div>

    </v-card>

    <!-- ═══════════════════════════════════════════════════════════════════
         SUB-DIALOG: ENTRADA DE ALMACÉN — MATERIA PRIMA
    ═══════════════════════════════════════════════════════════════════ -->
    <v-dialog v-model="mpDialogOpen" max-width="760" scrollable>
      <v-card rounded="xl" class="form-card">
        <div class="form-header" style="background: linear-gradient(135deg,#f59e0b,#d97706)">
          <div class="form-header-icon">
            <v-icon size="22" color="white">mdi-package-variant-plus</v-icon>
          </div>
          <div class="form-header-text">
            <p class="form-header-title">Entrada de Almacén — Materia Prima</p>
            <p class="form-header-sub">Detalla los productos comprados en esta línea de la factura</p>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" color="white" @click="mpDialogOpen = false" />
        </div>

        <v-card-text class="form-body">

          <!-- Opciones -->
          <div class="mp-opts">
            <v-checkbox
              v-model="mpDraft.afectaInventario"
              density="compact"
              hide-details
              color="#f59e0b"
            >
              <template #label>
                <span class="mp-opt-lbl">
                  <strong>Afectar inventario de la bodega maestra</strong>
                  — registra la entrada de estas cantidades en el inventario
                </span>
              </template>
            </v-checkbox>
            <v-checkbox
              v-model="mpDraft.actualizaCosto"
              density="compact"
              hide-details
              color="#f59e0b"
            >
              <template #label>
                <span class="mp-opt-lbl">
                  <strong>Actualizar precio de costo</strong>
                  — el costo unitario de esta compra reemplaza el precio de costo del producto
                </span>
              </template>
            </v-checkbox>
          </div>

          <!-- Items -->
          <div class="mp-items">
            <div v-for="(item, i) in mpDraft.items" :key="i" class="mp-item-row">
              <v-autocomplete
                v-model="item.codigo"
                :items="productosOptions"
                :loading="productosLoading"
                item-title="nombre"
                item-value="codigo"
                label="Producto *"
                variant="outlined"
                density="compact"
                hide-details
                class="mp-item-prod"
                no-data-text="Sin productos"
                @update:model-value="onProductoSeleccionado(item)"
              >
                <template #item="{ item: it, props: p }">
                  <v-list-item v-bind="p">
                    <template #append>
                      <span class="mp-prod-meta">{{ it.raw.codigo }} · {{ it.raw.und }}</span>
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>
              <v-text-field
                v-model.number="item.cantidad"
                label="Cantidad *"
                variant="outlined"
                density="compact"
                hide-details
                type="number"
                step="0.01"
                min="0"
                class="mp-item-cant"
                :suffix="undProducto(item.codigo)"
              />
              <v-text-field
                v-model.number="item.costoUnit"
                label="Costo Unit. *"
                variant="outlined"
                density="compact"
                hide-details
                type="number"
                step="0.0001"
                min="0"
                class="mp-item-costo"
                prefix="$"
              />
              <div class="mp-item-subtotal">{{ formatMoneda((item.cantidad || 0) * (item.costoUnit || 0)) }}</div>
              <v-btn icon variant="text" size="x-small" color="#ef4444" @click="mpDraft.items.splice(i, 1)">
                <v-icon size="16">mdi-delete-outline</v-icon>
              </v-btn>
            </div>

            <v-btn variant="tonal" color="#f59e0b" size="small" prepend-icon="mdi-plus" @click="agregarItemMp">
              Agregar producto
            </v-btn>
          </div>

          <!-- Total items vs línea -->
          <div class="mp-total-row">
            <span>TOTAL PRODUCTOS</span>
            <span class="mp-total-val">{{ formatMoneda(totalItemsMp(mpDraft)) }}</span>
          </div>
          <div
            v-if="mpLineaRef && Math.abs(totalItemsMp(mpDraft) - (mpLineaRef.subtotal || 0)) > 0.01 && mpDraft.items.length"
            class="mp-warn"
          >
            <v-icon size="14" color="#f59e0b">mdi-alert-outline</v-icon>
            El total de productos no coincide con el subtotal de la línea ({{ formatMoneda(mpLineaRef.subtotal || 0) }})
          </div>

        </v-card-text>

        <div class="form-footer">
          <v-btn variant="text" @click="mpDialogOpen = false">Cancelar</v-btn>
          <v-btn color="#f59e0b" variant="elevated" prepend-icon="mdi-check" @click="confirmarMateriaPrima">
            Aceptar
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useGestionGastosStore } from '../../../stores/gestiongastos'
import { gestionGastosService } from '../../../services/gestiongastos.service'
import { proveedoresService } from '../../../services/proveedores.service'
import { centroCostosService } from '../../../services/centrocostos.service'
import { cuentasContablesService } from '../../../services/cuentascontables.service'
import { cuentasBancariasService } from '../../../services/cuentasbancarias.service'
import { formatMoneda } from '../../../utils/formatters'
import api from '../../../services/api'
import { useAuthStore } from '../../../stores/auth'

const props = defineProps({
  open: Boolean,
  gasto: Object,
})

const emit = defineEmits(['update:open', 'close', 'guardar'])

const store = useGestionGastosStore()
const authStore = useAuthStore()
const empresa = computed(() => authStore.empresa || authStore.user?.empresa || '')

const errorMsg = ref('')
const guardando = ref(false)

const proveedoresOptions = ref([])
const centrosCostosOptions = ref([])
const cuentasContablesOptions = ref([])
const formasPagoOptions = ref([])

// Cuenta contable configurada como "materia prima" (config_general.cta_materia_prima)
const ctaMateriaPrima = ref(null)

let uidSeq = 1
const lineaVacia = () => ({
  uid: uidSeq++,
  ccosto: '',
  cuenta: '',
  concepto: '',
  subtotal: 0,
  impuestos: 0,
  materiaPrima: null,   // { afectaInventario, actualizaCosto, items: [{codigo, cantidad, costoUnit}] }
})

const formVacio = () => {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return {
    codigo: '',
    fecha: `${y}-${m}-${d}`,
    factura: '',
    proveedor: '',
    forma_pago: '',
    lineas: [lineaVacia()],
  }
}

const form = ref(formVacio())
const esEdicion = computed(() => !!props.gasto?.codigo)

// ─── Totales ─────────────────────────────────────────
const totalLinea = (ln) => (parseFloat(ln.subtotal) || 0) + (parseFloat(ln.impuestos) || 0)
const sumSubtotal  = computed(() => form.value.lineas.reduce((s, l) => s + (parseFloat(l.subtotal) || 0), 0))
const sumImpuestos = computed(() => form.value.lineas.reduce((s, l) => s + (parseFloat(l.impuestos) || 0), 0))
const sumTotal     = computed(() => sumSubtotal.value + sumImpuestos.value)

// ─── Líneas ──────────────────────────────────────────
function agregarLinea() {
  const prev = form.value.lineas[form.value.lineas.length - 1]
  const nueva = lineaVacia()
  if (prev) nueva.ccosto = prev.ccosto   // hereda el CC para agilizar captura
  form.value.lineas.push(nueva)
}

function quitarLinea(idx) {
  form.value.lineas.splice(idx, 1)
}

function esMateriaPrima(ln) {
  return !!ctaMateriaPrima.value && ln.cuenta === ctaMateriaPrima.value
}

// ─── Sub-dialog materia prima ────────────────────────
const mpDialogOpen = ref(false)
const mpLineaIdx = ref(-1)
const mpDraft = ref({ afectaInventario: false, actualizaCosto: false, items: [] })
const mpLineaRef = computed(() => form.value.lineas[mpLineaIdx.value] || null)

const productosOptions = ref([])
const productosLoading = ref(false)

async function cargarProductos() {
  if (productosOptions.value.length || productosLoading.value) return
  productosLoading.value = true
  try {
    const res = await api.get('/almacen/productos', { params: { empresa: empresa.value } })
    const todos = res.data?.data || []
    // Solo productos controlados en inventario (los que maneja la bodega maestra)
    productosOptions.value = todos.filter(p => p.control === 'SI')
  } catch (e) {
    console.error('cargarProductos:', e)
  } finally {
    productosLoading.value = false
  }
}

function abrirMateriaPrima(idx) {
  mpLineaIdx.value = idx
  const existente = form.value.lineas[idx].materiaPrima
  mpDraft.value = existente
    ? JSON.parse(JSON.stringify(existente))
    : { afectaInventario: false, actualizaCosto: false, items: [{ codigo: '', cantidad: 0, costoUnit: 0 }] }
  if (!mpDraft.value.items.length) mpDraft.value.items.push({ codigo: '', cantidad: 0, costoUnit: 0 })
  mpDialogOpen.value = true
  cargarProductos()
}

function agregarItemMp() {
  mpDraft.value.items.push({ codigo: '', cantidad: 0, costoUnit: 0 })
}

function onProductoSeleccionado(item) {
  const p = productosOptions.value.find(pr => pr.codigo === item.codigo)
  if (p && (!item.costoUnit || item.costoUnit === 0)) {
    item.costoUnit = parseFloat(p.precio_costo) || 0
  }
}

function undProducto(codigo) {
  return productosOptions.value.find(p => p.codigo === codigo)?.und || ''
}

const totalItemsMp = (mp) =>
  (mp?.items || []).reduce((s, it) => s + (parseFloat(it.cantidad) || 0) * (parseFloat(it.costoUnit) || 0), 0)

function confirmarMateriaPrima() {
  const items = mpDraft.value.items.filter(it => it.codigo && (parseFloat(it.cantidad) || 0) > 0)
  if (mpLineaIdx.value >= 0) {
    form.value.lineas[mpLineaIdx.value].materiaPrima = items.length
      ? { afectaInventario: mpDraft.value.afectaInventario, actualizaCosto: mpDraft.value.actualizaCosto, items }
      : null
  }
  mpDialogOpen.value = false
}

// ─── Carga de opciones ───────────────────────────────
onMounted(async () => {
  try {
    const [prov, centros, cuentas, cuentasBank, cfg] = await Promise.all([
      proveedoresService.getProveedores({ limit: 2000 }),
      centroCostosService.getCentrosCostos({ limit: 2000 }),
      cuentasContablesService.getCuentasContables({ limit: 500 }),
      cuentasBancariasService.getCuentas({ limit: 500 }),
      api.get('/config-general', { params: { empresa: empresa.value } }).catch(() => null),
    ])
    proveedoresOptions.value      = prov?.data || (Array.isArray(prov) ? prov : [])
    centrosCostosOptions.value    = centros?.data || (Array.isArray(centros) ? centros : [])
    cuentasContablesOptions.value = cuentas?.data || (Array.isArray(cuentas) ? cuentas : [])
    formasPagoOptions.value       = cuentasBank?.data || (Array.isArray(cuentasBank) ? cuentasBank : (cuentasBank || []))
    ctaMateriaPrima.value         = cfg?.data?.data?.cta_materia_prima || null
  } catch (err) {
    console.error('Error cargando opciones:', err)
  }
})

// ─── Sincronizar al abrir ────────────────────────────
watch(() => props.open, async (val) => {
  if (!val) return
  errorMsg.value = ''
  if (props.gasto?.codigo) {
    try {
      const gastoFresco = await gestionGastosService.getGasto(props.gasto.codigo)
      const gasto = gastoFresco.data || gastoFresco
      form.value = {
        codigo: gasto.codigo || '',
        fecha: (gasto.fecha || '').split('T')[0],
        factura: gasto.factura || '',
        proveedor: gasto.proveedor || '',
        forma_pago: gasto.forma_pago || '',
        lineas: [{
          uid: uidSeq++,
          ccosto: gasto.ccosto || '',
          cuenta: gasto.cuenta || '',
          concepto: (gasto.concepto || '').toUpperCase(),
          subtotal: Math.round(parseFloat(gasto.subtotal || 0) * 100) / 100,
          impuestos: Math.round(parseFloat(gasto.impuestos || 0) * 100) / 100,
          materiaPrima: null,
        }],
      }
    } catch (err) {
      console.error('Error cargando gasto:', err)
      errorMsg.value = 'No se pudo cargar el gasto'
    }
  } else {
    form.value = formVacio()
  }
})

// ─── Guardar ─────────────────────────────────────────
function validar() {
  if (!form.value.fecha)      return 'La fecha es requerida'
  if (!form.value.proveedor)  return 'Debe seleccionar un proveedor'
  if (!form.value.forma_pago) return 'Debe seleccionar una forma de pago'
  for (const [i, ln] of form.value.lineas.entries()) {
    if (!ln.ccosto) return `Línea ${i + 1}: selecciona el centro de costos`
    if (!ln.cuenta) return `Línea ${i + 1}: selecciona la cuenta contable`
    if (!(parseFloat(ln.subtotal) > 0)) return `Línea ${i + 1}: el subtotal debe ser mayor a 0`
  }
  return null
}

async function handleSubmit() {
  const err = validar()
  if (err) { errorMsg.value = err; return }
  errorMsg.value = ''
  guardando.value = true
  try {
    let resultado
    if (esEdicion.value) {
      // Edición: comportamiento clásico sobre un solo gasto
      const ln = form.value.lineas[0]
      resultado = await store.actualizarGasto(props.gasto.codigo, {
        fecha: form.value.fecha,
        factura: form.value.factura.trim() || null,
        proveedor: form.value.proveedor,
        ccosto: ln.ccosto,
        forma_pago: form.value.forma_pago,
        cuenta: ln.cuenta,
        concepto: (ln.concepto || '').trim(),
        subtotal: parseFloat(ln.subtotal) || 0,
        impuestos: parseFloat(ln.impuestos) || 0,
        total: totalLinea(ln),
      })
    } else {
      // Creación: N líneas → N gastos + 1 solo moviban
      resultado = await store.crearGastoMultiple({
        fecha: form.value.fecha,
        factura: form.value.factura.trim() || null,
        proveedor: form.value.proveedor,
        forma_pago: form.value.forma_pago,
        lineas: form.value.lineas.map(ln => ({
          ccosto: ln.ccosto,
          cuenta: ln.cuenta,
          concepto: (ln.concepto || '').trim(),
          subtotal: parseFloat(ln.subtotal) || 0,
          impuestos: parseFloat(ln.impuestos) || 0,
          total: totalLinea(ln),
          materiaPrima: esMateriaPrima(ln) ? ln.materiaPrima : null,
        })),
      })
    }
    emit('guardar', resultado)
    cerrar()
  } catch (err2) {
    errorMsg.value = err2.response?.data?.error || err2.response?.data?.message || err2.message || 'Error al guardar'
  } finally {
    guardando.value = false
  }
}

function cerrar() {
  form.value = formVacio()
  errorMsg.value = ''
  mpDialogOpen.value = false
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
  padding: 18px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.form-header-icon {
  width: 46px;
  height: 46px;
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
  font-size: 17px;
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
  gap: 12px;
}

/* ═══ SECCIONES ══════════════════════════════════════════════════════ */
.form-section {
  background: rgba(var(--v-theme-on-surface), 0.02);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-left: 3px solid #667eea;
  border-radius: 10px;
  padding: 10px 14px 12px;
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
.dist-section { border-left-color: #0ea5e9; }
.dist-hint {
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  color: rgba(var(--v-theme-on-surface), 0.4);
}

/* ═══ LÍNEAS DE DISTRIBUCIÓN ═════════════════════════════════════════ */
.dist-linea {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 10px;
  padding: 12px 40px 10px 10px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.dist-linea-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(14,165,233,0.12);
  color: #0ea5e9;
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 8px;
}
.dist-linea-fields { flex: 1; min-width: 0; }
.dist-linea-total-col { display: flex; align-items: center; }
.dist-linea-total {
  font-family: monospace;
  font-size: 13px;
  font-weight: 800;
  color: #0ea5e9;
  white-space: nowrap;
  padding-top: 6px;
}
.dist-linea-del {
  position: absolute;
  top: 8px;
  right: 8px;
}

/* Chip materia prima */
.mp-chip-row { width: 100%; padding-left: 34px; }
.mp-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px dashed rgba(245,158,11,0.5);
  background: rgba(245,158,11,0.06);
  color: #d97706;
  border-radius: 18px;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all .15s;
  margin-top: 6px;
}
.mp-chip:hover { background: rgba(245,158,11,0.14); }
.mp-chip-ok {
  border-style: solid;
  background: rgba(16,185,129,0.07);
  border-color: rgba(16,185,129,0.4);
  color: #059669;
}
.mp-chip-tag {
  background: rgba(16,185,129,0.15);
  padding: 1px 7px;
  border-radius: 9px;
  font-size: 9px;
  font-weight: 800;
}

/* ═══ TOTALES ════════════════════════════════════════════════════════ */
.totales-section { border-left-color: #764ba2; }
.tot-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.tot-item {
  flex: 1;
  min-width: 140px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.tot-item-final {
  background: linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%);
  border: 1.5px solid rgba(102,126,234,0.5);
}
.tot-lbl {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.6px;
  color: rgba(var(--v-theme-on-surface), 0.45);
}
.tot-val {
  font-family: monospace;
  font-size: 17px;
  font-weight: 800;
}
.tot-val-final { color: #667eea; font-size: 20px; }
.tot-nota {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

/* ═══ MATERIA PRIMA (sub-dialog) ═════════════════════════════════════ */
.mp-opts {
  background: rgba(245,158,11,0.05);
  border: 1px solid rgba(245,158,11,0.2);
  border-radius: 10px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.mp-opt-lbl { font-size: 12.5px; line-height: 1.4; }
.mp-items { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
.mp-item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.mp-item-prod { flex: 1; min-width: 220px; }
.mp-item-cant { width: 130px; flex-shrink: 0; }
.mp-item-costo { width: 130px; flex-shrink: 0; }
.mp-item-subtotal {
  font-family: monospace;
  font-size: 12px;
  font-weight: 800;
  color: #d97706;
  min-width: 80px;
  text-align: right;
}
.mp-prod-meta { font-size: 10px; color: rgba(var(--v-theme-on-surface), 0.4); }
.mp-total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  padding: 10px 12px;
  border-top: 2px solid rgba(var(--v-theme-on-surface), 0.08);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.4px;
}
.mp-total-val { font-family: monospace; font-size: 15px; color: #d97706; }
.mp-warn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: #d97706;
  background: rgba(245,158,11,0.07);
  border-radius: 8px;
  padding: 7px 10px;
}

/* ═══ FOOTER ═════════════════════════════════════════════════════════ */
.form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
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
