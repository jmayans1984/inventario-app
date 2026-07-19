<template>
  <MainLayout>
    <div class="lc-wrap">

      <!-- BREADCRUMB -->
      <div class="lc-breadcrumb">
        <span class="bc-root">GERENCIA</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Labor Cost %</span>
      </div>

      <!-- HEADER -->
      <div class="lc-header">
        <div class="lc-header-left">
          <div class="lc-icon-wrap">
            <v-icon size="24" color="white">mdi-percent-outline</v-icon>
          </div>
          <div>
            <h1 class="lc-title">LABOR COST %</h1>
            <p class="lc-sub">Costo laboral (nómina + aportes) vs ventas netas · Global y por local</p>
          </div>
        </div>
        <div class="lc-header-right">
          <div class="umbral-box">
            <span class="umbral-lbl">Umbral</span>
            <input type="number" v-model.number="umbral" min="5" max="90" class="umbral-input" />
            <span class="umbral-pct">%</span>
          </div>
          <div class="agrup-toggle">
            <button v-for="a in AGRUPACIONES" :key="a.value"
              :class="['agrup-btn', { active: agrupacion === a.value }]"
              @click="cambiarAgrupacion(a.value)">
              {{ a.label }}
            </button>
          </div>
          <v-btn color="#f97316" variant="flat" prepend-icon="mdi-refresh" :loading="loading" rounded="lg" @click="cargar">
            Actualizar
          </v-btn>
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="loading" class="lc-loading">
        <v-progress-circular indeterminate color="#f97316" size="48" />
        <p>Cruzando nómina contra ventas...</p>
      </div>

      <template v-else-if="data && data.serie.length">

        <!-- KPI CARDS -->
        <div class="lc-kpis">
          <div class="lc-kpi">
            <div class="lc-kpi-accent" style="background:#22c55e"></div>
            <div class="lc-kpi-icon" style="background:rgba(34,197,94,0.12)">
              <v-icon size="20" color="#22c55e">mdi-cash-register</v-icon>
            </div>
            <div class="lc-kpi-body">
              <div class="lc-kpi-lbl">Ventas Netas</div>
              <div class="lc-kpi-val" style="color:#22c55e">{{ fmt(data.kpis.totVentas) }}</div>
              <div class="lc-kpi-sub">{{ data.kpis.periodos }} {{ nombrePeriodo }}</div>
            </div>
          </div>
          <div class="lc-kpi">
            <div class="lc-kpi-accent" style="background:#0ea5e9"></div>
            <div class="lc-kpi-icon" style="background:rgba(14,165,233,0.12)">
              <v-icon size="20" color="#0ea5e9">mdi-account-cash-outline</v-icon>
            </div>
            <div class="lc-kpi-body">
              <div class="lc-kpi-lbl">Costo Nómina</div>
              <div class="lc-kpi-val" style="color:#0ea5e9">{{ fmt(data.kpis.totNomina) }}</div>
              <div class="lc-kpi-sub">bruto + aportes patronales</div>
            </div>
          </div>
          <div class="lc-kpi">
            <div class="lc-kpi-accent" :style="{ background: pctColor(data.kpis.pctGlobal) }"></div>
            <div class="lc-kpi-icon" :style="{ background: pctBg(data.kpis.pctGlobal) }">
              <v-icon size="20" :color="pctColor(data.kpis.pctGlobal)">mdi-percent-outline</v-icon>
            </div>
            <div class="lc-kpi-body">
              <div class="lc-kpi-lbl">Labor Cost Global</div>
              <div class="lc-kpi-val" :style="{ color: pctColor(data.kpis.pctGlobal) }">{{ fmtPct(data.kpis.pctGlobal) }}</div>
              <div class="lc-kpi-sub">umbral: {{ umbral }}%</div>
            </div>
          </div>
          <div class="lc-kpi">
            <div class="lc-kpi-accent" style="background:#22c55e"></div>
            <div class="lc-kpi-icon" style="background:rgba(34,197,94,0.12)">
              <v-icon size="20" color="#22c55e">mdi-trophy-outline</v-icon>
            </div>
            <div class="lc-kpi-body">
              <div class="lc-kpi-lbl">Local Más Eficiente</div>
              <div class="lc-kpi-val" style="color:#22c55e">{{ data.kpis.mejorCC ? fmtPct(data.kpis.mejorCC.pct) : '—' }}</div>
              <div class="lc-kpi-sub">{{ data.kpis.mejorCC?.nombre || '—' }}</div>
            </div>
          </div>
          <div class="lc-kpi">
            <div class="lc-kpi-accent" style="background:#ef4444"></div>
            <div class="lc-kpi-icon" style="background:rgba(239,68,68,0.12)">
              <v-icon size="20" color="#ef4444">mdi-alert-outline</v-icon>
            </div>
            <div class="lc-kpi-body">
              <div class="lc-kpi-lbl">Local Menos Eficiente</div>
              <div class="lc-kpi-val" style="color:#ef4444">{{ data.kpis.peorCC ? fmtPct(data.kpis.peorCC.pct) : '—' }}</div>
              <div class="lc-kpi-sub">{{ data.kpis.peorCC?.nombre || '—' }}</div>
            </div>
          </div>
        </div>

        <!-- FILA 1: Ventas vs Nómina + línea % -->
        <div class="lc-card lc-card-full">
          <div class="lc-card-header">
            <v-icon size="18" color="#f97316">mdi-chart-bar-stacked</v-icon>
            <span class="lc-card-title">Ventas vs Costo de Nómina — Labor % por {{ nombrePeriodoSing }}</span>
          </div>
          <div ref="chartMainRef" class="chart-area"></div>
        </div>

        <!-- FILA 2: % por local en el tiempo + ranking -->
        <div class="lc-row2">
          <div class="lc-card">
            <div class="lc-card-header">
              <v-icon size="18" color="#8b5cf6">mdi-chart-line</v-icon>
              <span class="lc-card-title">Labor % por Local en el Tiempo</span>
            </div>
            <div ref="chartCcLineRef" class="chart-area chart-area--sm"></div>
          </div>
          <div class="lc-card">
            <div class="lc-card-header">
              <v-icon size="18" color="#f97316">mdi-podium</v-icon>
              <span class="lc-card-title">Ranking Labor % por Local</span>
              <span class="lc-card-badge">rojo = sobre umbral</span>
            </div>
            <div ref="chartRankRef" class="chart-area chart-area--sm"></div>
          </div>
        </div>

        <!-- FILA 3: Tabla por local -->
        <div class="lc-card lc-card-full">
          <div class="lc-card-header">
            <v-icon size="18" color="#8b5cf6">mdi-store-outline</v-icon>
            <span class="lc-card-title">Detalle por Local — Período Analizado</span>
          </div>
          <div class="lc-table-wrap">
            <table class="lc-table">
              <thead>
                <tr>
                  <th>LOCAL / CC</th>
                  <th class="tr">VENTAS NETAS</th>
                  <th class="tr">COSTO NÓMINA</th>
                  <th class="tr">LABOR %</th>
                  <th>ESTADO</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in data.centros" :key="c.ccosto" class="lc-tr">
                  <td class="font-weight-medium">{{ c.nombre }}</td>
                  <td class="tr">{{ fmt(c.ventas) }}</td>
                  <td class="tr">{{ fmt(c.nomina) }}</td>
                  <td class="tr font-weight-bold" :style="{ color: pctColor(c.labor_pct) }">{{ fmtPct(c.labor_pct) }}</td>
                  <td>
                    <span v-if="c.labor_pct === null" class="badge-dim">SIN VENTAS</span>
                    <span v-else-if="c.labor_pct > umbral" class="badge-neg">SOBRE UMBRAL</span>
                    <span v-else class="badge-pos">OK</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- FILA 4: Tabla por período -->
        <div class="lc-card lc-card-full">
          <div class="lc-card-header">
            <v-icon size="18" color="#f97316">mdi-table</v-icon>
            <span class="lc-card-title">Detalle por {{ nombrePeriodoSing }}</span>
          </div>
          <div class="lc-table-wrap">
            <table class="lc-table">
              <thead>
                <tr>
                  <th>PERÍODO</th>
                  <th class="tr">VENTAS NETAS</th>
                  <th class="tr">COSTO NÓMINA</th>
                  <th class="tr">LABOR %</th>
                  <th class="tr">VS ANTERIOR</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in serieDesc" :key="r.key" class="lc-tr">
                  <td class="font-weight-medium">{{ r.label }}</td>
                  <td class="tr">{{ fmt(r.ventas) }}</td>
                  <td class="tr">{{ fmt(r.costo_nomina) }}</td>
                  <td class="tr font-weight-bold" :style="{ color: pctColor(r.labor_pct) }">{{ fmtPct(r.labor_pct) }}</td>
                  <td class="tr">
                    <template v-if="serieDesc[i + 1] && r.labor_pct !== null && serieDesc[i+1].labor_pct !== null">
                      <span :class="r.labor_pct <= serieDesc[i+1].labor_pct ? 'badge-pos' : 'badge-neg'">
                        {{ (r.labor_pct - serieDesc[i+1].labor_pct) >= 0 ? '+' : '' }}{{ (r.labor_pct - serieDesc[i+1].labor_pct).toFixed(1) }} pts
                      </span>
                    </template>
                    <template v-else><span class="text-dim">—</span></template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </template>

      <div v-else-if="!loading" class="lc-empty">
        <v-icon size="56" color="#94a3b8">mdi-percent-outline</v-icon>
        <p>No hay nóminas aprobadas para cruzar contra ventas en el período seleccionado.</p>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { API_BASE } from '../../utils/constants.js'
import { useAuthStore } from '../../stores/auth'
import ApexCharts from 'apexcharts'

const authStore = useAuthStore()
const empresa = computed(() =>
  authStore.empresaCodigo || authStore.empresa || localStorage.getItem('empresaActual') || ''
)

// ── Estado ──────────────────────────────────────────────────────────────────
const loading    = ref(false)
const data       = ref(null)
const agrupacion = ref('semana')
const umbral     = ref(parseFloat(localStorage.getItem('laborCostUmbral')) || 30)

const AGRUPACIONES = [
  { value: 'semana', label: 'Semana' },
  { value: 'mes',    label: 'Mes' },
]

const nombrePeriodo     = computed(() => agrupacion.value === 'mes' ? 'meses' : 'semanas')
const nombrePeriodoSing = computed(() => agrupacion.value === 'mes' ? 'Mes' : 'Semana')
const serieDesc = computed(() => data.value ? [...data.value.serie].reverse() : [])

// Recolorear al cambiar umbral (persistir preferencia)
watch(umbral, () => {
  localStorage.setItem('laborCostUmbral', String(umbral.value))
  if (data.value) nextTick(() => renderCharts())
})

// ── Refs gráficas ───────────────────────────────────────────────────────────
const chartMainRef   = ref(null)
const chartCcLineRef = ref(null)
const chartRankRef   = ref(null)

let chartMain   = null
let chartCcLine = null
let chartRank   = null

// ── Formatters ──────────────────────────────────────────────────────────────
function fmt(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtPct(v) {
  if (v === null || v === undefined) return '—'
  return (parseFloat(v) || 0).toFixed(1) + '%'
}
function pctColor(v) {
  if (v === null || v === undefined) return '#94a3b8'
  return parseFloat(v) > umbral.value ? '#ef4444' : '#22c55e'
}
function pctBg(v) {
  if (v === null || v === undefined) return 'rgba(148,163,184,0.12)'
  return parseFloat(v) > umbral.value ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)'
}

// ── Carga ───────────────────────────────────────────────────────────────────
function cambiarAgrupacion(a) {
  if (agrupacion.value === a) return
  agrupacion.value = a
  cargar()
}

async function cargar() {
  if (!empresa.value) return
  loading.value = true
  try {
    const params = new URLSearchParams({ empresa: empresa.value, agrupacion: agrupacion.value })
    const res = await fetch(`${API_BASE}/gerencia/labor-cost?${params}`)
    const j   = await res.json()
    if (!j.success) throw new Error(j.error)
    data.value = j
    loading.value = false
    await nextTick()
    renderCharts()
  } catch (e) {
    console.error('labor-cost:', e)
    loading.value = false
  }
}

// ── Gráficas ─────────────────────────────────────────────────────────────────
function isDark() {
  return document.documentElement.classList.contains('v-theme--dark') ||
         document.body.classList.contains('v-theme--dark')
}
function themeColors() {
  return isDark()
    ? { fg: '#94a3b8', grid: 'rgba(255,255,255,0.06)' }
    : { fg: '#64748b', grid: 'rgba(0,0,0,0.06)' }
}

function destroyAll() {
  chartMain?.destroy();   chartMain   = null
  chartCcLine?.destroy(); chartCcLine = null
  chartRank?.destroy();   chartRank   = null
}

function renderCharts() {
  destroyAll()
  if (!data.value?.serie?.length) return
  renderMain()
  renderCcLines()
  renderRanking()
}

// 1 — Ventas vs Nómina (barras) + Labor % (línea, eje derecho) + umbral
function renderMain() {
  if (!chartMainRef.value || !data.value) return
  const { fg, grid } = themeColors()
  const serie  = data.value.serie
  const labels = serie.map(r => r.label)

  chartMain = new ApexCharts(chartMainRef.value, {
    chart: { height: 360, toolbar: { show: false }, fontFamily: 'Inter,sans-serif', background: 'transparent', animations: { enabled: true, speed: 600, animateGradually: { enabled: true, delay: 60 } } },
    theme: { mode: isDark() ? 'dark' : 'light' },
    series: [
      { name: 'Ventas Netas',  type: 'column', data: serie.map(r => Math.round(r.ventas)) },
      { name: 'Costo Nómina',  type: 'column', data: serie.map(r => Math.round(r.costo_nomina)) },
      { name: 'Labor %',       type: 'line',   data: serie.map(r => r.labor_pct === null ? null : parseFloat(r.labor_pct.toFixed(1))) },
    ],
    colors: ['#22c55e', '#0ea5e9', '#f97316'],
    stroke: { width: [0, 0, 3], curve: 'smooth' },
    dataLabels: { enabled: false },
    plotOptions: { bar: { columnWidth: '55%', borderRadius: 3, borderRadiusApplication: 'end' } },
    markers: { size: [0, 0, 5], strokeColors: '#fff', strokeWidth: 2 },
    xaxis: {
      categories: labels,
      labels: { style: { colors: fg, fontSize: '10px' }, rotate: -45, rotateAlways: labels.length > 10, trim: true },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: [
      { seriesName: 'Ventas Netas', labels: { style: { colors: fg }, formatter: v => fmt(v) } },
      { seriesName: 'Ventas Netas', show: false },
      { opposite: true, seriesName: 'Labor %', min: 0,
        labels: { style: { colors: '#f97316' }, formatter: v => (v ?? 0).toFixed(0) + '%' },
        title: { text: 'Labor %', style: { color: '#f97316' } } },
    ],
    annotations: {
      yaxis: [{
        y: umbral.value, yAxisIndex: 2,
        borderColor: '#ef4444', strokeDashArray: 6,
        label: { text: `Umbral ${umbral.value}%`, position: 'left', offsetX: 8,
                 style: { color: '#fff', background: '#ef4444', fontSize: '10px', fontWeight: 700 } },
      }],
    },
    grid:  { borderColor: grid, strokeDashArray: 4, padding: { left: 4, right: 4 } },
    legend: { position: 'top', horizontalAlign: 'left', labels: { colors: fg }, markers: { size: 7 } },
    tooltip: { shared: true, intersect: false,
      y: { formatter: (v, { seriesIndex }) => seriesIndex === 2 ? (v === null ? '—' : v.toFixed(1) + '%') : fmt(v) } },
  })
  chartMain.render()
}

// 2 — Labor % por CC en el tiempo (líneas)
function renderCcLines() {
  if (!chartCcLineRef.value || !data.value) return
  const { fg, grid } = themeColors()
  const serie   = data.value.serie
  const labels  = serie.map(r => r.label)
  const centros = data.value.centros.filter(c => c.labor_pct !== null).slice(0, 8)
  if (!centros.length) return

  chartCcLine = new ApexCharts(chartCcLineRef.value, {
    chart: { type: 'line', height: 320, toolbar: { show: false }, fontFamily: 'Inter,sans-serif', background: 'transparent', animations: { enabled: true, speed: 700 } },
    theme: { mode: isDark() ? 'dark' : 'light' },
    series: centros.map(c => ({
      name: String(c.nombre),
      data: c.seriePct.map(v => v === null ? null : parseFloat(v.toFixed(1))),
    })),
    colors: ['#f97316','#0ea5e9','#8b5cf6','#22c55e','#ef4444','#06b6d4','#a855f7','#ec4899'],
    stroke: { width: 2.5, curve: 'smooth' },
    markers: { size: 3, strokeColors: '#fff', strokeWidth: 1.5 },
    dataLabels: { enabled: false },
    xaxis: {
      categories: labels,
      labels: { style: { colors: fg, fontSize: '9px' }, rotate: -45, rotateAlways: labels.length > 8, trim: true },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { min: 0, labels: { style: { colors: fg }, formatter: v => (v ?? 0).toFixed(0) + '%' } },
    annotations: {
      yaxis: [{ y: umbral.value, borderColor: '#ef4444', strokeDashArray: 6 }],
    },
    grid:  { borderColor: grid, strokeDashArray: 4 },
    legend: { position: 'bottom', labels: { colors: fg }, fontSize: '11px' },
    tooltip: { shared: true, y: { formatter: v => v === null ? '—' : v.toFixed(1) + '%' } },
  })
  chartCcLine.render()
}

// 3 — Ranking por CC (barras horizontales, color según umbral)
function renderRanking() {
  if (!chartRankRef.value || !data.value) return
  const { fg, grid } = themeColors()
  const centros = data.value.centros.filter(c => c.labor_pct !== null)
  if (!centros.length) return
  const vals = centros.map(c => parseFloat(c.labor_pct.toFixed(1)))

  chartRank = new ApexCharts(chartRankRef.value, {
    chart: { type: 'bar', height: 320, toolbar: { show: false }, fontFamily: 'Inter,sans-serif', background: 'transparent', animations: { enabled: true, speed: 600, animateGradually: { enabled: true, delay: 60 } } },
    theme: { mode: isDark() ? 'dark' : 'light' },
    series: [{ name: 'Labor %', data: vals }],
    colors: vals.map(v => v > umbral.value ? '#ef4444' : '#22c55e'),
    plotOptions: { bar: { horizontal: true, borderRadius: 4, distributed: true, barHeight: '55%' } },
    dataLabels: { enabled: true, formatter: v => v.toFixed(1) + '%', style: { fontSize: '11px' }, offsetX: 22 },
    xaxis: {
      categories: centros.map(c => String(c.nombre).substring(0, 25)),
      labels: { style: { colors: fg, fontSize: '11px' }, formatter: v => (parseFloat(v) || 0).toFixed(0) + '%' },
    },
    yaxis: { labels: { style: { colors: fg, fontSize: '11px' } } },
    annotations: {
      xaxis: [{ x: umbral.value, borderColor: '#ef4444', strokeDashArray: 6,
        label: { text: `${umbral.value}%`, style: { color: '#fff', background: '#ef4444', fontSize: '10px', fontWeight: 700 } } }],
    },
    grid:  { borderColor: grid, strokeDashArray: 4 },
    legend: { show: false },
    tooltip: { y: { formatter: v => v.toFixed(1) + '%' } },
  })
  chartRank.render()
}

onMounted(cargar)
onBeforeUnmount(destroyAll)
</script>

<style scoped>
.lc-wrap { padding: 0 0 32px; }

/* BREADCRUMB */
.lc-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: rgba(var(--v-theme-on-surface), 0.4); text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.25); }
.bc-cat { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-current { font-size: 11px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }

/* HEADER */
.lc-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.lc-header-left { display: flex; align-items: center; gap: 16px; }
.lc-icon-wrap {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
  background: linear-gradient(135deg, #f97316, #c2410c);
  display: flex; align-items: center; justify-content: center;
}
.lc-title { font-size: 22px; font-weight: 800; margin: 0 0 2px; color: rgb(var(--v-theme-on-surface)); }
.lc-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 0; }
.lc-header-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

/* UMBRAL */
.umbral-box {
  display: flex; align-items: center; gap: 6px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
  border-radius: 10px; padding: 6px 12px;
}
.umbral-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: rgba(var(--v-theme-on-surface), 0.5); }
.umbral-input {
  width: 48px; text-align: right; font-size: 14px; font-weight: 800;
  color: #f97316; background: transparent; border: none; outline: none;
}
.umbral-pct { font-size: 13px; font-weight: 800; color: #f97316; }

/* TOGGLE */
.agrup-toggle {
  display: flex; border-radius: 10px; overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
}
.agrup-btn {
  padding: 8px 18px; font-size: 12.5px; font-weight: 700; letter-spacing: 0.3px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  background: transparent; border: none; cursor: pointer;
  transition: all 0.18s ease;
}
.agrup-btn + .agrup-btn { border-left: 1px solid rgba(var(--v-theme-on-surface), 0.08); }
.agrup-btn:hover { color: rgb(var(--v-theme-on-surface)); }
.agrup-btn.active { background: #f97316; color: white; }

/* LOADING / EMPTY */
.lc-loading, .lc-empty {
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  padding: 80px 0; color: rgba(var(--v-theme-on-surface), 0.5); font-size: 14px;
}

/* KPIs */
.lc-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; margin-bottom: 20px; }
.lc-kpi {
  position: relative; display: flex; align-items: center; gap: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px; padding: 16px 18px; overflow: hidden;
}
.lc-kpi-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
.lc-kpi-icon { width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.lc-kpi-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.45); }
.lc-kpi-val { font-size: 20px; font-weight: 800; line-height: 1.2; margin: 2px 0; }
.lc-kpi-sub { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.4); }

/* CARDS */
.lc-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px; padding: 18px 20px; margin-bottom: 18px;
}
.lc-card-full { width: 100%; }
.lc-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.lc-card-title { font-size: 13.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: rgb(var(--v-theme-on-surface)); flex: 1; }
.lc-card-badge {
  font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px;
  background: rgba(239,68,68,0.1); color: #ef4444; white-space: nowrap;
}

.lc-row2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 18px; margin-bottom: 18px; }
.lc-row2 .lc-card { margin-bottom: 0; }

.chart-area { min-height: 350px; }
.chart-area--sm { min-height: 310px; }

/* TABLA */
.lc-table-wrap { overflow-x: auto; }
.lc-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.lc-table th {
  text-align: left; font-size: 10.5px; font-weight: 800; letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.45); text-transform: uppercase;
  padding: 10px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  white-space: nowrap;
}
.lc-table td { padding: 10px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); white-space: nowrap; }
.lc-table .tr { text-align: right; }
.lc-tr:hover { background: rgba(var(--v-theme-on-surface), 0.03); }
.text-dim { color: rgba(var(--v-theme-on-surface), 0.45); }
.badge-pos {
  background: rgba(34,197,94,0.12); color: #16a34a;
  font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 10px;
}
.badge-neg {
  background: rgba(239,68,68,0.12); color: #ef4444;
  font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 10px;
}
.badge-dim {
  background: rgba(148,163,184,0.12); color: #94a3b8;
  font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 10px;
}
</style>
