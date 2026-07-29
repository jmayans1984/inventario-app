<template>
  <MainLayout>
    <div class="fc-wrap">

      <!-- BREADCRUMB -->
      <div class="fc-breadcrumb">
        <span class="bc-root">GERENCIA</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Análisis de Costos</span>
      </div>

      <!-- HEADER -->
      <div class="fc-header">
        <div class="fc-header-left">
          <div class="fc-icon-wrap">
            <v-icon size="24" color="white">mdi-trending-up</v-icon>
          </div>
          <div>
            <h1 class="fc-title">ANÁLISIS DE COSTOS DE COMPRA</h1>
            <p class="fc-sub">Evolución del precio de compra de productos · Variación vs periodo anterior · Comparación por proveedor</p>
          </div>
        </div>
        <div class="fc-header-right">
          <!-- Filtro Grupo -->
          <select v-model="grupoSel" class="ac-select" @change="cargar">
            <option value="">Todos los grupos</option>
            <option v-for="g in gruposDisponibles" :key="g.codigo" :value="g.codigo">{{ g.nombre }}</option>
          </select>
          <!-- Fechas -->
          <div class="ac-dates">
            <div class="ac-date-field">
              <span class="ac-date-lbl">Desde</span>
              <input type="date" v-model="desde" class="ac-date-input" />
            </div>
            <div class="ac-date-field">
              <span class="ac-date-lbl">Hasta</span>
              <input type="date" v-model="hasta" class="ac-date-input" />
            </div>
          </div>
          <v-btn color="#6366f1" variant="flat" prepend-icon="mdi-refresh" :loading="loading" rounded="lg" @click="cargar">
            Actualizar
          </v-btn>
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="loading" class="fc-loading">
        <v-progress-circular indeterminate color="#6366f1" size="48" />
        <p>Analizando costos de compra...</p>
      </div>

      <template v-else-if="data && data.productos.length">

        <!-- KPI CARDS -->
        <div class="fc-kpis">
          <div class="fc-kpi">
            <div class="fc-kpi-accent" style="background:#6366f1"></div>
            <div class="fc-kpi-icon" style="background:rgba(99,102,241,0.12)">
              <v-icon size="20" color="#6366f1">mdi-package-variant-closed</v-icon>
            </div>
            <div class="fc-kpi-body">
              <div class="fc-kpi-lbl">Total Comprado</div>
              <div class="fc-kpi-val" style="color:#6366f1">{{ fmt(data.kpis.totalComprado) }}</div>
              <div class="fc-kpi-sub">{{ data.kpis.totalEntradas }} entradas de almacén</div>
            </div>
          </div>
          <div class="fc-kpi">
            <div class="fc-kpi-accent" style="background:#8b5cf6"></div>
            <div class="fc-kpi-icon" style="background:rgba(139,92,246,0.12)">
              <v-icon size="20" color="#8b5cf6">mdi-cube-outline</v-icon>
            </div>
            <div class="fc-kpi-body">
              <div class="fc-kpi-lbl">Productos Analizados</div>
              <div class="fc-kpi-val" style="color:#8b5cf6">{{ data.kpis.productosAnalizados }}</div>
              <div class="fc-kpi-sub">con al menos 1 compra</div>
            </div>
          </div>
          <div class="fc-kpi">
            <div class="fc-kpi-accent" style="background:#ef4444"></div>
            <div class="fc-kpi-icon" style="background:rgba(239,68,68,0.12)">
              <v-icon size="20" color="#ef4444">mdi-trending-up</v-icon>
            </div>
            <div class="fc-kpi-body">
              <div class="fc-kpi-lbl">Con Aumento de Precio</div>
              <div class="fc-kpi-val" style="color:#ef4444">{{ data.kpis.productosConAumento }}</div>
              <div class="fc-kpi-sub">precio actual > precio inicial</div>
            </div>
          </div>
          <div class="fc-kpi">
            <div class="fc-kpi-accent" style="background:#22c55e"></div>
            <div class="fc-kpi-icon" style="background:rgba(34,197,94,0.12)">
              <v-icon size="20" color="#22c55e">mdi-trending-down</v-icon>
            </div>
            <div class="fc-kpi-body">
              <div class="fc-kpi-lbl">Con Disminución de Precio</div>
              <div class="fc-kpi-val" style="color:#22c55e">{{ data.kpis.productosConDisminucion }}</div>
              <div class="fc-kpi-sub">precio actual &lt; precio inicial</div>
            </div>
          </div>
          <div class="fc-kpi">
            <div class="fc-kpi-accent" style="background:#ef4444"></div>
            <div class="fc-kpi-icon" style="background:rgba(239,68,68,0.12)">
              <v-icon size="20" color="#ef4444">mdi-alert-circle-outline</v-icon>
            </div>
            <div class="fc-kpi-body">
              <div class="fc-kpi-lbl">Mayor Incremento</div>
              <div class="fc-kpi-val" style="color:#ef4444">
                {{ data.kpis.mayorIncremento ? '+' + fmtPct(data.kpis.mayorIncremento.variacion_pct) : '—' }}
              </div>
              <div class="fc-kpi-sub">{{ data.kpis.mayorIncremento?.producto_nombre || '—' }}</div>
            </div>
          </div>
          <div class="fc-kpi">
            <div class="fc-kpi-accent" style="background:#22c55e"></div>
            <div class="fc-kpi-icon" style="background:rgba(34,197,94,0.12)">
              <v-icon size="20" color="#22c55e">mdi-trophy-outline</v-icon>
            </div>
            <div class="fc-kpi-body">
              <div class="fc-kpi-lbl">Mayor Ahorro</div>
              <div class="fc-kpi-val" style="color:#22c55e">
                {{ data.kpis.mayorAhorro ? fmtPct(data.kpis.mayorAhorro.variacion_pct) : '—' }}
              </div>
              <div class="fc-kpi-sub">{{ data.kpis.mayorAhorro?.producto_nombre || '—' }}</div>
            </div>
          </div>
        </div>

        <!-- TABLA RANKING -->
        <div class="fc-card fc-card-full">
          <div class="fc-card-header">
            <v-icon size="18" color="#6366f1">mdi-format-list-numbered</v-icon>
            <span class="fc-card-title">Ranking de Productos por Variación de Precio</span>
            <input v-model="busqueda" placeholder="Buscar producto..." class="ac-search" />
          </div>
          <div class="fc-table-wrap">
            <table class="fc-table">
              <thead>
                <tr>
                  <th @click="sortBy('producto_nombre')" class="sortable">
                    PRODUCTO <v-icon size="12">{{ sortCol === 'producto_nombre' ? (sortDir === 'asc' ? 'mdi-sort-ascending' : 'mdi-sort-descending') : 'mdi-sort' }}</v-icon>
                  </th>
                  <th>GRUPO</th>
                  <th class="tr" @click="sortBy('num_compras')" style="cursor:pointer">
                    # COMPRAS <v-icon size="12">{{ sortCol === 'num_compras' ? (sortDir === 'asc' ? 'mdi-sort-ascending' : 'mdi-sort-descending') : 'mdi-sort' }}</v-icon>
                  </th>
                  <th class="tr">PRECIO INICIAL</th>
                  <th class="tr">PRECIO ACTUAL</th>
                  <th class="tr">PRECIO PROM.</th>
                  <th class="tr" @click="sortBy('variacion_pct')" style="cursor:pointer">
                    VARIACIÓN <v-icon size="12">{{ sortCol === 'variacion_pct' ? (sortDir === 'asc' ? 'mdi-sort-ascending' : 'mdi-sort-descending') : 'mdi-sort' }}</v-icon>
                  </th>
                  <th>PROVEEDOR ACTUAL</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in productosFiltrados" :key="p.producto_codigo"
                    class="fc-tr ac-tr-click"
                    :class="{ 'ac-row-selected': productoSel?.producto_codigo === p.producto_codigo }"
                    @click="seleccionarProducto(p)">
                  <td>
                    <div class="ac-prod-name">{{ p.producto_nombre }}</div>
                    <div class="ac-prod-cod">{{ p.producto_codigo }} · {{ p.und || '—' }}</div>
                  </td>
                  <td><span class="badge-dim">{{ p.grupo_nombre }}</span></td>
                  <td class="tr">{{ p.num_compras }}</td>
                  <td class="tr">{{ fmtNum(p.precio_primero) }}</td>
                  <td class="tr font-weight-bold">{{ fmtNum(p.precio_ultimo) }}</td>
                  <td class="tr">{{ fmtNum(p.precio_promedio) }}</td>
                  <td class="tr">
                    <span v-if="p.sinVariacion" class="badge-dim">Sin histórico</span>
                    <span v-else-if="p.variacion_pct > 0" class="badge-neg">+{{ fmtPct(p.variacion_pct) }}</span>
                    <span v-else-if="p.variacion_pct < 0" class="badge-pos">{{ fmtPct(p.variacion_pct) }}</span>
                    <span v-else class="badge-dim">0%</span>
                  </td>
                  <td>{{ p.proveedor_ultimo || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- DETALLE PRODUCTO -->
        <div v-if="productoSel" ref="detalleRef" class="fc-card fc-card-full ac-detalle">
          <div class="fc-card-header">
            <v-icon size="18" color="#6366f1">mdi-chart-line</v-icon>
            <span class="fc-card-title">Detalle: {{ productoSel.producto_nombre }}</span>
            <button class="ac-close-btn" @click="productoSel = null; detalle = null">
              <v-icon size="18">mdi-close</v-icon>
            </button>
          </div>

          <div v-if="loadingDetalle" class="fc-loading" style="padding:40px 0">
            <v-progress-circular indeterminate color="#6366f1" size="36" />
            <p>Cargando histórico...</p>
          </div>

          <template v-else-if="detalle">
            <!-- Badge alerta dato -->
            <div v-if="detalle.kpis.alertaDato" class="ac-alerta">
              <v-icon size="16" color="#f59e0b">mdi-alert-outline</v-icon>
              La variación supera ±300% — revisar si hay errores de digitación en los precios registrados
            </div>

            <!-- Mini KPIs del producto -->
            <div class="ac-mini-kpis">
              <div class="ac-mini-kpi">
                <span class="ac-mini-lbl">Precio Actual</span>
                <span class="ac-mini-val" style="color:#6366f1">{{ fmtNum(detalle.kpis.precioActual) }}</span>
              </div>
              <div class="ac-mini-kpi">
                <span class="ac-mini-lbl">Variación Total</span>
                <span class="ac-mini-val" :style="{ color: varColor(detalle.kpis.variacionTotalPct) }">
                  {{ detalle.kpis.variacionTotalPct !== null ? (detalle.kpis.variacionTotalPct >= 0 ? '+' : '') + fmtPct(detalle.kpis.variacionTotalPct) : '—' }}
                </span>
              </div>
              <div class="ac-mini-kpi">
                <span class="ac-mini-lbl">Últ. 2 Compras</span>
                <span class="ac-mini-val" :style="{ color: varColor(detalle.kpis.variacionUltimasDosPct) }">
                  {{ detalle.kpis.variacionUltimasDosPct !== null ? (detalle.kpis.variacionUltimasDosPct >= 0 ? '+' : '') + fmtPct(detalle.kpis.variacionUltimasDosPct) : '—' }}
                  <span v-if="Math.abs(detalle.kpis.variacionUltimasDosPct) > 15" class="ac-badge-warn">!</span>
                </span>
              </div>
              <div class="ac-mini-kpi">
                <span class="ac-mini-lbl">Precio Promedio</span>
                <span class="ac-mini-val">{{ fmtNum(detalle.kpis.precioPromedio) }}</span>
              </div>
              <div class="ac-mini-kpi">
                <span class="ac-mini-lbl">Mín / Máx</span>
                <span class="ac-mini-val">{{ fmtNum(detalle.kpis.precioMin) }} / {{ fmtNum(detalle.kpis.precioMax) }}</span>
              </div>
              <div class="ac-mini-kpi">
                <span class="ac-mini-lbl">Proveedor Más Barato</span>
                <span class="ac-mini-val" style="color:#22c55e">{{ detalle.kpis.proveedorMasBarato?.nombre || '—' }}</span>
              </div>
              <div class="ac-mini-kpi">
                <span class="ac-mini-lbl">Proveedor Más Caro</span>
                <span class="ac-mini-val" style="color:#ef4444">{{ detalle.kpis.proveedorMasCaro?.nombre || '—' }}</span>
              </div>
              <div class="ac-mini-kpi">
                <span class="ac-mini-lbl"># Compras</span>
                <span class="ac-mini-val">{{ detalle.kpis.numCompras }}</span>
              </div>
            </div>

            <!-- Gráfico líneas histórico -->
            <div class="fc-card-header" style="margin-top:16px">
              <v-icon size="16" color="#6366f1">mdi-chart-line</v-icon>
              <span class="fc-card-title" style="font-size:12px">Evolución del Precio de Compra</span>
            </div>
            <div ref="chartHistRef" class="chart-area"></div>

            <!-- Fila: tabla histórico + tabla proveedores -->
            <div class="fc-row2" style="margin-top:18px">
              <!-- Histórico de compras -->
              <div class="fc-card" style="margin-bottom:0">
                <div class="fc-card-header">
                  <v-icon size="16" color="#8b5cf6">mdi-history</v-icon>
                  <span class="fc-card-title" style="font-size:12px">Histórico de Compras</span>
                </div>
                <div class="fc-table-wrap">
                  <table class="fc-table">
                    <thead>
                      <tr>
                        <th>FECHA</th>
                        <th>PROVEEDOR</th>
                        <th class="tr">CANTIDAD</th>
                        <th class="tr">PRECIO UNIT.</th>
                        <th class="tr">VS ANTERIOR</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="h in [...detalle.historico].reverse()" :key="h.entrada_codigo + h.fecha" class="fc-tr">
                        <td>{{ fmtFecha(h.fecha) }}</td>
                        <td>{{ h.proveedor_nombre || '—' }}</td>
                        <td class="tr">{{ fmtNum(h.cantidad) }}</td>
                        <td class="tr font-weight-bold">{{ fmtNum(h.precio_unitario) }}</td>
                        <td class="tr">
                          <span v-if="h.variacion_vs_anterior_pct === null" class="text-dim">—</span>
                          <span v-else-if="h.variacion_vs_anterior_pct > 0" class="badge-neg">+{{ fmtPct(h.variacion_vs_anterior_pct) }}</span>
                          <span v-else-if="h.variacion_vs_anterior_pct < 0" class="badge-pos">{{ fmtPct(h.variacion_vs_anterior_pct) }}</span>
                          <span v-else class="badge-dim">0%</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Comparación por proveedor -->
              <div class="fc-card" style="margin-bottom:0">
                <div class="fc-card-header">
                  <v-icon size="16" color="#f59e0b">mdi-truck-outline</v-icon>
                  <span class="fc-card-title" style="font-size:12px">Comparación por Proveedor</span>
                </div>
                <div class="fc-table-wrap">
                  <table class="fc-table">
                    <thead>
                      <tr>
                        <th>PROVEEDOR</th>
                        <th class="tr"># COMPRAS</th>
                        <th class="tr">PRECIO PROM.</th>
                        <th class="tr">PRECIO MÍN.</th>
                        <th class="tr">PRECIO MÁX.</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="prov in detalle.porProveedor" :key="prov.proveedor_nombre" class="fc-tr">
                        <td class="font-weight-medium">{{ prov.proveedor_nombre || '—' }}</td>
                        <td class="tr">{{ prov.num_compras }}</td>
                        <td class="tr font-weight-bold">{{ fmtNum(prov.precio_promedio) }}</td>
                        <td class="tr" style="color:#22c55e">{{ fmtNum(prov.precio_min) }}</td>
                        <td class="tr" style="color:#ef4444">{{ fmtNum(prov.precio_max) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </template>
        </div>

      </template>

      <div v-else-if="!loading" class="fc-empty">
        <v-icon size="56" color="#94a3b8">mdi-trending-up</v-icon>
        <p>No hay entradas de almacén con precios registrados en el período seleccionado.</p>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { API_BASE } from '../../utils/constants.js'
import { useAuthStore } from '../../stores/auth'
import ApexCharts from 'apexcharts'

const authStore = useAuthStore()
const empresa = computed(() =>
  authStore.empresaCodigo || authStore.empresa || localStorage.getItem('empresaActual') || ''
)

// ── Estado principal ──────────────────────────────────────────────────────────
const loading  = ref(false)
const data     = ref(null)
const busqueda = ref('')
const grupoSel = ref('')
const gruposDisponibles = ref([])

const defaultHasta = () => new Date().toISOString().slice(0, 10)
const defaultDesde = () => {
  const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d.toISOString().slice(0, 10)
}
const desde = ref(defaultDesde())
const hasta  = ref(defaultHasta())

// Ordenamiento tabla ranking
const sortCol = ref('variacion_pct')
const sortDir = ref('desc')

function sortBy(col) {
  if (sortCol.value === col) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortCol.value = col
    sortDir.value = 'desc'
  }
}

const productosFiltrados = computed(() => {
  let lista = data.value?.productos || []
  if (busqueda.value.length >= 2) {
    const q = busqueda.value.toLowerCase()
    lista = lista.filter(p =>
      p.producto_nombre?.toLowerCase().includes(q) ||
      p.producto_codigo?.toLowerCase().includes(q)
    )
  }
  return [...lista].sort((a, b) => {
    const av = a[sortCol.value] ?? (sortDir.value === 'asc' ? Infinity : -Infinity)
    const bv = b[sortCol.value] ?? (sortDir.value === 'asc' ? Infinity : -Infinity)
    if (typeof av === 'string') return sortDir.value === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    return sortDir.value === 'asc' ? av - bv : bv - av
  })
})

// ── Estado detalle producto ───────────────────────────────────────────────────
const productoSel    = ref(null)
const detalle        = ref(null)
const loadingDetalle = ref(false)
const detalleRef     = ref(null)
const chartHistRef   = ref(null)
let chartHist        = null

async function seleccionarProducto(p) {
  productoSel.value = p
  detalle.value     = null
  loadingDetalle.value = true
  await nextTick()
  detalleRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  try {
    const params = new URLSearchParams({ empresa: empresa.value, desde: desde.value, hasta: hasta.value })
    const res  = await fetch(`${API_BASE}/gerencia/analisis-costos/producto/${encodeURIComponent(p.producto_codigo)}?${params}`)
    const j    = await res.json()
    if (!j.success) throw new Error(j.error)
    detalle.value = j
    loadingDetalle.value = false
    await nextTick()
    renderHistorico()
  } catch (e) {
    console.error('analisis-costos/producto:', e)
    loadingDetalle.value = false
  }
}

watch(detalle, () => {
  if (detalle.value) nextTick(() => renderHistorico())
})

// ── Carga principal ───────────────────────────────────────────────────────────
async function cargar() {
  if (!empresa.value) return
  productoSel.value = null
  detalle.value     = null
  loading.value     = true
  try {
    const params = new URLSearchParams({ empresa: empresa.value, desde: desde.value, hasta: hasta.value })
    if (grupoSel.value) params.set('grupo', grupoSel.value)
    const res = await fetch(`${API_BASE}/gerencia/analisis-costos?${params}`)
    const j   = await res.json()
    if (!j.success) throw new Error(j.error)
    data.value = j
    gruposDisponibles.value = j.gruposDisponibles || []
    loading.value = false
  } catch (e) {
    console.error('analisis-costos:', e)
    loading.value = false
  }
}

// ── Helpers gráfica ───────────────────────────────────────────────────────────
function isDark() {
  return document.documentElement.classList.contains('v-theme--dark') ||
         document.body.classList.contains('v-theme--dark')
}
function themeColors() {
  return isDark()
    ? { fg: '#94a3b8', grid: 'rgba(255,255,255,0.06)' }
    : { fg: '#64748b', grid: 'rgba(0,0,0,0.06)' }
}

function renderHistorico() {
  chartHist?.destroy(); chartHist = null
  if (!chartHistRef.value || !detalle.value?.historico?.length) return
  const { fg, grid } = themeColors()
  const hist = detalle.value.historico
  const proveedores = [...new Set(hist.map(h => h.proveedor_nombre || 'Sin proveedor'))]
  const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#0ea5e9','#8b5cf6','#ec4899','#06b6d4']

  const series = proveedores.map((prov, i) => ({
    name: prov,
    data: hist
      .filter(h => (h.proveedor_nombre || 'Sin proveedor') === prov)
      .map(h => ({ x: new Date(h.fecha).getTime(), y: parseFloat(h.precio_unitario) })),
    color: COLORS[i % COLORS.length],
  }))

  chartHist = new ApexCharts(chartHistRef.value, {
    chart: {
      type: 'line', height: 320, toolbar: { show: false },
      fontFamily: 'Inter,sans-serif', background: 'transparent',
      animations: { enabled: true, speed: 600 },
      zoom: { enabled: false },
    },
    theme: { mode: isDark() ? 'dark' : 'light' },
    series,
    stroke: { width: 2.5, curve: 'stepline' },
    markers: { size: 6, strokeColors: '#fff', strokeWidth: 2, hover: { size: 8 } },
    dataLabels: { enabled: false },
    xaxis: {
      type: 'datetime',
      labels: { style: { colors: fg, fontSize: '11px' }, datetimeFormatter: { year: 'yyyy', month: 'MMM yy', day: 'dd MMM' } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: fg }, formatter: v => fmtNum(v) },
      title: { text: 'Precio Unitario', style: { color: fg, fontSize: '11px' } },
    },
    grid: { borderColor: grid, strokeDashArray: 4 },
    legend: { position: 'top', horizontalAlign: 'left', labels: { colors: fg }, markers: { size: 7 } },
    tooltip: {
      shared: false, intersect: true,
      x: { format: 'dd MMM yyyy' },
      y: { formatter: (v, { seriesIndex, dataPointIndex, w }) => {
        const s   = w.config.series[seriesIndex]
        const row = detalle.value.historico.filter(h => (h.proveedor_nombre || 'Sin proveedor') === s.name)[dataPointIndex]
        return `${fmtNum(v)} · cant: ${fmtNum(row?.cantidad)}`
      } },
    },
  })
  chartHist.render()
}

// ── Formatters ────────────────────────────────────────────────────────────────
function fmt(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtNum(v) {
  if (v === null || v === undefined) return '—'
  return (parseFloat(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtPct(v) {
  if (v === null || v === undefined) return '—'
  return (parseFloat(v) || 0).toFixed(1) + '%'
}
function fmtFecha(v) {
  if (!v) return '—'
  return new Date(v).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}
function varColor(v) {
  if (v === null || v === undefined) return '#94a3b8'
  return parseFloat(v) > 0 ? '#ef4444' : parseFloat(v) < 0 ? '#22c55e' : '#94a3b8'
}

onMounted(() => cargar())
onBeforeUnmount(() => { chartHist?.destroy(); chartHist = null })
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
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  display: flex; align-items: center; justify-content: center;
}
.fc-title { font-size: 22px; font-weight: 800; margin: 0 0 2px; color: rgb(var(--v-theme-on-surface)); }
.fc-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 0; }
.fc-header-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

/* Filtros header */
.ac-select {
  padding: 8px 12px; border-radius: 8px; font-size: 12.5px; font-weight: 600;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface));
  cursor: pointer; outline: none;
}
.ac-dates { display: flex; gap: 8px; align-items: center; }
.ac-date-field { display: flex; align-items: center; gap: 6px; }
.ac-date-lbl { font-size: 11px; font-weight: 700; color: rgba(var(--v-theme-on-surface), 0.45); text-transform: uppercase; white-space: nowrap; }
.ac-date-input {
  padding: 7px 10px; border-radius: 8px; font-size: 12.5px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface));
  outline: none; cursor: pointer;
}

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
.fc-row2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 18px; margin-bottom: 18px; }
.fc-row2 .fc-card { margin-bottom: 0; }

/* Búsqueda en tabla */
.ac-search {
  padding: 6px 12px; border-radius: 8px; font-size: 13px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface));
  outline: none; width: 220px;
}

/* TABLA */
.fc-table-wrap { overflow-x: auto; }
.fc-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.fc-table th {
  text-align: left; font-size: 10.5px; font-weight: 800; letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.45); text-transform: uppercase;
  padding: 10px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  white-space: nowrap;
}
.fc-table th.sortable { cursor: pointer; }
.fc-table td { padding: 10px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); white-space: nowrap; }
.fc-table .tr { text-align: right; }
.fc-tr:hover { background: rgba(var(--v-theme-on-surface), 0.03); }
.ac-tr-click { cursor: pointer; }
.ac-row-selected { background: rgba(99, 102, 241, 0.07) !important; }
.font-weight-bold { font-weight: 700; }
.font-weight-medium { font-weight: 600; }
.text-dim { color: rgba(var(--v-theme-on-surface), 0.45); }

.ac-prod-name { font-weight: 600; font-size: 13px; }
.ac-prod-cod { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.45); }

/* Badges */
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

/* Detalle */
.ac-detalle { border: 2px solid rgba(99, 102, 241, 0.3); }
.ac-close-btn {
  margin-left: auto; background: transparent; border: none; cursor: pointer;
  color: rgba(var(--v-theme-on-surface), 0.5); border-radius: 8px; padding: 4px 6px;
  transition: background 0.15s;
}
.ac-close-btn:hover { background: rgba(var(--v-theme-on-surface), 0.08); }

.ac-alerta {
  display: flex; align-items: center; gap: 8px;
  background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3);
  border-radius: 10px; padding: 10px 14px; margin-bottom: 14px;
  font-size: 13px; color: #b45309; font-weight: 600;
}

/* Mini KPIs del detalle */
.ac-mini-kpis {
  display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;
}
.ac-mini-kpi {
  display: flex; flex-direction: column; gap: 2px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 10px; padding: 10px 16px; min-width: 130px;
}
.ac-mini-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.4); }
.ac-mini-val { font-size: 16px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); }
.ac-badge-warn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border-radius: 50%;
  background: #f59e0b; color: white; font-size: 11px; font-weight: 900;
  margin-left: 6px; vertical-align: middle;
}

.chart-area { min-height: 320px; }
</style>
