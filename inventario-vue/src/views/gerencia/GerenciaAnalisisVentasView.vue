<template>
  <MainLayout>
    <div class="av-wrap">

      <!-- BREADCRUMB -->
      <div class="av-breadcrumb">
        <span class="bc-root">GERENCIA</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Análisis de Ventas</span>
      </div>

      <!-- HEADER -->
      <div class="av-header">
        <div class="av-header-left">
          <div class="av-icon-wrap">
            <v-icon size="24" color="white">mdi-chart-areaspline</v-icon>
          </div>
          <div>
            <h1 class="av-title">ANÁLISIS DE VENTAS</h1>
            <p class="av-sub">Histórico mensual · Patrones semanales · Top productos · Distribución por local</p>
          </div>
        </div>
        <v-btn color="#06b6d4" variant="flat" prepend-icon="mdi-refresh" :loading="loading" rounded="lg" @click="cargar">
          Actualizar
        </v-btn>
      </div>

      <!-- FILTROS -->
      <div class="av-filter-bar">
        <div class="ccosto-filter" ref="filterRef">
          <button class="ccosto-trigger" @click="menuCcosto = !menuCcosto">
            <v-icon size="16" color="#06b6d4">mdi-store-outline</v-icon>
            <span>{{ labelCcostos }}</span>
            <v-icon size="14">{{ menuCcosto ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
          </button>
          <div v-if="menuCcosto" class="ccosto-dropdown">
            <label class="cc-item cc-todos" @click.stop>
              <input type="checkbox"
                :checked="selCcostos.length === 0 || selCcostos.length === ccostosDisponibles.length"
                @change="toggleTodos" />
              <span class="cc-label">Todos los locales</span>
            </label>
            <div class="cc-divider"></div>
            <label v-for="cc in ccostosDisponibles" :key="cc.codigo" class="cc-item" @click.stop>
              <input type="checkbox" :value="cc.codigo" v-model="selCcostos" @change="cargar" />
              <span class="cc-label">{{ cc.nombre }}</span>
            </label>
          </div>
        </div>
        <div class="av-filter-info">
          <v-icon size="14" color="#94a3b8">mdi-information-outline</v-icon>
          <span>Últimos 12 meses · Día semana: últimos 45 días</span>
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="loading" class="av-loading">
        <v-progress-circular indeterminate color="#06b6d4" size="48" />
        <p>Calculando análisis...</p>
      </div>

      <template v-else-if="data">

        <!-- KPI CARDS -->
        <div class="av-kpis">
          <div class="av-kpi">
            <div class="av-kpi-accent" style="background:#06b6d4"></div>
            <div class="av-kpi-icon" style="background:rgba(6,182,212,0.12)">
              <v-icon size="20" color="#06b6d4">mdi-cash-multiple</v-icon>
            </div>
            <div class="av-kpi-body">
              <div class="av-kpi-lbl">Total 12 Meses</div>
              <div class="av-kpi-val" style="color:#06b6d4">{{ fmt(data.kpis.total12m) }}</div>
              <div class="av-kpi-sub">{{ data.ventasPorMes.length }} meses con ventas</div>
            </div>
          </div>
          <div class="av-kpi">
            <div class="av-kpi-accent" style="background:#f59e0b"></div>
            <div class="av-kpi-icon" style="background:rgba(245,158,11,0.12)">
              <v-icon size="20" color="#f59e0b">mdi-trending-up</v-icon>
            </div>
            <div class="av-kpi-body">
              <div class="av-kpi-lbl">Promedio Mensual</div>
              <div class="av-kpi-val" style="color:#f59e0b">{{ fmt(data.kpis.promedioMensual) }}</div>
              <div class="av-kpi-sub">por mes</div>
            </div>
          </div>
          <div class="av-kpi">
            <div class="av-kpi-accent" style="background:#22c55e"></div>
            <div class="av-kpi-icon" style="background:rgba(34,197,94,0.12)">
              <v-icon size="20" color="#22c55e">mdi-star-outline</v-icon>
            </div>
            <div class="av-kpi-body">
              <div class="av-kpi-lbl">Mejor Mes</div>
              <div class="av-kpi-val" style="color:#22c55e">
                {{ data.kpis.mejorMes ? fmt(data.kpis.mejorMes.valor) : '—' }}
              </div>
              <div class="av-kpi-sub">{{ data.kpis.mejorMes?.label || '—' }}</div>
            </div>
          </div>
          <div class="av-kpi">
            <div class="av-kpi-accent" style="background:#8b5cf6"></div>
            <div class="av-kpi-icon" style="background:rgba(139,92,246,0.12)">
              <v-icon size="20" color="#8b5cf6">mdi-package-variant-closed</v-icon>
            </div>
            <div class="av-kpi-body">
              <div class="av-kpi-lbl">Ítems Vendidos (12M)</div>
              <div class="av-kpi-val" style="color:#8b5cf6">{{ fmtNum(data.kpis.totalItems) }}</div>
              <div class="av-kpi-sub">unidades en detalle</div>
            </div>
          </div>
        </div>

        <!-- FILA 1: Historial mensual -->
        <div class="av-card av-card-full">
          <div class="av-card-header">
            <v-icon size="18" color="#06b6d4">mdi-chart-bar</v-icon>
            <span class="av-card-title">Histórico — Últimos 12 Meses</span>
            <select v-model="selMetrica" class="metrica-sel" @change="onMetricaChange">
              <option v-for="mt in METRICAS" :key="mt.value" :value="mt.value">{{ mt.label }}</option>
            </select>
            <span class="av-card-badge">Promedio: {{ fmt(promedioMetrica) }}</span>
          </div>
          <div ref="chartMesesRef" class="chart-area"></div>
        </div>

        <!-- FILA 2: Día de semana + Donut local + Donut categorías -->
        <div class="av-row3">
          <div class="av-card">
            <div class="av-card-header">
              <v-icon size="18" color="#f59e0b">mdi-calendar-week</v-icon>
              <span class="av-card-title">Promedio por Día de Semana</span>
              <span class="av-card-badge" style="background:rgba(245,158,11,.12);color:#f59e0b">Últimos 45 días</span>
            </div>
            <div ref="chartDiaRef" class="chart-area chart-area--sm"></div>
          </div>
          <div class="av-card">
            <div class="av-card-header">
              <v-icon size="18" color="#8b5cf6">mdi-store-outline</v-icon>
              <span class="av-card-title">Distribución por Local</span>
              <span class="av-card-badge" style="background:rgba(139,92,246,.12);color:#8b5cf6">12 meses</span>
            </div>
            <div ref="chartDonutRef" class="chart-area chart-area--sm"></div>
          </div>
          <div class="av-card">
            <div class="av-card-header">
              <v-icon size="18" color="#22c55e">mdi-tag-multiple-outline</v-icon>
              <span class="av-card-title">Distribución por Categoría</span>
              <span class="av-card-badge" style="background:rgba(34,197,94,.12);color:#22c55e">12 meses</span>
            </div>
            <div ref="chartCatRef" class="chart-area chart-area--sm"></div>
          </div>
        </div>

        <!-- FILA 3: Top 10 productos -->
        <div class="av-card av-card-full">
          <div class="av-card-header">
            <v-icon size="18" color="#22c55e">mdi-podium</v-icon>
            <span class="av-card-title">Top 10 Productos por Ventas — Últimos 12 Meses</span>
          </div>
          <div ref="chartTopRef" class="chart-area chart-area--top"></div>
        </div>

        <!-- FILA 4: Tabla detalle mensual -->
        <div class="av-card av-card-full">
          <div class="av-card-header">
            <v-icon size="18" color="#06b6d4">mdi-table</v-icon>
            <span class="av-card-title">Detalle Mensual</span>
          </div>
          <div class="av-table-wrap">
            <table class="av-table">
              <thead>
                <tr>
                  <th>MES</th>
                  <th class="tr">VENTAS BRUTAS</th>
                  <th class="tr">DEVOLUCIONES</th>
                  <th class="tr">VENTAS NETAS</th>
                  <th class="tr">DÍAS</th>
                  <th class="tr">PROM DIARIO</th>
                  <th class="tr">VS MES ANT.</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(m, vIndex) in data.ventasPorMes" :key="m.mes" class="av-tr">
                  <td class="font-weight-medium">{{ m.mes_label }}</td>
                  <td class="tr">{{ fmt(m.ventas_brutas) }}</td>
                  <td class="tr text-dim">{{ fmt(m.devoluciones) }}</td>
                  <td class="tr">{{ fmt(m.ventas_netas) }}</td>
                  <td class="tr">{{ m.dias_con_venta }}</td>
                  <td class="tr">
                    {{ m.dias_con_venta > 0 ? fmt(parseFloat(m.ventas_brutas) / m.dias_con_venta) : '—' }}
                  </td>
                  <td class="tr">
                    <template v-if="m.mes === mesActualYM">
                      <span class="text-dim">—</span>
                    </template>
                    <template v-else-if="data.ventasPorMes[vIndex - 1]">
                      <span :class="parseFloat(m.ventas_netas) >= parseFloat(data.ventasPorMes[vIndex-1].ventas_netas) ? 'badge-pos' : 'badge-neg'">
                        {{ parseFloat(m.ventas_netas) >= parseFloat(data.ventasPorMes[vIndex-1].ventas_netas) ? '+' : '' }}{{ diffPct(m.ventas_netas, parseFloat(data.ventasPorMes[vIndex-1].ventas_netas)) }}%
                      </span>
                    </template>
                    <template v-else><span class="text-dim">—</span></template>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="av-tfoot">
                  <td>TOTAL</td>
                  <td class="tr">{{ fmt(totalesMensuales.ventas_brutas) }}</td>
                  <td class="tr text-dim">{{ fmt(totalesMensuales.devoluciones) }}</td>
                  <td class="tr">{{ fmt(totalesMensuales.ventas_netas) }}</td>
                  <td class="tr">—</td>
                  <td class="tr">—</td>
                  <td class="tr">—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </template>

      <div v-else-if="!loading" class="av-empty">
        <v-icon size="56" color="#94a3b8">mdi-chart-areaspline-variant</v-icon>
        <p>No hay datos de ventas para esta empresa.</p>
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
const loading            = ref(false)
const data               = ref(null)
const ccostosDisponibles = ref([])
const selCcostos         = ref([])
const menuCcosto         = ref(false)
const filterRef          = ref(null)
const selMetrica         = ref('ventas_netas')

const METRICAS = [
  { value: 'ventas_netas',  label: 'Ventas Netas' },
  { value: 'ventas_brutas', label: 'Ventas Brutas' },
  { value: 'devoluciones',  label: 'Devoluciones' },
  { value: 'descuentos',    label: 'Descuentos' },
  { value: 'impuestos',     label: 'Impuestos' },
  { value: 'propinas',      label: 'Propinas' },
  { value: 'comisiones',    label: 'Comisiones' },
  { value: 'tarjetas',      label: 'Tarjetas' },
  { value: 'efectivo',      label: 'Efectivo' },
  { value: 'otros',         label: 'Otros' },
]

// ── Refs contenedores de gráficas ───────────────────────────────────────────
const chartMesesRef = ref(null)
const chartDiaRef   = ref(null)
const chartDonutRef = ref(null)
const chartTopRef   = ref(null)
const chartCatRef   = ref(null)

let chartMeses = null
let chartDia   = null
let chartDonut = null
let chartTop   = null
let chartCat   = null

// ── Formatters ──────────────────────────────────────────────────────────────
function fmt(v) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(parseFloat(v) || 0)
}
function fmtNum(v) {
  return new Intl.NumberFormat('es-CO').format(Math.round(parseFloat(v) || 0))
}
function diffPct(val, base) {
  if (!base) return '0.0'
  return (((parseFloat(val) - base) / base) * 100).toFixed(1)
}

// ── Mes actual en formato YYYY-MM ──────────────────────────────────────────
const mesActualYM = computed(() => new Date().toISOString().slice(0, 7))

// ── Totales de la tabla de detalle mensual ───────────────────────────────────
const totalesMensuales = computed(() => {
  const meses = data.value?.ventasPorMes || []
  return {
    ventas_brutas: meses.reduce((s, m) => s + (parseFloat(m.ventas_brutas) || 0), 0),
    devoluciones:  meses.reduce((s, m) => s + (parseFloat(m.devoluciones) || 0), 0),
    ventas_netas:  meses.reduce((s, m) => s + (parseFloat(m.ventas_netas) || 0), 0),
  }
})

// ── Promedio dinámico según métrica seleccionada (excluye el mes en curso) ───
const promedioMetrica = computed(() => {
  if (!data.value?.ventasPorMes?.length) return 0
  const mesActual = new Date().toISOString().slice(0, 7) // 'YYYY-MM'
  const cerrados   = data.value.ventasPorMes.filter(m => m.mes !== mesActual)
  const lista      = cerrados.length ? cerrados : data.value.ventasPorMes
  const vals       = lista.map(m => parseFloat(m[selMetrica.value]) || 0)
  return vals.reduce((s, v) => s + v, 0) / vals.length
})

// ── CCostos ─────────────────────────────────────────────────────────────────
const labelCcostos = computed(() => {
  if (selCcostos.value.length === 0 || selCcostos.value.length === ccostosDisponibles.value.length)
    return 'Todos los locales'
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

// Cerrar dropdown al hacer click fuera
function onDocClick(e) {
  if (filterRef.value && !filterRef.value.contains(e.target))
    menuCcosto.value = false
}

// ── Carga ───────────────────────────────────────────────────────────────────
async function cargar() {
  if (!empresa.value) return
  menuCcosto.value = false
  loading.value = true
  try {
    const params = new URLSearchParams({ empresa: empresa.value })
    if (selCcostos.value.length > 0 && selCcostos.value.length < ccostosDisponibles.value.length)
      params.set('ccostos', selCcostos.value.join(','))

    const res = await fetch(`${API_BASE}/gerencia/analisis-ventas?${params}`)
    const j   = await res.json()
    if (!j.success) throw new Error(j.error)

    if (ccostosDisponibles.value.length === 0)
      ccostosDisponibles.value = j.ccostosDisponibles || []

    data.value = j
    loading.value = false   // primero mostrar el template con los divs
    await nextTick()        // esperar a que Vue monte los chart-area refs
    renderCharts()
  } catch (e) {
    console.error('analisis-ventas:', e)
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
  chartMeses?.destroy(); chartMeses = null
  nextTick(() => renderMeses())
}

function destroyAll() {
  chartMeses?.destroy(); chartMeses = null
  chartDia?.destroy();   chartDia   = null
  chartDonut?.destroy(); chartDonut = null
  chartTop?.destroy();   chartTop   = null
  chartCat?.destroy();   chartCat   = null
}

function renderCharts() {
  destroyAll()
  renderMeses()
  renderDia()
  renderDonut()
  renderTop()
  renderCategorias()
}

// 1 — Histórico mensual (métrica seleccionable + línea promedio)
function renderMeses() {
  if (!chartMesesRef.value || !data.value) return
  const { fg, grid } = themeColors()
  const meses  = data.value.ventasPorMes
  const labels = meses.map(m => m.mes_label)
  const campo  = selMetrica.value
  const vals   = meses.map(m => parseFloat(m[campo]) || 0)
  const prom   = promedioMetrica.value
  const label  = METRICAS.find(m => m.value === campo)?.label || campo

  chartMeses = new ApexCharts(chartMesesRef.value, {
    chart: { type: 'bar', height: 330, toolbar: { show: false }, fontFamily: 'Inter,sans-serif', background: 'transparent', animations: { enabled: true, speed: 500 } },
    theme: { mode: isDark() ? 'dark' : 'light' },
    series: [
      { name: label,     type: 'bar',  data: vals },
      { name: 'Promedio', type: 'line', data: Array(labels.length).fill(prom) },
    ],
    colors: ['#06b6d4', '#f59e0b'],
    stroke: { width: [0, 3], curve: 'straight', dashArray: [0, 8] },
    dataLabels: { enabled: false },
    plotOptions: { bar: { columnWidth: '50%', borderRadius: 4, borderRadiusApplication: 'end' } },
    xaxis: {
      categories: labels,
      labels: { style: { colors: fg, fontSize: '11px' } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: fg }, formatter: v => fmt(v) } },
    grid:  { borderColor: grid, strokeDashArray: 4, padding: { left: 4, right: 4 } },
    legend: { position: 'top', horizontalAlign: 'left', labels: { colors: fg }, markers: { size: 7 } },
    tooltip: { shared: true, intersect: false, y: { formatter: v => fmt(v) } },
    markers: { size: [0, 5], colors: ['#f59e0b'], strokeColors: '#fff', strokeWidth: 2 },
  })
  chartMeses.render()
}

// 2 — Promedio por día de semana (barras horizontales)
function renderDia() {
  if (!chartDiaRef.value || !data.value) return
  const { fg, grid } = themeColors()
  const ORDEN   = [1, 2, 3, 4, 5, 6, 0]
  const NOMBRES = { 0:'Dom', 1:'Lun', 2:'Mar', 3:'Mié', 4:'Jue', 5:'Vie', 6:'Sáb' }
  const map     = {}
  data.value.ventasPorDiaSemana.forEach(r => { map[parseInt(r.dow)] = r })

  const cats = ORDEN.map(d => NOMBRES[d])
  const vals = ORDEN.map(d => Math.round(parseFloat(map[d]?.avg_ventas || 0)))
  const maxV = Math.max(...vals)

  chartDia = new ApexCharts(chartDiaRef.value, {
    chart: { type: 'bar', height: 310, toolbar: { show: false }, fontFamily: 'Inter,sans-serif', background: 'transparent', animations: { enabled: true, speed: 500 } },
    theme: { mode: isDark() ? 'dark' : 'light' },
    series: [{ name: 'Promedio', data: vals }],
    colors: vals.map(v => v === maxV && maxV > 0 ? '#f59e0b' : '#06b6d4'),
    plotOptions: { bar: { horizontal: true, borderRadius: 4, distributed: true, barHeight: '58%' } },
    xaxis: { categories: cats, labels: { style: { colors: fg, fontSize: '11px' }, formatter: v => fmt(v) } },
    yaxis: { labels: { style: { colors: fg, fontSize: '13px', fontWeight: 700 } } },
    grid:  { borderColor: grid, strokeDashArray: 4 },
    legend: { show: false },
    tooltip: { y: { formatter: v => fmt(v) } },
    dataLabels: {
      enabled: true,
      formatter: v => v > 0 ? fmt(v) : '',
      style: { fontSize: '10px', colors: ['#fff'] },
      dropShadow: { enabled: false },
    },
  })
  chartDia.render()
}

// 3 — Donut distribución por ccosto
function renderDonut() {
  if (!chartDonutRef.value || !data.value) return
  const { fg } = themeColors()
  const dist   = data.value.distribucionCcosto
  if (!dist.length) return

  const labels = dist.map(r => String(r.ccosto_nombre || r.ccosto))
  const vals   = dist.map(r => Math.round(parseFloat(r.total_ventas)))

  chartDonut = new ApexCharts(chartDonutRef.value, {
    chart: { type: 'donut', height: 310, fontFamily: 'Inter,sans-serif', background: 'transparent', animations: { enabled: true, speed: 500 } },
    theme: { mode: isDark() ? 'dark' : 'light' },
    series: vals,
    labels,
    colors: ['#06b6d4','#f59e0b','#8b5cf6','#22c55e','#ef4444','#f97316','#0ea5e9','#a855f7','#10b981','#ec4899'],
    legend: { position: 'bottom', labels: { colors: fg }, fontSize: '12px', offsetY: 4 },
    tooltip: { y: { formatter: v => fmt(v) } },
    dataLabels: { enabled: true, style: { fontSize: '11px', fontFamily: 'Inter,sans-serif' }, dropShadow: { enabled: false } },
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
          labels: {
            show: true,
            total: {
              show: true, label: 'TOTAL', color: fg,
              formatter: w => fmt(w.globals.seriesTotals.reduce((a, b) => a + b, 0)),
            },
          },
        },
      },
    },
  })
  chartDonut.render()
}

// 4 — Top 10 productos (barras horizontales, mayor a menor de arriba abajo)
function renderTop() {
  if (!chartTopRef.value || !data.value) return
  const { fg, grid } = themeColors()
  const top    = data.value.topProductos   // ya viene DESC del servidor
  const labels = top.map(r => String(r.nombre || r.codigo || ''))
  const vals   = top.map(r => Math.round(parseFloat(r.total_ventas)))

  chartTop = new ApexCharts(chartTopRef.value, {
    chart: { type: 'bar', height: 390, toolbar: { show: false }, fontFamily: 'Inter,sans-serif', background: 'transparent', animations: { enabled: true, speed: 500 } },
    theme: { mode: isDark() ? 'dark' : 'light' },
    series: [{ name: 'Total Ventas', data: vals }],
    colors: ['#22c55e'],
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '55%' } },
    xaxis: { categories: labels, labels: { style: { colors: fg, fontSize: '11px' }, formatter: v => fmt(v) } },
    yaxis: { reversed: true, opposite: true, labels: { style: { colors: fg, fontSize: '11px', fontWeight: 500 }, maxWidth: 380 } },
    grid:  { borderColor: grid, strokeDashArray: 4, padding: { right: 20 } },
    legend: { show: false },
    tooltip: {
      custom({ dataPointIndex }) {
        const prod = data.value?.topProductos ? data.value.topProductos[dataPointIndex] : null
        if (!prod) return ''
        return `<div style="padding:8px 12px;font-size:12px;font-family:Inter,sans-serif">
          <strong>${prod.nombre || prod.codigo}</strong><br>
          Ventas: <strong>${fmt(prod.total_ventas)}</strong><br>
          Unidades: <strong>${fmtNum(prod.total_cant)}</strong><br>
          Precio prom: <strong>${fmt(prod.precio_prom)}</strong>
        </div>`
      }
    },
    dataLabels: {
      enabled: true,
      formatter: v => v > 0 ? fmt(v) : '',
      style: { fontSize: '10px', colors: ['rgba(255,255,255,0.9)'] },
      dropShadow: { enabled: false },
    },
  })
  chartTop.render()
}

// 5 — Donut distribución por categoría de receta
function renderCategorias() {
  if (!chartCatRef.value || !data.value) return
  const { fg } = themeColors()
  const cats = data.value.ventasPorCategoria || []
  if (!cats.length) return

  const labels = cats.map(r => String(r.categoria))
  // Sin redondear cada porción: el backend garantiza que la suma es igual al KPI, y
  // redondear una por una desviaría el TOTAL del centro por unos pesos. El formato
  // de visualización ya lo hace fmt().
  const vals   = cats.map(r => parseFloat(r.total_ventas) || 0)

  chartCat = new ApexCharts(chartCatRef.value, {
    chart: { type: 'donut', height: 310, fontFamily: 'Inter,sans-serif', background: 'transparent', animations: { enabled: true, speed: 500 } },
    theme: { mode: isDark() ? 'dark' : 'light' },
    series: vals,
    labels,
    colors: ['#06b6d4','#f59e0b','#8b5cf6','#22c55e','#ef4444','#f97316','#0ea5e9','#a855f7','#10b981','#ec4899'],
    legend: { position: 'bottom', labels: { colors: fg }, fontSize: '12px', offsetY: 4 },
    tooltip: { y: { formatter: v => fmt(v) } },
    dataLabels: { enabled: true, style: { fontSize: '11px', fontFamily: 'Inter,sans-serif' }, dropShadow: { enabled: false } },
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
          labels: {
            show: true,
            total: {
              show: true, label: 'TOTAL', color: fg,
              formatter: w => fmt(w.globals.seriesTotals.reduce((a, b) => a + b, 0)),
            },
          },
        },
      },
    },
  })
  chartCat.render()
}

// ── Ciclo de vida ────────────────────────────────────────────────────────────
onMounted(() => {
  document.addEventListener('mousedown', onDocClick)
  cargar()
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocClick)
  destroyAll()
})
</script>

<style scoped>
.av-wrap { padding: 24px; display: flex; flex-direction: column; gap: 16px; max-width: 1400px; margin: 0 auto; }

/* Breadcrumb */
.av-breadcrumb { display: flex; align-items: center; gap: 6px; }
.bc-root    { font-size: 11px; font-weight: 700; color: #06b6d4; text-transform: uppercase; }
.bc-sep     { color: rgba(var(--v-theme-on-surface), 0.3); }
.bc-cat     { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-current { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.8); font-weight: 500; }

/* Header */
.av-header      { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.av-header-left { display: flex; align-items: center; gap: 16px; }
.av-icon-wrap   { width: 52px; height: 52px; border-radius: 14px; background: linear-gradient(135deg,#06b6d4,#0e7490); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(6,182,212,.35); flex-shrink: 0; }
.av-title { font-size: 22px; font-weight: 800; margin: 0; }
.av-sub   { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }

/* Filter bar */
.av-filter-bar {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface),.08);
  border-radius: 12px; padding: 10px 16px;
}
.av-filter-info { display: flex; align-items: center; gap: 5px; font-size: 11px; color: rgba(var(--v-theme-on-surface),.45); margin-left: auto; }

/* CCostos dropdown */
.ccosto-filter { position: relative; }
.ccosto-trigger {
  display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px;
  border: 1px solid rgba(6,182,212,.35); background: rgba(6,182,212,.08); cursor: pointer;
  font-size: 12px; font-weight: 600; color: #06b6d4; white-space: nowrap;
  transition: background .15s;
}
.ccosto-trigger:hover { background: rgba(6,182,212,.16); }
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

/* KPIs */
.av-kpis { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
@media (max-width: 900px) { .av-kpis { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 500px)  { .av-kpis { grid-template-columns: 1fr; } }

.av-kpi {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 16px 16px 0;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface),.07);
  border-radius: 14px; overflow: hidden; position: relative;
  transition: transform .18s, box-shadow .18s;
}
.av-kpi:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.08); }
.av-kpi-accent { width: 4px; border-radius: 0 4px 4px 0; align-self: stretch; flex-shrink: 0; }
.av-kpi-icon   { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.av-kpi-body   { flex: 1; min-width: 0; }
.av-kpi-lbl    { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: rgba(var(--v-theme-on-surface),.45); margin-bottom: 3px; }
.av-kpi-val    { font-size: 18px; font-weight: 800; letter-spacing: -.4px; line-height: 1.1; margin-bottom: 3px; }
.av-kpi-sub    { font-size: 11px; color: rgba(var(--v-theme-on-surface),.4); }

/* Cards */
.av-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface),.07);
  border-radius: 16px; padding: 20px; overflow: hidden;
}
.av-card-full   { width: 100%; }
.av-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.av-card-title  { font-size: 13px; font-weight: 700; color: rgba(var(--v-theme-on-surface),.85); flex: 1; }
.av-card-badge  {
  font-size: 10px; font-weight: 700; letter-spacing: .4px;
  background: rgba(6,182,212,.1); color: #06b6d4;
  padding: 2px 9px; border-radius: 20px; white-space: nowrap;
}

/* Row 3 charts */
.av-row3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
@media (max-width: 1100px) { .av-row3 { grid-template-columns: 1fr 1fr; } }
@media (max-width: 700px)  { .av-row3 { grid-template-columns: 1fr; } }

/* Selector de métrica en el header del gráfico histórico */
.metrica-sel {
  border: 1px solid rgba(6,182,212,.35);
  background: rgba(6,182,212,.08);
  color: #06b6d4;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  margin-left: 4px;
}
.metrica-sel option { background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); }

/* Áreas de gráficas */
.chart-area      { width: 100%; min-height: 330px; }
.chart-area--sm  { min-height: 310px; }
.chart-area--top { min-height: 390px; }

/* Tabla */
.av-table-wrap { overflow-x: auto; }
.av-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.av-table thead tr { background: rgba(var(--v-theme-on-surface),.04); }
.av-table th {
  padding: 9px 14px; font-size: 10px; font-weight: 700;
  letter-spacing: .05em; color: rgba(var(--v-theme-on-surface),.5);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08);
  white-space: nowrap; text-align: left;
}
.av-table th.tr, .av-table td.tr { text-align: right; }
.av-table td { padding: 8px 14px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); white-space: nowrap; }
.av-tr { transition: background .12s; }
.av-tr:hover td { background: rgba(var(--v-theme-on-surface),.03); }
.av-tr:last-child td { border-bottom: none; }
.text-dim { color: rgba(var(--v-theme-on-surface),.45); }

.av-tfoot td {
  padding: 9px 14px; font-weight: 800;
  background: rgba(var(--v-theme-on-surface),.045);
  border-top: 2px solid rgba(var(--v-theme-on-surface),.12);
  border-bottom: none;
}

.badge-pos { background: rgba(34,197,94,.12); color: #22c55e; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; }
.badge-neg { background: rgba(239,68,68,.12); color: #ef4444; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; }

/* Loading / empty */
.av-loading, .av-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 14px; padding: 80px 20px; color: rgba(var(--v-theme-on-surface),.5); font-size: 14px;
}
</style>
