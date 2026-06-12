<template>
  <MainLayout>
    <div class="vv-container">

      <!-- BREADCRUMB -->
      <div class="vv-breadcrumb">
        <span class="bc-root">RECETAS</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Valoración por Ventas</span>
      </div>

      <!-- HEADER -->
      <div class="vv-header">
        <div class="vv-header-left">
          <div class="vv-icon-wrap"><v-icon size="22" color="white">mdi-chart-bar</v-icon></div>
          <div>
            <h1 class="vv-title">VALORACIÓN DE RECETAS POR VENTAS</h1>
            <p class="vv-sub">Costo real ponderado de materia prima según lo que se vendió en el período</p>
          </div>
        </div>
        <v-btn v-if="consultado" color="grey" variant="tonal" rounded="lg" @click="exportarPDF" :loading="generandoPdf">
          <v-icon start>mdi-file-pdf-box</v-icon>PDF
        </v-btn>
      </div>

      <!-- FILTROS -->
      <div class="vv-filtros-card">
        <div class="vv-filtros-row">
          <div class="filtro-group">
            <label class="filtro-label">Fecha inicio</label>
            <v-text-field v-model="fechaInicio" type="date" variant="outlined" density="compact"
              hide-details style="min-width:160px" />
          </div>
          <div class="filtro-group">
            <label class="filtro-label">Fecha fin</label>
            <v-text-field v-model="fechaFin" type="date" variant="outlined" density="compact"
              hide-details style="min-width:160px" />
          </div>
          <div class="filtro-group" style="min-width:220px">
            <label class="filtro-label">Centro de costos</label>
            <v-autocomplete
              v-model="ccostosSeleccionados"
              :items="ccostos"
              item-title="nombre"
              item-value="codigo"
              multiple chips closable-chips
              variant="outlined" density="compact" hide-details
              placeholder="Todos"
              :loading="loadingCcostos"
            >
              <template #prepend-item>
                <v-list-item title="Seleccionar todos" @click="toggleTodos" density="compact">
                  <template #prepend>
                    <v-checkbox-btn :model-value="todosSeleccionados" :indeterminate="algunoSeleccionado && !todosSeleccionados" />
                  </template>
                </v-list-item>
                <v-divider />
              </template>
            </v-autocomplete>
          </div>
          <div class="filtro-group">
            <label class="filtro-label">&nbsp;</label>
            <v-btn color="#f59e0b" variant="flat" rounded="lg" :loading="loading"
              :disabled="!fechaInicio || !fechaFin" @click="consultar" size="large">
              <v-icon start>mdi-magnify</v-icon>Consultar
            </v-btn>
          </div>
        </div>
      </div>

      <!-- KPIs (solo cuando hay datos) -->
      <div v-if="consultado && rows.length > 0" class="vv-kpi-row">
        <div class="vv-kpi" style="border-color:#3b82f6">
          <span class="kpi-val" style="color:#3b82f6">{{ kpi.num_recetas }}</span>
          <span class="kpi-lbl">Recetas{{ filtroGrupo !== 'TODOS' || busqueda ? ' (filtradas)' : ' vendidas' }}</span>
        </div>
        <div class="vv-kpi" style="border-color:#22c55e">
          <span class="kpi-val" style="color:#22c55e">{{ fmtM(kpi.total_ventas) }}</span>
          <span class="kpi-lbl">Total ventas</span>
        </div>
        <div class="vv-kpi" style="border-color:#ef4444">
          <span class="kpi-val" style="color:#ef4444">{{ fmtM(kpi.total_costo_mp) }}</span>
          <span class="kpi-lbl">Costo MP total</span>
        </div>
        <div class="vv-kpi" :style="{ borderColor: colorPct(kpi.pct_costo_real) }">
          <span class="kpi-val" :style="{ color: colorPct(kpi.pct_costo_real) }">
            {{ kpi.pct_costo_real.toFixed(1) }}%
          </span>
          <span class="kpi-lbl">% costo MP real ponderado</span>
        </div>
        <div class="vv-kpi" style="border-color:#8b5cf6">
          <span class="kpi-val" style="color:#8b5cf6">{{ kpi.pct_simple.toFixed(1) }}%</span>
          <span class="kpi-lbl">% costo MP promedio simple</span>
        </div>
      </div>

      <!-- ALERT diferencial -->
      <v-alert v-if="consultado && rows.length > 0 && Math.abs(kpi.pct_costo_real - kpi.pct_simple) > 1"
        :type="kpi.pct_costo_real > kpi.pct_simple ? 'warning' : 'success'"
        variant="tonal" density="compact" class="mb-4" icon="mdi-information-outline">
        <strong>
          El costo real ponderado ({{ kpi.pct_costo_real.toFixed(1) }}%) es
          {{ kpi.pct_costo_real > kpi.pct_simple ? 'MAYOR' : 'MENOR' }}
          al promedio simple ({{ kpi.pct_simple.toFixed(1) }}%) en
          {{ Math.abs(kpi.pct_costo_real - kpi.pct_simple).toFixed(1) }} pp —
          {{ kpi.pct_costo_real > kpi.pct_simple
            ? 'las recetas más vendidas tienen mayor costo de insumos que el promedio.'
            : 'las recetas más vendidas tienen menor costo de insumos que el promedio.' }}
        </strong>
      </v-alert>

      <!-- EMPTY STATE -->
      <div v-if="consultado && rows.length === 0" class="vv-empty">
        <v-icon size="56" color="grey-lighten-1" class="mb-3">mdi-chart-bar-stacked</v-icon>
        <p class="text-h6 text-medium-emphasis">Sin ventas en el período</p>
        <p class="text-caption text-disabled mt-1">
          No se encontraron ventas de recetas para los filtros seleccionados.
        </p>
      </div>

      <!-- TABLA PRINCIPAL -->
      <div v-if="consultado && rows.length > 0" class="vv-table-card">
        <!-- sub-filtro de grupo -->
        <div class="vv-table-toolbar">
          <v-text-field v-model="busqueda" placeholder="Buscar receta..." prepend-inner-icon="mdi-magnify"
            variant="outlined" density="compact" hide-details clearable style="max-width:280px" />
          <v-select v-model="filtroGrupo" :items="gruposFilter" item-title="label" item-value="val"
            variant="outlined" density="compact" hide-details style="max-width:200px" />
          <v-spacer />
          <div class="text-caption text-medium-emphasis">
            Mostrando {{ rowsFiltradas.length }} de {{ rows.length }} recetas
          </div>
        </div>

        <div class="vv-scroll">
          <table class="vv-table">
            <thead>
              <tr>
                <th class="col-nom">RECETA</th>
                <th class="col-grp">GRUPO</th>
                <th class="col-num text-right">CANT<br>VENDIDA</th>
                <th class="col-num text-right">PV PROM</th>
                <th class="col-num text-right" style="color:#22c55e">TOTAL<br>VENTAS</th>
                <th class="col-num text-right" style="color:#ef4444">COSTO MP<br>UNITARIO</th>
                <th class="col-num text-right" style="color:#ef4444">TOTAL<br>COSTO MP</th>
                <th class="col-pct">% COSTO MP</th>
                <th class="col-bar">VISUAL</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in rowsFiltradas" :key="r.codigo + r.nombre"
                :class="['vv-row', pctClass(r)]">
                <td class="col-nom">
                  <div class="rec-nombre">{{ r.nombre }}</div>
                  <div class="rec-cod text-caption text-disabled">{{ r.codigo }}</div>
                </td>
                <td class="col-grp">
                  <span class="text-caption" style="color:rgba(var(--v-theme-on-surface),.5)">
                    {{ r.grupo_nombre || '—' }}
                  </span>
                </td>
                <td class="col-num text-right font-mono">{{ fmtN(r.total_cant) }}</td>
                <td class="col-num text-right font-mono">{{ fmtD(r.vr_unit_prom) }}</td>
                <td class="col-num text-right font-mono" style="color:#22c55e;font-weight:700">
                  {{ fmtD(r.total_ventas) }}
                </td>
                <td class="col-num text-right font-mono" style="color:#ef4444">{{ fmtD(r.costo_mp_unit) }}</td>
                <td class="col-num text-right font-mono" style="color:#ef4444;font-weight:700">
                  {{ fmtD(r.total_costo_mp) }}
                </td>
                <td class="col-pct">
                  <div class="pct-cell">
                    <span class="pct-num" :style="{ color: colorPct(r.pct_costo_mp) }">
                      {{ parseFloat(r.pct_costo_mp).toFixed(1) }}%
                    </span>
                  </div>
                </td>
                <td class="col-bar">
                  <div class="bar-bg">
                    <div class="bar-fill"
                      :style="{ width: Math.min(parseFloat(r.pct_costo_mp), 100) + '%', background: colorPct(r.pct_costo_mp) }" />
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="vv-total">
                <td colspan="2" class="text-right font-weight-bold" style="padding:10px 16px">TOTAL</td>
                <td class="col-num text-right font-mono font-weight-bold">{{ fmtN(kpi.total_cant) }}</td>
                <td class="col-num text-right">—</td>
                <td class="col-num text-right font-mono font-weight-bold" style="color:#22c55e">
                  {{ fmtD(kpi.total_ventas) }}
                </td>
                <td class="col-num text-right">—</td>
                <td class="col-num text-right font-mono font-weight-bold" style="color:#ef4444">
                  {{ fmtD(kpi.total_costo_mp) }}
                </td>
                <td class="col-pct">
                  <span class="pct-num font-weight-bold" :style="{ color: colorPct(kpi.pct_costo_real) }">
                    {{ kpi.pct_costo_real.toFixed(1) }}%
                  </span>
                </td>
                <td class="col-bar"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom right">
      {{ snack.msg }}
    </v-snackbar>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fechaInputLocal } from '../../utils/formatters'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { API_BASE } from '../../utils/constants.js'
import { useAuthStore } from '../../stores/auth'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const authStore = useAuthStore()
function getEmpresa() {
  return authStore.empresaCodigo || authStore.empresa || localStorage.getItem('empresaActual') || ''
}

// ── Fechas por defecto: mes actual ────────────────────────────────────────────
function primerDia() {
  const h = new Date(); return new Date(h.getFullYear(), h.getMonth(), 1)
}
function ultimoDia() {
  const h = new Date(); return new Date(h.getFullYear(), h.getMonth() + 1, 0)
}

const fechaInicio          = ref(primerDia())
const fechaFin             = ref(ultimoDia())
const ccostosSeleccionados = ref([])
const ccostos              = ref([])
const loadingCcostos       = ref(false)
const loading              = ref(false)
const consultado           = ref(false)
const generandoPdf         = ref(false)
const busqueda             = ref('')
const filtroGrupo          = ref('TODOS')

const rows   = ref([])
const totals = ref({ total_ventas: 0, total_costo_mp: 0, total_cant: 0, pct_costo_real: 0, num_recetas: 0 })

const snack = ref({ show: false, msg: '', color: 'success' })
function ok(msg)   { snack.value = { show: true, msg, color: 'success' } }
function err(msg)  { snack.value = { show: true, msg, color: 'error'   } }

// ── Centros de costos ─────────────────────────────────────────────────────────
const todosSeleccionados = computed(() =>
  ccostos.value.length > 0 && ccostosSeleccionados.value.length === ccostos.value.length
)
const algunoSeleccionado = computed(() => ccostosSeleccionados.value.length > 0)

function toggleTodos() {
  if (todosSeleccionados.value) ccostosSeleccionados.value = []
  else ccostosSeleccionados.value = ccostos.value.map(c => c.codigo)
}

async function fetchCcostos() {
  const emp = getEmpresa(); if (!emp) return
  loadingCcostos.value = true
  try {
    const r = await fetch(`${API_BASE}/ccostos?empresa=${emp}`)
    const j = await r.json()
    ccostos.value = j.data || j || []
  } catch { /* no hay ccostos */ }
  finally { loadingCcostos.value = false }
}

// ── Consulta ──────────────────────────────────────────────────────────────────
async function consultar() {
  const emp = getEmpresa()
  if (!emp) { err('Sin empresa seleccionada'); return }
  loading.value = true
  try {
    const params = new URLSearchParams({ empresa: emp, fechaInicio: fechaInicio.value, fechaFin: fechaFin.value })
    if (ccostosSeleccionados.value.length) params.set('ccostos', ccostosSeleccionados.value.join(','))
    const r = await fetch(`${API_BASE}/recetas/valoracion-ventas?${params}`)
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    rows.value   = j.data   || []
    totals.value = j.totals || { total_ventas: 0, total_costo_mp: 0, total_cant: 0, pct_costo_real: 0, num_recetas: 0 }
    consultado.value = true
    busqueda.value   = ''
    filtroGrupo.value = 'TODOS'
  } catch (e) { err(e.message) }
  finally { loading.value = false }
}

// ── Filtros sobre la tabla ────────────────────────────────────────────────────
const gruposFilter = computed(() => {
  const set = new Set(rows.value.map(r => r.grupo_nombre || 'Sin grupo'))
  return [{ label: 'Todos los grupos', val: 'TODOS' }, ...[...set].sort().map(g => ({ label: g, val: g }))]
})

const rowsFiltradas = computed(() => {
  let r = rows.value
  if (filtroGrupo.value !== 'TODOS') r = r.filter(x => (x.grupo_nombre || 'Sin grupo') === filtroGrupo.value)
  if (busqueda.value.trim()) {
    const q = busqueda.value.trim().toLowerCase()
    r = r.filter(x => x.nombre.toLowerCase().includes(q) || x.codigo.toLowerCase().includes(q))
  }
  return r
})

// KPIs dinámicos — se recalculan cuando cambia filtroGrupo o busqueda
const kpi = computed(() => {
  const rf = rowsFiltradas.value
  const tv = rf.reduce((s, r) => s + parseFloat(r.total_ventas   || 0), 0)
  const tc = rf.reduce((s, r) => s + parseFloat(r.total_costo_mp || 0), 0)
  const tq = rf.reduce((s, r) => s + parseFloat(r.total_cant     || 0), 0)
  const pctReal   = tv > 0 ? (tc / tv) * 100 : 0
  const conPct    = rf.filter(r => parseFloat(r.pct_costo_mp) > 0)
  const pctSimple = conPct.length ? conPct.reduce((s, r) => s + parseFloat(r.pct_costo_mp), 0) / conPct.length : 0
  return { num_recetas: rf.length, total_ventas: tv, total_costo_mp: tc, total_cant: tq, pct_costo_real: pctReal, pct_simple: pctSimple }
})

// ── Helpers visuales ──────────────────────────────────────────────────────────
function colorPct(p) {
  const v = parseFloat(p) || 0
  if (!v) return '#94a3b8'
  if (v <= 30) return '#22c55e'
  if (v <= 45) return '#f59e0b'
  return '#ef4444'
}

function pctClass(r) {
  const v = parseFloat(r.pct_costo_mp) || 0
  if (v > 45) return 'row-danger'
  if (v > 30) return 'row-warn'
  if (v > 0)  return 'row-ok'
  return ''
}


function fmtD(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtM(v) {
  const n = parseFloat(v) || 0
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return '$' + (n / 1_000).toFixed(1)     + 'K'
  return '$' + n.toFixed(0)
}
function fmtN(v) {
  return (parseFloat(v) || 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

// ── PDF ───────────────────────────────────────────────────────────────────────
async function exportarPDF() {
  generandoPdf.value = true
  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    doc.setFontSize(14); doc.setFont('helvetica', 'bold')
    doc.text('VALORACIÓN DE RECETAS POR VENTAS', 14, 16)
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.text(`Período: ${fechaInicio.value} al ${fechaFin.value}`, 14, 22)
    doc.text(`Total ventas: ${fmtD(totals.value.total_ventas)}   Total costo MP: ${fmtD(totals.value.total_costo_mp)}   % costo real: ${totals.value.pct_costo_real.toFixed(1)}%`, 14, 27)

    autoTable(doc, {
      startY: 32,
      head: [['#', 'Receta', 'Grupo', 'Cant.', 'PV Prom', 'Total Ventas', 'Costo MP Unit.', 'Total Costo MP', '% Costo MP']],
      body: rowsFiltradas.value.map((r, i) => [
        i + 1, r.nombre, r.grupo_nombre || '—',
        fmtN(r.total_cant), fmtD(r.vr_unit_prom), fmtD(r.total_ventas),
        fmtD(r.costo_mp_unit), fmtD(r.total_costo_mp),
        parseFloat(r.pct_costo_mp).toFixed(1) + '%',
      ]),
      foot: [['', 'TOTAL', '', fmtN(totals.value.total_cant), '—', fmtD(totals.value.total_ventas), '—', fmtD(totals.value.total_costo_mp), totals.value.pct_costo_real.toFixed(1) + '%']],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold' },
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 8, halign: 'center' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' } },
    })

    doc.save(`valoracion-recetas-${fechaInicio.value}-${fechaFin.value}.pdf`)
    ok('PDF generado')
  } catch (e) { err('Error al generar PDF: ' + e.message) }
  finally { generandoPdf.value = false }
}

onMounted(fetchCcostos)
</script>

<style scoped>
.vv-container { padding: 24px; max-width: 1500px; margin: 0 auto; }

.vv-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root    { font-size: 12px; font-weight: 700; color: #f59e0b; text-transform: uppercase; }
.bc-sep     { color: rgba(var(--v-theme-on-surface), 0.3); }
.bc-cat     { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.8); font-weight: 500; }

.vv-header      { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.vv-header-left { display: flex; align-items: center; gap: 16px; }
.vv-icon-wrap   { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#f59e0b,#d97706); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(245,158,11,.35); flex-shrink: 0; }
.vv-title  { font-size: 18px; font-weight: 800; margin: 0; }
.vv-sub    { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }

/* filtros */
.vv-filtros-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 16px; padding: 16px 20px; margin-bottom: 16px; }
.vv-filtros-row  { display: flex; align-items: flex-end; gap: 14px; flex-wrap: wrap; }
.filtro-group    { display: flex; flex-direction: column; gap: 4px; }
.filtro-label    { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface),.55); text-transform: uppercase; letter-spacing: .05em; }

/* KPIs */
.vv-kpi-row { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.vv-kpi     { background: rgb(var(--v-theme-surface)); border: 2px solid; border-radius: 12px; padding: 12px 18px; display: flex; flex-direction: column; align-items: center; min-width: 120px; flex: 1; }
.kpi-val    { font-size: 22px; font-weight: 800; line-height: 1; }
.kpi-lbl    { font-size: 10px; color: rgba(var(--v-theme-on-surface),.5); text-align: center; margin-top: 2px; }

/* empty */
.vv-empty { text-align: center; padding: 60px 20px; }

/* tabla */
.vv-table-card    { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 16px; overflow: hidden; }
.vv-table-toolbar { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); flex-wrap: wrap; }
.vv-scroll        { overflow-x: auto; }

.vv-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.vv-table thead tr { background: rgba(var(--v-theme-on-surface),.04); }
.vv-table th {
  padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 700;
  letter-spacing: .04em; color: rgba(var(--v-theme-on-surface),.55);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); white-space: nowrap;
}
.vv-table td { padding: 7px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); vertical-align: middle; }
.vv-table tfoot td { border-top: 2px solid rgba(var(--v-theme-on-surface),.1); background: rgba(var(--v-theme-on-surface),.04); }

/* columnas */
.col-nom  { min-width: 160px; }
.col-grp  { width: 120px; }
.col-num  { width: 110px; white-space: nowrap; }
.col-pct  { width: 80px; }
.col-bar  { width: 120px; }

/* filas */
.vv-row { transition: background .15s; }
.vv-row:hover td { background: rgba(var(--v-theme-on-surface),.025); }
.row-danger td:first-child { border-left: 3px solid #ef4444; }
.row-warn   td:first-child { border-left: 3px solid #f59e0b; }
.row-ok     td:first-child { border-left: 3px solid #22c55e; }

.vv-total td { padding: 10px 12px; font-size: 13px; }

.rec-nombre { font-weight: 500; font-size: 13px; }
.rec-cod    { font-size: 11px; margin-top: 1px; }

/* % visual */
.pct-cell { display: flex; align-items: center; }
.pct-num  { font-size: 13px; font-weight: 700; min-width: 48px; text-align: right; }

/* barra */
.bar-bg   { width: 100%; height: 8px; background: rgba(var(--v-theme-on-surface),.08); border-radius: 4px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 4px; transition: width .4s; }

.font-mono { font-family: monospace; }
.text-right { text-align: right; }
</style>
