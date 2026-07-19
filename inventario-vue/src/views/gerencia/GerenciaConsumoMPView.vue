<template>
  <MainLayout>
    <div class="fc-wrap">

      <!-- BREADCRUMB -->
      <div class="fc-breadcrumb">
        <span class="bc-root">GERENCIA</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Consumo Materia Prima</span>
      </div>

      <!-- HEADER -->
      <div class="fc-header">
        <div class="fc-header-left">
          <div class="fc-icon-wrap">
            <v-icon size="24" color="white">mdi-food-variant</v-icon>
          </div>
          <div>
            <h1 class="fc-title">CONSUMO MATERIA PRIMA — FOOD COST %</h1>
            <p class="fc-sub">Platos/recetas vendidos valorizados al costo de receta vs ventas netas · Global y por local</p>
          </div>
        </div>
        <div class="fc-header-right">
          <div class="ccosto-filter" ref="filterRef">
            <button class="ccosto-trigger" @click="menuCcosto = !menuCcosto">
              <v-icon size="16" color="#10b981">mdi-store-outline</v-icon>
              <span>{{ labelCcostos }}</span>
              <v-icon size="14">{{ menuCcosto ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </button>
            <div v-if="menuCcosto" class="ccosto-dropdown">
              <label class="cc-item cc-todos" @click.stop>
                <input type="checkbox"
                  :checked="selCcostos.length === 0 || selCcostos.length === ccostosDisponibles.length"
                  @change="toggleTodos" />
                <span class="cc-label">Toda la empresa</span>
              </label>
              <div class="cc-divider"></div>
              <label v-for="cc in ccostosDisponibles" :key="cc.codigo" class="cc-item" @click.stop>
                <input type="checkbox" :value="cc.codigo" v-model="selCcostos" @change="cargar" />
                <span class="cc-label">{{ cc.nombre }}</span>
              </label>
            </div>
          </div>
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
          <v-btn color="#10b981" variant="flat" prepend-icon="mdi-refresh" :loading="loading" rounded="lg" @click="cargar">
            Actualizar
          </v-btn>
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="loading" class="fc-loading">
        <v-progress-circular indeterminate color="#10b981" size="48" />
        <p>Valorizando consumo de materia prima...</p>
      </div>

      <template v-else-if="data && data.serie.length">

        <!-- KPI CARDS -->
        <div class="fc-kpis">
          <div class="fc-kpi">
            <div class="fc-kpi-accent" style="background:#22c55e"></div>
            <div class="fc-kpi-icon" style="background:rgba(34,197,94,0.12)">
              <v-icon size="20" color="#22c55e">mdi-cash-register</v-icon>
            </div>
            <div class="fc-kpi-body">
              <div class="fc-kpi-lbl">Ventas Netas</div>
              <div class="fc-kpi-val" style="color:#22c55e">{{ fmt(data.kpis.totVentas) }}</div>
              <div class="fc-kpi-sub">{{ data.kpis.periodos }} {{ nombrePeriodo }}</div>
            </div>
          </div>
          <div class="fc-kpi">
            <div class="fc-kpi-accent" style="background:#10b981"></div>
            <div class="fc-kpi-icon" style="background:rgba(16,185,129,0.12)">
              <v-icon size="20" color="#10b981">mdi-food-variant</v-icon>
            </div>
            <div class="fc-kpi-body">
              <div class="fc-kpi-lbl">Costo Materia Prima</div>
              <div class="fc-kpi-val" style="color:#10b981">{{ fmt(data.kpis.totConsumo) }}</div>
              <div class="fc-kpi-sub">platos vendidos × costo receta</div>
            </div>
          </div>
          <div class="fc-kpi">
            <div class="fc-kpi-accent" :style="{ background: coberturaColor }"></div>
            <div class="fc-kpi-icon" :style="{ background: coberturaBgc }">
              <v-icon size="20" :color="coberturaColor">mdi-clipboard-check-outline</v-icon>
            </div>
            <div class="fc-kpi-body">
              <div class="fc-kpi-lbl">Cobertura de Costeo</div>
              <div class="fc-kpi-val" :style="{ color: coberturaColor }">{{ fmtPct(data.kpis.cobertura) }}</div>
              <div class="fc-kpi-sub">{{ data.kpis.itemsSinCosto }} ítems sin receta costeada</div>
            </div>
          </div>
          <div class="fc-kpi">
            <div class="fc-kpi-accent" :style="{ background: pctColor(data.kpis.pctGlobal) }"></div>
            <div class="fc-kpi-icon" :style="{ background: pctBg(data.kpis.pctGlobal) }">
              <v-icon size="20" :color="pctColor(data.kpis.pctGlobal)">mdi-percent-outline</v-icon>
            </div>
            <div class="fc-kpi-body">
              <div class="fc-kpi-lbl">Food Cost Global</div>
              <div class="fc-kpi-val" :style="{ color: pctColor(data.kpis.pctGlobal) }">{{ fmtPct(data.kpis.pctGlobal) }}</div>
              <div class="fc-kpi-sub">umbral: {{ umbral }}%</div>
            </div>
          </div>
          <div class="fc-kpi">
            <div class="fc-kpi-accent" style="background:#22c55e"></div>
            <div class="fc-kpi-icon" style="background:rgba(34,197,94,0.12)">
              <v-icon size="20" color="#22c55e">mdi-trophy-outline</v-icon>
            </div>
            <div class="fc-kpi-body">
              <div class="fc-kpi-lbl">Local Más Eficiente</div>
              <div class="fc-kpi-val" style="color:#22c55e">{{ data.kpis.mejorCC ? fmtPct(data.kpis.mejorCC.pct) : '—' }}</div>
              <div class="fc-kpi-sub">{{ data.kpis.mejorCC?.nombre || '—' }}</div>
            </div>
          </div>
          <div class="fc-kpi">
            <div class="fc-kpi-accent" style="background:#ef4444"></div>
            <div class="fc-kpi-icon" style="background:rgba(239,68,68,0.12)">
              <v-icon size="20" color="#ef4444">mdi-alert-outline</v-icon>
            </div>
            <div class="fc-kpi-body">
              <div class="fc-kpi-lbl">Local Menos Eficiente</div>
              <div class="fc-kpi-val" style="color:#ef4444">{{ data.kpis.peorCC ? fmtPct(data.kpis.peorCC.pct) : '—' }}</div>
              <div class="fc-kpi-sub">{{ data.kpis.peorCC?.nombre || '—' }}</div>
            </div>
          </div>
        </div>

        <!-- FILA 1: Ventas vs Consumo + línea % -->
        <div class="fc-card fc-card-full">
          <div class="fc-card-header">
            <v-icon size="18" color="#10b981">mdi-chart-bar-stacked</v-icon>
            <span class="fc-card-title">Ventas vs Consumo de Materia Prima — Food % por {{ nombrePeriodoSing }}</span>
          </div>
          <div ref="chartMainRef" class="chart-area"></div>
        </div>

        <!-- FILA 2: % por local en el tiempo + ranking -->
        <div class="fc-row2">
          <div class="fc-card">
            <div class="fc-card-header">
              <v-icon size="18" color="#8b5cf6">mdi-chart-line</v-icon>
              <span class="fc-card-title">Food % por Local en el Tiempo</span>
            </div>
            <div ref="chartCcLineRef" class="chart-area chart-area--sm"></div>
          </div>
          <div class="fc-card">
            <div class="fc-card-header">
              <v-icon size="18" color="#10b981">mdi-podium</v-icon>
              <span class="fc-card-title">Ranking Food % por Local</span>
              <span class="fc-card-badge">rojo = sobre umbral</span>
            </div>
            <div ref="chartRankRef" class="chart-area chart-area--sm"></div>
          </div>
        </div>

        <!-- FILA 3: Donut por grupo + Top productos -->
        <div class="fc-row2">
          <div class="fc-card">
            <div class="fc-card-header">
              <v-icon size="18" color="#f59e0b">mdi-tag-multiple-outline</v-icon>
              <span class="fc-card-title">Costo MP por Grupo de Recetas</span>
            </div>
            <div ref="chartGrupoRef" class="chart-area chart-area--sm"></div>
          </div>
          <div class="fc-card">
            <div class="fc-card-header">
              <v-icon size="18" color="#0ea5e9">mdi-food-drumstick-outline</v-icon>
              <span class="fc-card-title">Top 15 Recetas por Costo de Materia Prima</span>
            </div>
            <div ref="chartTopRef" class="chart-area chart-area--top"></div>
          </div>
        </div>

        <!-- FILA 4: Tabla por local -->
        <div class="fc-card fc-card-full">
          <div class="fc-card-header">
            <v-icon size="18" color="#8b5cf6">mdi-store-outline</v-icon>
            <span class="fc-card-title">Detalle por Local — Período Analizado</span>
          </div>
          <div class="fc-table-wrap">
            <table class="fc-table">
              <thead>
                <tr>
                  <th>LOCAL / CC</th>
                  <th class="tr">VENTAS NETAS</th>
                  <th class="tr">CONSUMO MP</th>
                  <th class="tr">FOOD %</th>
                  <th>ESTADO</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in data.centros" :key="c.ccosto" class="fc-tr">
                  <td class="font-weight-medium">{{ c.nombre }}</td>
                  <td class="tr">{{ fmt(c.ventas) }}</td>
                  <td class="tr">{{ fmt(c.consumo) }}</td>
                  <td class="tr font-weight-bold" :style="{ color: pctColor(c.food_pct) }">{{ fmtPct(c.food_pct) }}</td>
                  <td>
                    <span v-if="c.food_pct === null" class="badge-dim">SIN VENTAS</span>
                    <span v-else-if="c.consumo === 0" class="badge-dim">SIN CONSUMO</span>
                    <span v-else-if="c.food_pct > umbral" class="badge-neg">SOBRE UMBRAL</span>
                    <span v-else class="badge-pos">OK</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- FILA 5: Tabla por período -->
        <div class="fc-card fc-card-full">
          <div class="fc-card-header">
            <v-icon size="18" color="#10b981">mdi-table</v-icon>
            <span class="fc-card-title">Detalle por {{ nombrePeriodoSing }}</span>
          </div>
          <div class="fc-table-wrap">
            <table class="fc-table">
              <thead>
                <tr>
                  <th>PERÍODO</th>
                  <th class="tr">VENTAS NETAS</th>
                  <th class="tr">CONSUMO MP</th>
                  <th class="tr">FOOD %</th>
                  <th class="tr">VS ANTERIOR</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in serieDesc" :key="r.key" class="fc-tr">
                  <td class="font-weight-medium">{{ r.label }}</td>
                  <td class="tr">{{ fmt(r.ventas) }}</td>
                  <td class="tr">{{ fmt(r.consumo) }}</td>
                  <td class="tr font-weight-bold" :style="{ color: pctColor(r.food_pct) }">{{ fmtPct(r.food_pct) }}</td>
                  <td class="tr">
                    <template v-if="serieDesc[i + 1] && r.food_pct !== null && serieDesc[i+1].food_pct !== null">
                      <span :class="r.food_pct <= serieDesc[i+1].food_pct ? 'badge-pos' : 'badge-neg'">
                        {{ (r.food_pct - serieDesc[i+1].food_pct) >= 0 ? '+' : '' }}{{ (r.food_pct - serieDesc[i+1].food_pct).toFixed(1) }} pts
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

      <div v-else-if="!loading" class="fc-empty">
        <v-icon size="56" color="#94a3b8">mdi-food-variant</v-icon>
        <p>No hay ventas importadas ni recetas costeadas en el período seleccionado.</p>
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
const umbral     = ref(parseFloat(localStorage.getItem('foodCostUmbral')) || 30)

const ccostosDisponibles = ref([])
const selCcostos         = ref([])
const menuCcosto         = ref(false)
const filterRef          = ref(null)

const AGRUPACIONES = [
  { value: 'semana', label: 'Semana' },
  { value: 'mes',    label: 'Mes' },
  { value: 'anio',   label: 'Año' },
]

const nombrePeriodo = computed(() =>
  agrupacion.value === 'mes' ? 'meses' : agrupacion.value === 'anio' ? 'años' : 'semanas')
const nombrePeriodoSing = computed(() =>
  agrupacion.value === 'mes' ? 'Mes' : agrupacion.value === 'anio' ? 'Año' : 'Semana')
const serieDesc = computed(() => data.value ? [...data.value.serie].reverse() : [])

const labelCcostos = computed(() => {
  if (selCcostos.value.length === 0 || selCcostos.value.length === ccostosDisponibles.value.length)
    return 'Toda la empresa'
  if (selCcostos.value.length === 1) {
    const found = ccostosDisponibles.value.find(c => c.codigo === selCcostos.value[0])
    return found ? found.nombre : String(selCcostos.value[0])
  }
  return `${selCcostos.value.length} locales seleccionados`
})

function toggleTodos() {
  selCcostos.value = []
  cargar()
}

function onDocClick(e) {
  if (filterRef.value && !filterRef.value.contains(e.target))
    menuCcosto.value = false
}

const coberturaColor = computed(() => {
  const c = data.value?.kpis?.cobertura
  if (c === null || c === undefined) return '#94a3b8'
  return c >= 90 ? '#22c55e' : c >= 70 ? '#f59e0b' : '#ef4444'
})
const coberturaBgc = computed(() => {
  const c = data.value?.kpis?.cobertura
  if (c === null || c === undefined) return 'rgba(148,163,184,0.12)'
  return c >= 90 ? 'rgba(34,197,94,0.12)' : c >= 70 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)'
})

watch(umbral, () => {
  localStorage.setItem('foodCostUmbral', String(umbral.value))
  if (data.value) nextTick(() => renderCharts())
})

// ── Refs gráficas ───────────────────────────────────────────────────────────
const chartMainRef   = ref(null)
const chartCcLineRef = ref(null)
const chartRankRef   = ref(null)
const chartGrupoRef  = ref(null)
const chartTopRef    = ref(null)

let chartMain   = null
let chartCcLine = null
let chartRank   = null
let chartGrupo  = null
let chartTop    = null

// ── Formatters ──────────────────────────────────────────────────────────────
function fmt(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtPct(v) {
  if (v === null || v === undefined) return '—'
  return (parseFloat(v) || 0).toFixed(1) + '%'
}
function fmtNum(v) {
  return (parseFloat(v) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })
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
  menuCcosto.value = false
  loading.value = true
  try {
    const params = new URLSearchParams({ empresa: empresa.value, agrupacion: agrupacion.value })
    if (selCcostos.value.length > 0 && selCcostos.value.length < ccostosDisponibles.value.length)
      params.set('ccostos', selCcostos.value.join(','))

    const res = await fetch(`${API_BASE}/gerencia/consumo-mp?${params}`)
    const j   = await res.json()
    if (!j.success) throw new Error(j.error)

    if (ccostosDisponibles.value.length === 0)
      ccostosDisponibles.value = j.ccostosDisponibles || []

    data.value = j
    loading.value = false
    await nextTick()
    renderCharts()
  } catch (e) {
    console.error('consumo-mp:', e)
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
  chartGrupo?.destroy();  chartGrupo  = null
  chartTop?.destroy();    chartTop    = null
}

function renderCharts() {
  destroyAll()
  if (!data.value?.serie?.length) return
  renderMain()
  renderCcLines()
  renderRanking()
  renderGrupos()
  renderTop()
}

// 1 — Ventas vs Consumo (barras) + Food % (línea, eje derecho) + umbral
function renderMain() {
  if (!chartMainRef.value || !data.value) return
  const { fg, grid } = themeColors()
  const serie  = data.value.serie
  const labels = serie.map(r => r.label)

  chartMain = new ApexCharts(chartMainRef.value, {
    chart: { height: 360, toolbar: { show: false }, fontFamily: 'Inter,sans-serif', background: 'transparent', animations: { enabled: true, speed: 600, animateGradually: { enabled: true, delay: 60 } } },
    theme: { mode: isDark() ? 'dark' : 'light' },
    series: [
      { name: 'Ventas Netas', type: 'column', data: serie.map(r => Math.round(r.ventas)) },
      { name: 'Consumo MP',   type: 'column', data: serie.map(r => Math.round(r.consumo)) },
      { name: 'Food %',       type: 'line',   data: serie.map(r => r.food_pct === null ? null : parseFloat(r.food_pct.toFixed(1))) },
    ],
    colors: ['#22c55e', '#10b981', '#f59e0b'],
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
      { opposite: true, seriesName: 'Food %', min: 0,
        labels: { style: { colors: '#f59e0b' }, formatter: v => (v ?? 0).toFixed(0) + '%' },
        title: { text: 'Food %', style: { color: '#f59e0b' } } },
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

// 2 — Food % por CC en el tiempo (líneas)
function renderCcLines() {
  if (!chartCcLineRef.value || !data.value) return
  const { fg, grid } = themeColors()
  const serie   = data.value.serie
  const labels  = serie.map(r => r.label)
  const centros = data.value.centros.filter(c => c.food_pct !== null && c.consumo > 0).slice(0, 8)
  if (!centros.length) return

  chartCcLine = new ApexCharts(chartCcLineRef.value, {
    chart: { type: 'line', height: 320, toolbar: { show: false }, fontFamily: 'Inter,sans-serif', background: 'transparent', animations: { enabled: true, speed: 700 } },
    theme: { mode: isDark() ? 'dark' : 'light' },
    series: centros.map(c => ({
      name: String(c.nombre),
      data: c.seriePct.map(v => v === null ? null : parseFloat(v.toFixed(1))),
    })),
    colors: ['#10b981','#0ea5e9','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#a855f7','#ec4899'],
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
  const centros = data.value.centros.filter(c => c.food_pct !== null && c.consumo > 0)
  if (!centros.length) return
  const vals = centros.map(c => parseFloat(c.food_pct.toFixed(1)))

  chartRank = new ApexCharts(chartRankRef.value, {
    chart: { type: 'bar', height: 320, toolbar: { show: false }, fontFamily: 'Inter,sans-serif', background: 'transparent', animations: { enabled: true, speed: 600, animateGradually: { enabled: true, delay: 60 } } },
    theme: { mode: isDark() ? 'dark' : 'light' },
    series: [{ name: 'Food %', data: vals }],
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

// 4 — Donut consumo por grupo de productos
function renderGrupos() {
  if (!chartGrupoRef.value || !data.value) return
  const { fg } = themeColors()
  const grupos = (data.value.porGrupo || []).filter(g => parseFloat(g.consumo) > 0).slice(0, 10)
  if (!grupos.length) return

  chartGrupo = new ApexCharts(chartGrupoRef.value, {
    chart: { type: 'donut', height: 310, fontFamily: 'Inter,sans-serif', background: 'transparent', animations: { enabled: true, speed: 600 } },
    theme: { mode: isDark() ? 'dark' : 'light' },
    series: grupos.map(g => Math.round(parseFloat(g.consumo))),
    labels: grupos.map(g => String(g.grupo)),
    colors: ['#10b981','#0ea5e9','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#a855f7','#ec4899','#f97316','#22c55e'],
    legend: { position: 'bottom', labels: { colors: fg }, fontSize: '12px', offsetY: 4 },
    dataLabels: { enabled: true, formatter: v => v.toFixed(1) + '%' },
    stroke: { show: false },
    plotOptions: { pie: { donut: { size: '62%' } } },
    tooltip: { y: { formatter: v => fmt(v) } },
  })
  chartGrupo.render()
}

// 5 — Top recetas por costo de MP (barras horizontales: costo vs vendido)
function renderTop() {
  if (!chartTopRef.value || !data.value) return
  const { fg, grid } = themeColors()
  const top = data.value.topRecetas || []
  if (!top.length) return

  chartTop = new ApexCharts(chartTopRef.value, {
    chart: { type: 'bar', height: 390, toolbar: { show: false }, fontFamily: 'Inter,sans-serif', background: 'transparent', animations: { enabled: true, speed: 600, animateGradually: { enabled: true, delay: 40 } } },
    theme: { mode: isDark() ? 'dark' : 'light' },
    series: [
      { name: 'Costo MP', data: top.map(r => Math.round(parseFloat(r.costo_mp))) },
      { name: 'Vendido',  data: top.map(r => Math.round(parseFloat(r.vendido))) },
    ],
    colors: ['#10b981', '#0ea5e9'],
    plotOptions: { bar: { horizontal: true, borderRadius: 3, barHeight: '65%' } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: top.map(r => String(r.nombre || r.codigo || '').substring(0, 28)),
      labels: { style: { colors: fg, fontSize: '11px' }, formatter: v => fmt(v) },
    },
    yaxis: { labels: { style: { colors: fg, fontSize: '11px' } } },
    grid:  { borderColor: grid, strokeDashArray: 4 },
    legend: { position: 'top', horizontalAlign: 'left', labels: { colors: fg }, markers: { size: 7 } },
    tooltip: {
      shared: true, intersect: false,
      y: { formatter: (v, { seriesIndex, dataPointIndex }) => {
        const r = top[dataPointIndex]
        if (seriesIndex === 0) {
          const vend = parseFloat(r?.vendido) || 0
          const pct  = vend > 0 ? ((parseFloat(r?.costo_mp) / vend) * 100).toFixed(1) + '% food' : ''
          return `${fmt(v)} · ${fmtNum(r?.cantidad)} und · ${pct}`
        }
        return fmt(v)
      } },
    },
  })
  chartTop.render()
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  cargar()
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  destroyAll()
})
</script>

<style scoped>
.fc-wrap { padding: 0 0 32px; }

/* BREADCRUMB */
.fc-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: rgba(var(--v-theme-on-surface), 0.4); text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.25); }
.bc-cat { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-current { font-size: 11px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }

/* HEADER */
.fc-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.fc-header-left { display: flex; align-items: center; gap: 16px; }
.fc-icon-wrap {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
  background: linear-gradient(135deg, #10b981, #047857);
  display: flex; align-items: center; justify-content: center;
}
.fc-title { font-size: 22px; font-weight: 800; margin: 0 0 2px; color: rgb(var(--v-theme-on-surface)); }
.fc-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 0; }
.fc-header-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

/* FILTRO CCOSTO */
.ccosto-filter { position: relative; }
.ccosto-trigger {
  display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 8px;
  border: 1px solid rgba(16,185,129,.35); background: rgba(16,185,129,.08); cursor: pointer;
  font-size: 12px; font-weight: 600; color: #10b981; white-space: nowrap;
  transition: background .15s;
}
.ccosto-trigger:hover { background: rgba(16,185,129,.16); }
.ccosto-dropdown {
  position: absolute; top: calc(100% + 6px); left: 0; z-index: 300;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface),.1);
  border-radius: 12px; padding: 8px; min-width: 210px;
  box-shadow: 0 8px 28px rgba(0,0,0,.16);
}
.cc-item   { display: flex; align-items: center; gap: 8px; padding: 7px 8px; border-radius: 7px; cursor: pointer; font-size: 13px; user-select: none; }
.cc-item:hover { background: rgba(var(--v-theme-on-surface),.05); }
.cc-todos  { font-weight: 700; }
.cc-label  { flex: 1; }
.cc-divider { height: 1px; background: rgba(var(--v-theme-on-surface),.07); margin: 4px 0; }

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
  color: #10b981; background: transparent; border: none; outline: none;
}
.umbral-pct { font-size: 13px; font-weight: 800; color: #10b981; }

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
.agrup-btn.active { background: #10b981; color: white; }

/* LOADING / EMPTY */
.fc-loading, .fc-empty {
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  padding: 80px 0; color: rgba(var(--v-theme-on-surface), 0.5); font-size: 14px;
}

/* KPIs */
.fc-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; margin-bottom: 20px; }
.fc-kpi {
  position: relative; display: flex; align-items: center; gap: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px; padding: 16px 18px; overflow: hidden;
}
.fc-kpi-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
.fc-kpi-icon { width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.fc-kpi-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.45); }
.fc-kpi-val { font-size: 20px; font-weight: 800; line-height: 1.2; margin: 2px 0; }
.fc-kpi-sub { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.4); }

/* CARDS */
.fc-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px; padding: 18px 20px; margin-bottom: 18px;
}
.fc-card-full { width: 100%; }
.fc-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.fc-card-title { font-size: 13.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: rgb(var(--v-theme-on-surface)); flex: 1; }
.fc-card-badge {
  font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px;
  background: rgba(239,68,68,0.1); color: #ef4444; white-space: nowrap;
}

.fc-row2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 18px; margin-bottom: 18px; }
.fc-row2 .fc-card { margin-bottom: 0; }

.chart-area { min-height: 350px; }
.chart-area--sm { min-height: 310px; }
.chart-area--top { min-height: 380px; }

/* TABLA */
.fc-table-wrap { overflow-x: auto; }
.fc-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.fc-table th {
  text-align: left; font-size: 10.5px; font-weight: 800; letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.45); text-transform: uppercase;
  padding: 10px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  white-space: nowrap;
}
.fc-table td { padding: 10px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); white-space: nowrap; }
.fc-table .tr { text-align: right; }
.fc-tr:hover { background: rgba(var(--v-theme-on-surface), 0.03); }
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
