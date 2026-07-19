<template>
  <MainLayout>
    <div class="an-wrap">

      <!-- BREADCRUMB -->
      <div class="an-breadcrumb">
        <span class="bc-root">GERENCIA</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Análisis de Nómina</span>
      </div>

      <!-- HEADER -->
      <div class="an-header">
        <div class="an-header-left">
          <div class="an-icon-wrap">
            <v-icon size="24" color="white">mdi-account-cash-outline</v-icon>
          </div>
          <div>
            <h1 class="an-title">ANÁLISIS DE NÓMINA</h1>
            <p class="an-sub">Evolución del gasto de nómina · Distribución por local · Overtime · Top empleados</p>
          </div>
        </div>
        <div class="an-header-right">
          <!-- Toggle agrupación -->
          <div class="agrup-toggle">
            <button v-for="a in AGRUPACIONES" :key="a.value"
              :class="['agrup-btn', { active: agrupacion === a.value }]"
              @click="cambiarAgrupacion(a.value)">
              {{ a.label }}
            </button>
          </div>
          <v-btn color="#0ea5e9" variant="flat" prepend-icon="mdi-refresh" :loading="loading" rounded="lg" @click="cargar">
            Actualizar
          </v-btn>
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="loading" class="an-loading">
        <v-progress-circular indeterminate color="#0ea5e9" size="48" />
        <p>Analizando nóminas...</p>
      </div>

      <template v-else-if="data && data.serie.length">

        <!-- KPI CARDS -->
        <div class="an-kpis">
          <div class="an-kpi">
            <div class="an-kpi-accent" style="background:#0ea5e9"></div>
            <div class="an-kpi-icon" style="background:rgba(14,165,233,0.12)">
              <v-icon size="20" color="#0ea5e9">mdi-cash-multiple</v-icon>
            </div>
            <div class="an-kpi-body">
              <div class="an-kpi-lbl">Costo Total Empresa</div>
              <div class="an-kpi-val" style="color:#0ea5e9">{{ fmt(data.kpis.totalCosto) }}</div>
              <div class="an-kpi-sub">{{ data.kpis.periodos }} {{ nombrePeriodo }} · bruto + aportes patronales</div>
            </div>
          </div>
          <div class="an-kpi">
            <div class="an-kpi-accent" style="background:#f59e0b"></div>
            <div class="an-kpi-icon" style="background:rgba(245,158,11,0.12)">
              <v-icon size="20" color="#f59e0b">mdi-chart-timeline-variant</v-icon>
            </div>
            <div class="an-kpi-body">
              <div class="an-kpi-lbl">Promedio por {{ nombrePeriodoSing }}</div>
              <div class="an-kpi-val" style="color:#f59e0b">{{ fmt(data.kpis.promedio) }}</div>
              <div class="an-kpi-sub">costo empresa promedio</div>
            </div>
          </div>
          <div class="an-kpi">
            <div class="an-kpi-accent" :style="{ background: variacionColor }"></div>
            <div class="an-kpi-icon" :style="{ background: variacionBg }">
              <v-icon size="20" :color="variacionColor">{{ variacionIcono }}</v-icon>
            </div>
            <div class="an-kpi-body">
              <div class="an-kpi-lbl">Variación Último Período</div>
              <div class="an-kpi-val" :style="{ color: variacionColor }">
                {{ data.kpis.variacion === null ? '—' : (data.kpis.variacion >= 0 ? '+' : '') + data.kpis.variacion.toFixed(1) + '%' }}
              </div>
              <div class="an-kpi-sub">vs {{ nombrePeriodoSing }} anterior</div>
            </div>
          </div>
          <div class="an-kpi">
            <div class="an-kpi-accent" style="background:#ef4444"></div>
            <div class="an-kpi-icon" style="background:rgba(239,68,68,0.12)">
              <v-icon size="20" color="#ef4444">mdi-arrow-up-bold-circle-outline</v-icon>
            </div>
            <div class="an-kpi-body">
              <div class="an-kpi-lbl">Período Más Alto</div>
              <div class="an-kpi-val" style="color:#ef4444">{{ data.kpis.mayor ? fmt(data.kpis.mayor.valor) : '—' }}</div>
              <div class="an-kpi-sub">{{ data.kpis.mayor?.label || '—' }}</div>
            </div>
          </div>
        </div>

        <!-- FILA 1: Evolución del gasto -->
        <div class="an-card an-card-full">
          <div class="an-card-header">
            <v-icon size="18" color="#0ea5e9">mdi-chart-bar</v-icon>
            <span class="an-card-title">Evolución del Gasto de Nómina — por {{ nombrePeriodoSing }}</span>
            <select v-model="selMetrica" class="metrica-sel" @change="onMetricaChange">
              <option v-for="mt in METRICAS" :key="mt.value" :value="mt.value">{{ mt.label }}</option>
            </select>
            <span class="an-card-badge">Promedio: {{ fmt(promedioMetrica) }}</span>
          </div>
          <div ref="chartEvolRef" class="chart-area"></div>
        </div>

        <!-- FILA 2: Donut CC + Horas Reg/OT + Empleados -->
        <div class="an-row3">
          <div class="an-card">
            <div class="an-card-header">
              <v-icon size="18" color="#8b5cf6">mdi-store-outline</v-icon>
              <span class="an-card-title">Costo por Local / CC</span>
            </div>
            <div ref="chartDonutRef" class="chart-area chart-area--sm"></div>
          </div>
          <div class="an-card">
            <div class="an-card-header">
              <v-icon size="18" color="#f59e0b">mdi-clock-alert-outline</v-icon>
              <span class="an-card-title">Horas Regulares vs Overtime</span>
            </div>
            <div ref="chartHorasRef" class="chart-area chart-area--sm"></div>
          </div>
          <div class="an-card">
            <div class="an-card-header">
              <v-icon size="18" color="#22c55e">mdi-account-group-outline</v-icon>
              <span class="an-card-title">Empleados por Período</span>
            </div>
            <div ref="chartEmpRef" class="chart-area chart-area--sm"></div>
          </div>
        </div>

        <!-- FILA 3: Top empleados -->
        <div class="an-card an-card-full">
          <div class="an-card-header">
            <v-icon size="18" color="#22c55e">mdi-podium</v-icon>
            <span class="an-card-title">Top 10 Empleados por Costo Empresa — Período Analizado</span>
          </div>
          <div ref="chartTopRef" class="chart-area chart-area--top"></div>
        </div>

        <!-- FILA 4: Tabla detalle -->
        <div class="an-card an-card-full">
          <div class="an-card-header">
            <v-icon size="18" color="#0ea5e9">mdi-table</v-icon>
            <span class="an-card-title">Detalle por {{ nombrePeriodoSing }}</span>
          </div>
          <div class="an-table-wrap">
            <table class="an-table">
              <thead>
                <tr>
                  <th>PERÍODO</th>
                  <th class="tr">EMPLEADOS</th>
                  <th class="tr">HRS REG</th>
                  <th class="tr">HRS OT</th>
                  <th class="tr">BRUTO</th>
                  <th class="tr">DEDUCCIONES</th>
                  <th class="tr">APORTES ER</th>
                  <th class="tr">NETO</th>
                  <th class="tr">COSTO EMPRESA</th>
                  <th class="tr">VS ANTERIOR</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in serieDesc" :key="r.label + i" class="an-tr">
                  <td class="font-weight-medium">{{ r.label }}</td>
                  <td class="tr">{{ r.empleados }}</td>
                  <td class="tr">{{ fmtH(r.horas_regulares) }}</td>
                  <td class="tr" :class="{ 'ot-warn': parseFloat(r.horas_overtime) > 0 }">{{ fmtH(r.horas_overtime) }}</td>
                  <td class="tr">{{ fmt(r.total_bruto) }}</td>
                  <td class="tr text-dim">{{ fmt(r.total_deducciones) }}</td>
                  <td class="tr text-dim">{{ fmt(r.total_aportes_er) }}</td>
                  <td class="tr">{{ fmt(r.total_neto) }}</td>
                  <td class="tr font-weight-bold">{{ fmt(r.costo_empresa) }}</td>
                  <td class="tr">
                    <template v-if="serieDesc[i + 1]">
                      <span :class="parseFloat(r.costo_empresa) <= parseFloat(serieDesc[i+1].costo_empresa) ? 'badge-pos' : 'badge-neg'">
                        {{ parseFloat(r.costo_empresa) >= parseFloat(serieDesc[i+1].costo_empresa) ? '+' : '' }}{{ diffPct(r.costo_empresa, parseFloat(serieDesc[i+1].costo_empresa)) }}%
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

      <div v-else-if="!loading" class="an-empty">
        <v-icon size="56" color="#94a3b8">mdi-account-cash-outline</v-icon>
        <p>No hay nóminas aprobadas para esta empresa en el período seleccionado.</p>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
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
const selMetrica = ref('costo_empresa')

const AGRUPACIONES = [
  { value: 'semana', label: 'Semana' },
  { value: 'mes',    label: 'Mes' },
  { value: 'anio',   label: 'Año' },
]

const METRICAS = [
  { value: 'costo_empresa',     label: 'Costo Empresa (Bruto + ER)' },
  { value: 'total_bruto',       label: 'Total Bruto' },
  { value: 'total_neto',        label: 'Total Neto Pagado' },
  { value: 'total_deducciones', label: 'Deducciones Empleado' },
  { value: 'total_aportes_er',  label: 'Aportes Patronales (ER)' },
]

const nombrePeriodo = computed(() =>
  agrupacion.value === 'mes' ? 'meses' : agrupacion.value === 'anio' ? 'años' : 'semanas')
const nombrePeriodoSing = computed(() =>
  agrupacion.value === 'mes' ? 'Mes' : agrupacion.value === 'anio' ? 'Año' : 'Semana')

const serieDesc = computed(() => data.value ? [...data.value.serie].reverse() : [])

// Variación: subida de gasto = rojo, bajada = verde
const variacionColor = computed(() => {
  const v = data.value?.kpis?.variacion
  if (v === null || v === undefined) return '#94a3b8'
  return v > 0 ? '#ef4444' : '#22c55e'
})
const variacionBg = computed(() => {
  const v = data.value?.kpis?.variacion
  if (v === null || v === undefined) return 'rgba(148,163,184,0.12)'
  return v > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)'
})
const variacionIcono = computed(() => {
  const v = data.value?.kpis?.variacion
  if (v === null || v === undefined) return 'mdi-minus'
  return v > 0 ? 'mdi-trending-up' : 'mdi-trending-down'
})

// ── Refs contenedores de gráficas ───────────────────────────────────────────
const chartEvolRef  = ref(null)
const chartDonutRef = ref(null)
const chartHorasRef = ref(null)
const chartEmpRef   = ref(null)
const chartTopRef   = ref(null)

let chartEvol  = null
let chartDonut = null
let chartHoras = null
let chartEmp   = null
let chartTop   = null

// ── Formatters ──────────────────────────────────────────────────────────────
function fmt(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtH(v) {
  return (parseFloat(v) || 0).toLocaleString('en-US', { maximumFractionDigits: 1 })
}
function diffPct(val, base) {
  if (!base) return '0.0'
  return (((parseFloat(val) - base) / base) * 100).toFixed(1)
}

const promedioMetrica = computed(() => {
  if (!data.value?.serie?.length) return 0
  const vals = data.value.serie.map(r => parseFloat(r[selMetrica.value]) || 0)
  return vals.reduce((s, v) => s + v, 0) / vals.length
})

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
    const res = await fetch(`${API_BASE}/gerencia/analisis-nomina?${params}`)
    const j   = await res.json()
    if (!j.success) throw new Error(j.error)
    data.value = j
    loading.value = false
    await nextTick()
    renderCharts()
  } catch (e) {
    console.error('analisis-nomina:', e)
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

function onMetricaChange() {
  if (!data.value) return
  chartEvol?.destroy(); chartEvol = null
  nextTick(() => renderEvolucion())
}

function destroyAll() {
  chartEvol?.destroy();  chartEvol  = null
  chartDonut?.destroy(); chartDonut = null
  chartHoras?.destroy(); chartHoras = null
  chartEmp?.destroy();   chartEmp   = null
  chartTop?.destroy();   chartTop   = null
}

function renderCharts() {
  destroyAll()
  if (!data.value?.serie?.length) return
  renderEvolucion()
  renderDonut()
  renderHoras()
  renderEmpleados()
  renderTop()
}

// 1 — Evolución del gasto (métrica seleccionable + línea promedio)
function renderEvolucion() {
  if (!chartEvolRef.value || !data.value) return
  const { fg, grid } = themeColors()
  const serie  = data.value.serie
  const labels = serie.map(r => r.label)
  const campo  = selMetrica.value
  const vals   = serie.map(r => parseFloat(r[campo]) || 0)
  const prom   = promedioMetrica.value
  const label  = METRICAS.find(m => m.value === campo)?.label || campo

  chartEvol = new ApexCharts(chartEvolRef.value, {
    chart: { type: 'bar', height: 340, toolbar: { show: false }, fontFamily: 'Inter,sans-serif', background: 'transparent', animations: { enabled: true, speed: 600, animateGradually: { enabled: true, delay: 60 } } },
    theme: { mode: isDark() ? 'dark' : 'light' },
    series: [
      { name: label,      type: 'bar',  data: vals },
      { name: 'Promedio', type: 'line', data: Array(labels.length).fill(prom) },
    ],
    colors: ['#0ea5e9', '#f59e0b'],
    stroke: { width: [0, 3], curve: 'straight', dashArray: [0, 8] },
    dataLabels: { enabled: false },
    plotOptions: { bar: { columnWidth: '50%', borderRadius: 4, borderRadiusApplication: 'end' } },
    xaxis: {
      categories: labels,
      labels: { style: { colors: fg, fontSize: '10px' }, rotate: -45, rotateAlways: labels.length > 10, trim: true },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: fg }, formatter: v => fmt(v) } },
    grid:  { borderColor: grid, strokeDashArray: 4, padding: { left: 4, right: 4 } },
    legend: { position: 'top', horizontalAlign: 'left', labels: { colors: fg }, markers: { size: 7 } },
    tooltip: { shared: true, intersect: false, y: { formatter: v => fmt(v) } },
    markers: { size: [0, 5], colors: ['#f59e0b'], strokeColors: '#fff', strokeWidth: 2 },
  })
  chartEvol.render()
}

// 2 — Donut por CC
function renderDonut() {
  if (!chartDonutRef.value || !data.value) return
  const { fg } = themeColors()
  const dist = data.value.distribucionCcosto
  if (!dist.length) return

  chartDonut = new ApexCharts(chartDonutRef.value, {
    chart: { type: 'donut', height: 310, fontFamily: 'Inter,sans-serif', background: 'transparent', animations: { enabled: true, speed: 600 } },
    theme: { mode: isDark() ? 'dark' : 'light' },
    series: dist.map(r => Math.round(parseFloat(r.costo_total))),
    labels: dist.map(r => String(r.ccosto_nombre || r.ccosto)),
    colors: ['#0ea5e9','#f59e0b','#8b5cf6','#22c55e','#ef4444','#f97316','#06b6d4','#a855f7','#10b981','#ec4899'],
    legend: { position: 'bottom', labels: { colors: fg }, fontSize: '12px', offsetY: 4 },
    dataLabels: { enabled: true, formatter: v => v.toFixed(1) + '%' },
    stroke: { show: false },
    plotOptions: { pie: { donut: { size: '62%' } } },
    tooltip: { y: { formatter: v => fmt(v) } },
  })
  chartDonut.render()
}

// 3 — Horas regulares vs overtime (stacked)
function renderHoras() {
  if (!chartHorasRef.value || !data.value) return
  const { fg, grid } = themeColors()
  const serie  = data.value.serie
  const labels = serie.map(r => r.label)

  chartHoras = new ApexCharts(chartHorasRef.value, {
    chart: { type: 'bar', height: 310, stacked: true, toolbar: { show: false }, fontFamily: 'Inter,sans-serif', background: 'transparent', animations: { enabled: true, speed: 600 } },
    theme: { mode: isDark() ? 'dark' : 'light' },
    series: [
      { name: 'Horas Regulares', data: serie.map(r => Math.round(parseFloat(r.horas_regulares) || 0)) },
      { name: 'Horas Overtime',  data: serie.map(r => Math.round(parseFloat(r.horas_overtime) || 0)) },
    ],
    colors: ['#22c55e', '#ef4444'],
    plotOptions: { bar: { columnWidth: '55%', borderRadius: 3, borderRadiusApplication: 'end' } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: labels,
      labels: { style: { colors: fg, fontSize: '9px' }, rotate: -45, rotateAlways: labels.length > 8, trim: true },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: fg }, formatter: v => Math.round(v) + ' h' } },
    grid:  { borderColor: grid, strokeDashArray: 4 },
    legend: { position: 'top', horizontalAlign: 'left', labels: { colors: fg }, markers: { size: 7 } },
    tooltip: { y: { formatter: v => Math.round(v) + ' horas' } },
  })
  chartHoras.render()
}

// 4 — Empleados por período (línea con área)
function renderEmpleados() {
  if (!chartEmpRef.value || !data.value) return
  const { fg, grid } = themeColors()
  const serie  = data.value.serie
  const labels = serie.map(r => r.label)

  chartEmp = new ApexCharts(chartEmpRef.value, {
    chart: { type: 'area', height: 310, toolbar: { show: false }, fontFamily: 'Inter,sans-serif', background: 'transparent', animations: { enabled: true, speed: 700 } },
    theme: { mode: isDark() ? 'dark' : 'light' },
    series: [{ name: 'Empleados', data: serie.map(r => parseInt(r.empleados) || 0) }],
    colors: ['#8b5cf6'],
    stroke: { width: 3, curve: 'smooth' },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02 } },
    dataLabels: { enabled: false },
    markers: { size: 4, strokeColors: '#fff', strokeWidth: 2 },
    xaxis: {
      categories: labels,
      labels: { style: { colors: fg, fontSize: '9px' }, rotate: -45, rotateAlways: labels.length > 8, trim: true },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: fg }, formatter: v => Math.round(v) }, forceNiceScale: true },
    grid:  { borderColor: grid, strokeDashArray: 4 },
    tooltip: { y: { formatter: v => Math.round(v) + ' empleados' } },
  })
  chartEmp.render()
}

// 5 — Top empleados (barras horizontales)
function renderTop() {
  if (!chartTopRef.value || !data.value) return
  const { fg, grid } = themeColors()
  const top = data.value.topEmpleados
  if (!top.length) return

  chartTop = new ApexCharts(chartTopRef.value, {
    chart: { type: 'bar', height: 390, toolbar: { show: false }, fontFamily: 'Inter,sans-serif', background: 'transparent', animations: { enabled: true, speed: 600, animateGradually: { enabled: true, delay: 50 } } },
    theme: { mode: isDark() ? 'dark' : 'light' },
    series: [{ name: 'Costo Empresa', data: top.map(r => Math.round(parseFloat(r.costo_empresa))) }],
    colors: ['#22c55e'],
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '55%' } },
    dataLabels: { enabled: true, formatter: v => fmt(v), style: { fontSize: '11px' }, offsetX: 24 },
    xaxis: {
      categories: top.map(r => String(r.nombre || '').substring(0, 30)),
      labels: { style: { colors: fg, fontSize: '11px' }, formatter: v => fmt(v) },
    },
    yaxis: { labels: { style: { colors: fg, fontSize: '11px' } } },
    grid:  { borderColor: grid, strokeDashArray: 4 },
    tooltip: { y: { formatter: v => fmt(v) } },
  })
  chartTop.render()
}

onMounted(cargar)
onBeforeUnmount(destroyAll)
</script>

<style scoped>
.an-wrap { padding: 0 0 32px; }

/* BREADCRUMB */
.an-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: rgba(var(--v-theme-on-surface), 0.4); text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.25); }
.bc-cat { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-current { font-size: 11px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }

/* HEADER */
.an-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.an-header-left { display: flex; align-items: center; gap: 16px; }
.an-icon-wrap {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
  background: linear-gradient(135deg, #0ea5e9, #0369a1);
  display: flex; align-items: center; justify-content: center;
}
.an-title { font-size: 22px; font-weight: 800; margin: 0 0 2px; color: rgb(var(--v-theme-on-surface)); }
.an-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 0; }
.an-header-right { display: flex; align-items: center; gap: 12px; }

/* TOGGLE AGRUPACIÓN */
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
.agrup-btn.active { background: #0ea5e9; color: white; }

/* LOADING / EMPTY */
.an-loading, .an-empty {
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  padding: 80px 0; color: rgba(var(--v-theme-on-surface), 0.5); font-size: 14px;
}

/* KPIs */
.an-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 14px; margin-bottom: 20px; }
.an-kpi {
  position: relative; display: flex; align-items: center; gap: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px; padding: 16px 18px; overflow: hidden;
}
.an-kpi-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
.an-kpi-icon { width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.an-kpi-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.45); }
.an-kpi-val { font-size: 20px; font-weight: 800; line-height: 1.2; margin: 2px 0; }
.an-kpi-sub { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.4); }

/* CARDS */
.an-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px; padding: 18px 20px; margin-bottom: 18px;
}
.an-card-full { width: 100%; }
.an-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.an-card-title { font-size: 13.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: rgb(var(--v-theme-on-surface)); flex: 1; }
.an-card-badge {
  font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px;
  background: rgba(14,165,233,0.12); color: #0ea5e9; white-space: nowrap;
}
.metrica-sel {
  font-size: 12px; font-weight: 600; padding: 5px 10px; border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.15);
  background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface));
  cursor: pointer; outline: none;
}

.an-row3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 18px; margin-bottom: 18px; }
.an-row3 .an-card { margin-bottom: 0; }

.chart-area { min-height: 330px; }
.chart-area--sm { min-height: 300px; }
.chart-area--top { min-height: 380px; }

/* TABLA */
.an-table-wrap { overflow-x: auto; }
.an-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.an-table th {
  text-align: left; font-size: 10.5px; font-weight: 800; letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.45); text-transform: uppercase;
  padding: 10px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  white-space: nowrap;
}
.an-table td { padding: 10px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); white-space: nowrap; }
.an-table .tr { text-align: right; }
.an-tr:hover { background: rgba(var(--v-theme-on-surface), 0.03); }
.text-dim { color: rgba(var(--v-theme-on-surface), 0.45); }
.ot-warn { color: #ef4444; font-weight: 700; }
.badge-pos {
  background: rgba(34,197,94,0.12); color: #16a34a;
  font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 10px;
}
.badge-neg {
  background: rgba(239,68,68,0.12); color: #ef4444;
  font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 10px;
}
</style>
