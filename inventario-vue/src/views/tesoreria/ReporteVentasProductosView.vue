<template>
  <MainLayout>

    <PageHeader
      title="Ventas de Productos por Período"
      description="Detalle de productos vendidos importados desde Square"
      :crumbs="['Tesorería', 'Reportes', 'Ventas de Productos por Período']"
    >
      <template #actions>
        <v-btn
          v-if="rows.length > 0"
          color="error"
          variant="flat"
          size="small"
          prepend-icon="mdi-file-pdf-box"
          :loading="generandoPdf"
          @click="exportarPDF"
        >Exportar PDF</v-btn>
      </template>
    </PageHeader>

    <!-- FILTROS -->
    <div class="filters-panel">
      <div class="filters-grid">

        <!-- Fechas -->
        <div class="filter-group dates-group">
          <div class="filter-label">
            <v-icon size="13" color="primary">mdi-calendar-range</v-icon>
            <span>Período</span>
          </div>
          <div class="dates-row">
            <input v-model="fechaInicio" type="date" class="date-input" />
            <v-icon size="15" color="rgba(255,255,255,0.3)">mdi-arrow-right</v-icon>
            <input v-model="fechaFin" type="date" class="date-input" />
          </div>
        </div>

        <!-- Centro de Costos -->
        <div class="filter-group">
          <div class="filter-label">
            <v-icon size="13" color="warning">mdi-map-marker-outline</v-icon>
            <span>Centro de Costos</span>
          </div>
          <v-select
            v-model="ccostosSeleccionados"
            :items="ccostos"
            item-title="nombre"
            item-value="codigo"
            density="compact"
            variant="outlined"
            hide-details
            :loading="ccostosLoading"
            class="filter-select-v"
            bg-color="rgb(var(--v-theme-surface))"
            style="min-width:240px"
            multiple
            chips
            closable-chips
            placeholder="Todos los centros"
            :menu-props="{ maxHeight: 320 }"
          >
            <template #prepend-item>
              <v-list-item title="Seleccionar todos" @click="toggleTodosCcostos">
                <template #prepend>
                  <v-checkbox-btn
                    :model-value="todosSeleccionados"
                    :indeterminate="algunoSeleccionado && !todosSeleccionados"
                    color="warning"
                  />
                </template>
              </v-list-item>
              <v-divider class="mb-1" />
            </template>
            <template #item="{ item, props }">
              <v-list-item v-bind="props" :title="item.title">
                <template #prepend>
                  <v-checkbox-btn
                    :model-value="ccostosSeleccionados.includes(item.value)"
                    color="warning"
                  />
                </template>
              </v-list-item>
            </template>
          </v-select>
        </div>

      </div>

      <div class="filters-footer">
        <button class="btn-consultar" :disabled="loading" @click="consultar">
          <v-icon v-if="!loading" size="17">mdi-magnify</v-icon>
          <v-progress-circular v-else size="15" width="2" indeterminate color="white" />
          <span>{{ loading ? 'Consultando...' : 'Consultar' }}</span>
        </button>
      </div>
    </div>

    <!-- ERROR -->
    <div v-if="error" class="error-banner">
      <v-icon size="18" color="error">mdi-alert-circle-outline</v-icon>
      <span>{{ error }}</span>
    </div>

    <!-- KPI CARDS -->
    <div v-if="rows.length > 0" class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-icon" style="background:rgba(6,182,212,0.13)">
          <v-icon size="20" color="primary">mdi-package-variant-closed</v-icon>
        </div>
        <div class="kpi-info">
          <span class="kpi-val">{{ totals.total_productos }}</span>
          <span class="kpi-label">Productos</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:rgba(139,92,246,0.13)">
          <v-icon size="20" color="primary">mdi-counter</v-icon>
        </div>
        <div class="kpi-info">
          <span class="kpi-val">{{ fmtNum(totals.total_cant) }}</span>
          <span class="kpi-label">Unidades</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:rgba(16,185,129,0.13)">
          <v-icon size="20" color="success">mdi-currency-usd</v-icon>
        </div>
        <div class="kpi-info">
          <span class="kpi-val">{{ fmt(totals.total_valor) }}</span>
          <span class="kpi-label">Total Ventas</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:rgba(245,158,11,0.13)">
          <v-icon size="20" color="warning">mdi-tag-outline</v-icon>
        </div>
        <div class="kpi-info">
          <span class="kpi-val">{{ fmt(totals.ticket_promedio) }}</span>
          <span class="kpi-label">Precio Prom.</span>
        </div>
      </div>
    </div>

    <!-- TABLA -->
    <div v-if="rows.length > 0" class="table-wrap">
      <table class="vp-table">
        <thead>
          <tr>
            <th>CÓD.</th>
            <th>PRODUCTO</th>
            <th class="col-num">CANT.</th>
            <th class="col-num">VR. UNIT.</th>
            <th class="col-num">SUBTOTAL</th>
            <th class="col-num">% TOTAL</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in rows" :key="i" class="tr-data">
            <td><span class="badge-cod">{{ r.codigo }}</span></td>
            <td class="td-nombre">{{ r.nombre }}</td>
            <td class="col-num">{{ fmtNum(r.total_cant) }}</td>
            <td class="col-num td-dim">{{ fmt(r.vr_unit_prom) }}</td>
            <td class="col-num td-bold">{{ fmt(r.total_subtotal) }}</td>
            <td class="col-num">
              <div class="pct-wrap">
                <div class="pct-bar" :style="{ width: getPct(r.total_subtotal) + '%' }"></div>
                <span class="pct-val">{{ getPct(r.total_subtotal).toFixed(1) }}%</span>
              </div>
            </td>
          </tr>
        </tbody>
        <!-- Totales -->
        <tfoot>
          <tr class="tr-total">
            <td colspan="2">TOTALES</td>
            <td class="col-num">{{ fmtNum(totals.total_cant) }}</td>
            <td class="col-num"></td>
            <td class="col-num td-bold">{{ fmt(totals.total_valor) }}</td>
            <td class="col-num">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- ESTADO VACÍO -->
    <div v-else-if="!loading && consultado" class="empty-state">
      <v-icon size="52" color="rgba(var(--v-theme-on-surface),0.15)">mdi-package-variant-closed</v-icon>
      <p>No hay registros de ventas de productos para el período y filtros seleccionados</p>
    </div>

  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatFecha } from '../../utils/formatters'
import { detailTableOptions, drawReportFooter, drawReportHeader, summaryTableOptions } from '../../utils/pdfReportStyle'

const authStore = useAuthStore()

function getEmpresa() {
  return authStore.empresaCodigo
    || authStore.empresa
    || localStorage.getItem('empresaActual')
    || ''
}

// ── Fechas por defecto: mes actual ──────────────────────────────
function primerDiaMes() {
  const hoy = new Date()
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10)
}
function ultimoDiaMes() {
  const hoy = new Date()
  return new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10)
}

const fechaInicio          = ref(primerDiaMes())
const fechaFin             = ref(ultimoDiaMes())
const ccostosSeleccionados = ref([])
const ccostos              = ref([])
const ccostosLoading       = ref(false)
const rows           = ref([])
const totals         = ref({ total_productos: 0, total_cant: 0, total_valor: 0, ticket_promedio: 0 })
const loading        = ref(false)
const error          = ref('')
const consultado     = ref(false)
const generandoPdf   = ref(false)

// ── Multi-select helpers ────────────────────────────────────────
const todosSeleccionados = computed(() => ccostosSeleccionados.value.length === ccostos.value.length && ccostos.value.length > 0)
const algunoSeleccionado = computed(() => ccostosSeleccionados.value.length > 0)

function toggleTodosCcostos() {
  if (todosSeleccionados.value) {
    ccostosSeleccionados.value = []
  } else {
    ccostosSeleccionados.value = ccostos.value.map(c => c.codigo)
  }
}

const ccostoLabel = computed(() => {
  if (!ccostosSeleccionados.value.length) return 'Todos los centros'
  if (todosSeleccionados.value) return 'Todos los centros'
  return ccostosSeleccionados.value
    .map(cod => ccostos.value.find(c => c.codigo === cod)?.nombre || cod)
    .join(', ')
})

// ── Cargar ccostos ──────────────────────────────────────────────
async function fetchCcostos() {
  const emp = getEmpresa()
  if (!emp) return
  ccostosLoading.value = true
  try {
    const r = await api.get('/ccostos', { params: { empresa: emp } })
    const data = r.data?.data ?? r.data
    ccostos.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('[ventas-productos] fetchCcostos error:', e)
  } finally {
    ccostosLoading.value = false
  }
}

// ── Consultar ───────────────────────────────────────────────────
async function consultar() {
  const emp = getEmpresa()
  if (!emp) { error.value = 'No se pudo determinar la empresa.'; return }
  loading.value    = true
  error.value      = ''
  rows.value       = []
  consultado.value = true
  try {
    const params = {
      empresa:     emp,
      fechaInicio: fechaInicio.value,
      fechaFin:    fechaFin.value,
    }
    // Si hay selección parcial enviar lista; vacío = todos
    if (ccostosSeleccionados.value.length > 0 && !todosSeleccionados.value) {
      params.ccostos = ccostosSeleccionados.value.join(',')
    }
    const r = await api.get('/tesoreria/ventas-productos-periodo', { params })
    if (!r.data?.success) throw new Error(r.data?.error || 'Error al consultar')
    rows.value   = r.data.data   || []
    totals.value = r.data.totals || { total_productos: 0, total_cant: 0, total_valor: 0, ticket_promedio: 0 }
  } catch (e) {
    error.value = e?.response?.data?.error || e.message || 'Error al consultar'
  } finally {
    loading.value = false
  }
}

// ── Formatters ──────────────────────────────────────────────────
function fmt(n) {
  const v = parseFloat(n) || 0
  return v.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtNum(n) {
  const v = parseFloat(n) || 0
  return v.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function getPct(subtotal) {
  const total = parseFloat(totals.value.total_valor) || 1
  return Math.min(100, (parseFloat(subtotal) / total) * 100)
}

function fmtFechaCorta(f) {
  if (!f) return ''
  const s = String(f).slice(0, 10)
  const [y, m, d] = s.split('-')
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${d} ${meses[parseInt(m) - 1]} ${y}`
}

// ── PDF ─────────────────────────────────────────────────────────

function exportarPDF() {
  if (!rows.value.length) return
  generandoPdf.value = true
  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
    const ML = 10
    const ccostoLabelPDF = ccostoLabel.value
    const startY = drawReportHeader(doc, {
      title: 'VENTAS DE PRODUCTOS POR PERIODO',
      subtitle: `Periodo: ${fmtFechaCorta(fechaInicio.value)} - ${fmtFechaCorta(fechaFin.value)} | C. Costo: ${ccostoLabelPDF}`,
      empresa: authStore.empresaNombre || empresa.value,
      usuario: authStore.userName || authStore.userNombre,
      margin: ML,
    })

    autoTable(doc, {
      startY,
      head: [['Productos', 'Total Unidades', 'Total Ventas', 'Precio Promedio']],
      body: [[String(totals.value.total_productos), fmtNum(totals.value.total_cant), fmt(totals.value.total_valor), fmt(totals.value.ticket_promedio)]],
      ...summaryTableOptions(ML),
    })

    const totalValor = parseFloat(totals.value.total_valor) || 1
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 4,
      head: [['Codigo', 'Producto', 'Cant.', 'Vr. Unit.', 'Subtotal', '% Total']],
      body: rows.value.map(r => [r.codigo, r.nombre, fmtNum(r.total_cant), fmt(r.vr_unit_prom), fmt(r.total_subtotal), `${Math.min(100, (parseFloat(r.total_subtotal) / totalValor * 100)).toFixed(1)}%`]),
      foot: [['TOTALES', '', fmtNum(totals.value.total_cant), '', fmt(totals.value.total_valor), '100%']],
      ...detailTableOptions(ML),
      columnStyles: { 0: { cellWidth: 22, halign: 'center' }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 22, halign: 'right' }, 3: { cellWidth: 25, halign: 'right' }, 4: { cellWidth: 28, halign: 'right' }, 5: { cellWidth: 18, halign: 'right' } },
      didDrawPage: (data) => drawReportFooter(doc, { pageNumber: data.pageNumber, margin: ML }),
    })

    const blob = doc.output('blob')
    window.open(URL.createObjectURL(blob), '_blank')
  } finally {
    generandoPdf.value = false
  }
}

onMounted(() => {
  fetchCcostos()
})
</script>

<style scoped>
/* ── Layout ───────────────────────────────────────────────────── */
.breadcrumb-bar {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.45);
  letter-spacing: 0.5px; margin-bottom: 16px;
}
.bc-root   { color: var(--indigo); }
.bc-sep    { color: rgba(var(--v-theme-on-surface), 0.25) !important; }
.bc-item   { color: rgba(var(--v-theme-on-surface), 0.7); }

.page-header {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; margin-bottom: 20px;
}
.header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.header-left    { display: flex; align-items: center; gap: 14px; }
.header-icon {
  width: 48px; height: 48px; border-radius: 14px;
  background: linear-gradient(135deg, var(--indigo), var(--indigo));
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.page-title {
  font-size: 18px; font-weight: 800;
  color: rgb(var(--v-theme-on-surface)); margin: 0; letter-spacing: 0.5px;
}
.page-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 2px 0 0; }

/* ── Filtros ──────────────────────────────────────────────────── */
.filters-panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 14px; padding: 18px 20px 14px; margin-bottom: 20px;
}
.filters-grid  { display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-end; }
.filter-group  { display: flex; flex-direction: column; gap: 6px; }
.filter-label  {
  display: flex; align-items: center; gap: 5px;
  font-size: 10.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.5);
}
.dates-group .dates-row { display: flex; align-items: center; gap: 8px; }
.date-input {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.15);
  border-radius: 8px; padding: 7px 10px; font-size: 13px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  color: rgb(var(--v-theme-on-surface));
  outline: none; transition: border-color .2s;
}
.date-input:focus { border-color: var(--indigo); }
.filters-footer { margin-top: 14px; display: flex; justify-content: flex-end; }
.btn-consultar {
  display: flex; align-items: center; gap: 6px;
  background: linear-gradient(135deg, var(--indigo), var(--indigo));
  color: white; border: none; border-radius: 8px;
  padding: 9px 20px; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: opacity .2s;
}
.btn-consultar:hover    { opacity: .88; }
.btn-consultar:disabled { opacity: .5; cursor: not-allowed; }

/* ── Error ────────────────────────────────────────────────────── */
.error-banner {
  display: flex; align-items: center; gap: 8px;
  background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
  border-radius: 10px; padding: 12px 16px;
  font-size: 13px; color: var(--error); margin-bottom: 16px;
}

/* ── KPIs ─────────────────────────────────────────────────────── */
.kpi-row  { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
.kpi-card {
  flex: 1; min-width: 140px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px; padding: 14px 16px;
  display: flex; align-items: center; gap: 12px;
}
.kpi-icon {
  width: 38px; height: 38px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.kpi-info   { display: flex; flex-direction: column; gap: 2px; }
.kpi-val    {
  font-size: 16px; font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: rgb(var(--v-theme-on-surface));
}
.kpi-label  {
  font-size: 10px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.45);
}

/* ── Tabla ────────────────────────────────────────────────────── */
.table-wrap {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 14px; overflow-x: auto;
}
.vp-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.vp-table thead th {
  padding: 11px 12px;
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.45);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  white-space: nowrap; text-align: left;
}
.vp-table thead th.col-num { text-align: right; }
.tr-data td {
  padding: 9px 12px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
}
.tr-data:last-child td { border-bottom: none; }
.tr-data:hover td { background: rgba(var(--v-theme-on-surface), 0.025); }
.col-num   { text-align: right !important; font-variant-numeric: tabular-nums; }
.td-nombre { font-weight: 500; white-space: normal; max-width: 260px; }
.td-bold   { font-weight: 700; color: var(--indigo); }
.td-dim    { color: rgba(var(--v-theme-on-surface), 0.5); }

.badge-cod {
  display: inline-block;
  background: rgba(var(--v-theme-on-surface), 0.07);
  border-radius: 4px; padding: 1px 6px;
  font-size: 10px; font-weight: 700; font-family: monospace;
  margin-right: 2px;
}
.badge-ccosto {
  display: inline-block;
  background: rgba(6,182,212,0.1); color: var(--indigo);
  border-radius: 4px; padding: 1px 6px;
  font-size: 10px; font-weight: 700; font-family: monospace;
  margin-right: 4px;
}

/* Barra de porcentaje */
.pct-wrap {
  display: flex; align-items: center; gap: 6px;
  min-width: 80px; justify-content: flex-end;
}
.pct-bar {
  height: 5px; border-radius: 3px;
  background: linear-gradient(90deg, var(--indigo), var(--indigo));
  min-width: 2px; max-width: 50px;
  transition: width .3s;
}
.pct-val { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.6); }

/* Fila totales */
.tr-total td {
  padding: 10px 12px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  font-weight: 700; font-size: 12.5px;
  border-top: 2px solid rgba(var(--v-theme-on-surface), 0.12);
  white-space: nowrap;
}
.tr-total td.col-num { font-variant-numeric: tabular-nums; text-align: right; }

/* ── Empty ────────────────────────────────────────────────────── */
.empty-state {
  text-align: center; padding: 60px 20px;
  color: rgba(var(--v-theme-on-surface), 0.35); font-size: 14px;
}
.empty-state p { margin-top: 12px; }
</style>
