<template>
  <MainLayout>
    <div class="ea-container">

      <PageHeader
        title="Entradas de Almacén"
        description="Historial de entradas de materia prima registradas en el sistema"
        :crumbs="['Almacén', 'Reportes', 'Entradas de Almacén']"
      />

      <!-- FILTROS -->
      <div class="ea-form-card">
        <div class="ea-form-row">
          <div class="ea-field">
            <v-text-field
              v-model="filtros.desde"
              label="Desde"
              type="date"
              variant="outlined"
              density="compact"
              hide-details
            />
          </div>
          <div class="ea-field">
            <v-text-field
              v-model="filtros.hasta"
              label="Hasta"
              type="date"
              variant="outlined"
              density="compact"
              hide-details
            />
          </div>
          <div class="ea-field ea-field--btn">
            <v-btn
              color="primary"
              variant="elevated"
              prepend-icon="mdi-magnify"
              :loading="loading"
              @click="buscar"
            >
              Consultar
            </v-btn>
            <v-btn
              v-if="rows.length"
              variant="outlined"
              prepend-icon="mdi-printer"
              @click="imprimir"
            >
              Imprimir
            </v-btn>
          </div>
        </div>
      </div>

      <!-- KPIs -->
      <div v-if="rows.length" class="ea-kpis">
        <div class="ea-kpi">
          <span class="ea-kpi-label">ENTRADAS</span>
          <span class="ea-kpi-value">{{ entradasDistintas }}</span>
        </div>
        <div class="ea-kpi">
          <span class="ea-kpi-label">PRODUCTOS DISTINTOS</span>
          <span class="ea-kpi-value">{{ productosDistintos }}</span>
        </div>
        <div class="ea-kpi">
          <span class="ea-kpi-label">TOTAL VALOR</span>
          <span class="ea-kpi-value ea-kpi-value--money">{{ formatMoneda(totalValor) }}</span>
        </div>
        <div class="ea-kpi">
          <span class="ea-kpi-label">PERÍODO</span>
          <span class="ea-kpi-value ea-kpi-value--sm">{{ periodoLabel }}</span>
        </div>
      </div>

      <!-- TABLA -->
      <div class="ea-table-card" ref="printArea">
        <!-- Encabezado solo para impresión -->
        <div class="print-header">
          <h2>Entradas de Almacén</h2>
          <p>{{ periodoLabel }}</p>
        </div>

        <!-- Estado inicial -->
        <div v-if="!buscado && !loading" class="ea-empty">
          <v-icon size="48" class="ea-empty-icon">mdi-magnify</v-icon>
          <p>Selecciona un rango de fechas y presiona Consultar</p>
        </div>

        <!-- Cargando -->
        <div v-else-if="loading" class="ea-empty">
          <v-progress-circular indeterminate color="primary" size="40" />
          <p class="mt-3">Cargando entradas...</p>
        </div>

        <!-- Sin resultados -->
        <div v-else-if="buscado && rows.length === 0" class="ea-empty">
          <v-icon size="48" class="ea-empty-icon">mdi-inbox-outline</v-icon>
          <p>No hay entradas de almacén para el período seleccionado</p>
        </div>

        <!-- Tabla con datos -->
        <template v-else>
          <div class="ea-table-wrap">
            <table class="ea-table">
              <thead>
                <tr>
                  <th class="col-fecha">FECHA</th>
                  <th class="col-entrada"># ENTRADA</th>
                  <th class="col-gasto">GASTO</th>
                  <th class="col-proveedor">PROVEEDOR</th>
                  <th class="col-producto">PRODUCTO</th>
                  <th class="col-und">UND</th>
                  <th class="col-cantidad">CANTIDAD</th>
                  <th class="col-precio">P. UNIT</th>
                  <th class="col-subtotal">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in rows" :key="i" class="ea-row">
                  <td class="td-fecha">{{ formatFecha(row.fecha) }}</td>
                  <td class="td-entrada">
                    <span class="badge-entrada">{{ row.entrada_codigo }}</span>
                  </td>
                  <td class="td-gasto">{{ row.gasto || '-' }}</td>
                  <td class="td-proveedor">{{ row.proveedor_nombre || row.proveedor || '-' }}</td>
                  <td class="td-producto">{{ row.producto_nombre }}</td>
                  <td class="td-und">{{ row.und || '-' }}</td>
                  <td class="td-cantidad">{{ formatNum(row.cantidad) }}</td>
                  <td class="td-precio">{{ formatMoneda(row.precio_unitario) }}</td>
                  <td class="td-subtotal">{{ formatMoneda(row.subtotal) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="ea-table-footer">
            <span class="footer-total">Total: <strong>{{ rows.length }}</strong> registros</span>
          </div>
        </template>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import { useAuthStore } from '../../stores/auth'
import { formatMoneda } from '../../utils/formatters'
import api from '../../services/api'

const auth = useAuthStore()

const loading = ref(false)
const buscado = ref(false)
const rows = ref([])

const hoy = new Date().toISOString().split('T')[0]
const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

const filtros = ref({ desde: primerDiaMes, hasta: hoy })

const entradasDistintas = computed(() => new Set(rows.value.map(r => r.entrada_codigo)).size)
const productosDistintos = computed(() => new Set(rows.value.map(r => r.producto_codigo)).size)
const totalValor = computed(() => rows.value.reduce((s, r) => s + (parseFloat(r.subtotal) || 0), 0))

const periodoLabel = computed(() => {
  if (!filtros.value.desde && !filtros.value.hasta) return 'Todos los períodos'
  const d = filtros.value.desde ? formatFecha(filtros.value.desde) : '...'
  const h = filtros.value.hasta ? formatFecha(filtros.value.hasta) : '...'
  return `${d} — ${h}`
})

onMounted(() => buscar())

async function buscar() {
  loading.value = true
  buscado.value = false
  try {
    const params = { empresa: auth.empresa }
    if (filtros.value.desde) params.desde = filtros.value.desde
    if (filtros.value.hasta) params.hasta = filtros.value.hasta
    const r = await api.get('/almacen/entradas-almacen', { params })
    rows.value = r.data?.data || []
  } catch (e) {
    console.error(e)
    rows.value = []
  } finally {
    loading.value = false
    buscado.value = true
  }
}

function formatFecha(f) {
  if (!f) return ''
  const d = new Date(f + 'T12:00:00')
  return d.toLocaleDateString('es-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function formatNum(v) {
  const n = parseFloat(v) || 0
  return n % 1 === 0 ? n.toLocaleString('es-US') : n.toLocaleString('es-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

function imprimir() {
  window.print()
}
</script>

<style scoped>
.ea-container { padding: 0 0 32px; }

/* BREADCRUMB */
.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: rgba(var(--v-theme-on-surface), 0.4); text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.25); }
.bc-cat { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-current { font-size: 11px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }

/* HEADER */
.ea-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.ea-header-icon {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
  background: linear-gradient(135deg, #0c4a6e, var(--indigo));
  display: flex; align-items: center; justify-content: center;
}
.ea-title { font-size: 22px; font-weight: 800; margin: 0 0 2px; color: rgb(var(--v-theme-on-surface)); text-transform: uppercase; }
.ea-subtitle { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 0; }

/* FORM CARD */
.ea-form-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}
.ea-form-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
.ea-field { flex: 1; min-width: 160px; }
.ea-field--btn { flex: 0 0 auto; display: flex; gap: 8px; }

/* KPIs */
.ea-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}
.ea-kpi {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex; flex-direction: column; gap: 4px;
}
.ea-kpi-label { font-size: 10px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface), 0.45); }
.ea-kpi-value { font-size: 22px; font-weight: 800; color: var(--indigo); }
.ea-kpi-value--sm { font-size: 13px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }

/* TABLE CARD */
.ea-table-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  overflow: hidden;
}
.ea-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 60px 20px; gap: 12px;
  color: rgba(var(--v-theme-on-surface), 0.4); font-size: 14px;
}
.ea-empty-icon { color: rgba(var(--v-theme-on-surface), 0.2); display: block; }

.ea-table-wrap { overflow-x: auto; }
.ea-table {
  width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed;
}
.ea-table thead { background: rgba(var(--v-theme-on-surface), 0.04); }
.ea-table thead th {
  padding: 11px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.55);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  white-space: nowrap; text-align: center;
}
.col-fecha     { width: 90px; }
.col-entrada   { width: 110px; }
.col-gasto     { width: 110px; }
.col-proveedor { width: 16%; }
.col-producto  { width: auto; }
.col-und       { width: 55px; }
.col-cantidad  { width: 80px; }
.col-precio    { width: 90px; }
.col-subtotal  { width: 95px; }

.ea-row { border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); transition: background 0.15s; }
.ea-row:hover { background: rgba(var(--v-theme-on-surface), 0.03); }
.ea-table tbody td { padding: 10px 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: rgb(var(--v-theme-on-surface)); }

.td-fecha     { text-align: center; }
.td-entrada   { text-align: center; }
.badge-entrada {
  background: rgba(8, 145, 178, 0.12); color: var(--indigo);
  padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 700;
}
.td-gasto     { text-align: center; font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.6); }
.td-proveedor { text-align: left; }
.td-producto  { text-align: left; }
.td-und       { text-align: center; font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.5); }
.td-cantidad  { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
.td-precio    { text-align: right; font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.6); }
.td-subtotal  { text-align: right; font-weight: 700; color: var(--indigo); font-variant-numeric: tabular-nums; }
.ea-kpi-value--money { font-size: 16px; font-weight: 800; color: var(--indigo); }

.ea-table-footer {
  padding: 12px 16px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5);
}
.footer-total strong { color: rgb(var(--v-theme-on-surface)); }

/* PRINT */
.print-header { display: none; }
@media print {
  .breadcrumb, .ea-header, .ea-form-card, .ea-kpis { display: none !important; }
  .ea-table-card { border: none !important; }
  .print-header { display: block; text-align: center; margin-bottom: 16px; }
  .print-header h2 { font-size: 18px; margin: 0 0 4px; }
  .print-header p  { font-size: 13px; color: #555; margin: 0; }
  .ea-row:hover { background: transparent !important; }
}
</style>
