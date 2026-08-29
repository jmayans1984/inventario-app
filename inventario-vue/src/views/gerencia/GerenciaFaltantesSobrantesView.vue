<template>
  <MainLayout>
    <div class="fc-wrap">

      <!-- BREADCRUMB -->
      <div class="fc-breadcrumb">
        <span class="bc-root">GERENCIA</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Sobrantes / Faltantes</span>
      </div>

      <!-- HEADER -->
      <div class="fc-header">
        <div class="fc-header-left">
          <div class="fc-icon-wrap">
            <v-icon size="24" color="white">mdi-scale-balance</v-icon>
          </div>
          <div>
            <h1 class="fc-title">SOBRANTES Y FALTANTES</h1>
            <p class="fc-sub">Análisis de tomas físicas por período · Evolución mensual · Detalle por producto en valor o cantidad</p>
          </div>
        </div>
        <div class="fc-header-right">
          <!-- Filtro Centro de Costo -->
          <select v-model="ccostoSel" class="ac-select" @change="cargar">
            <option value="">Todos los CC</option>
            <option v-for="c in ccostos" :key="c.codigo" :value="c.codigo">{{ c.nombre }}</option>
          </select>
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
          <v-btn color="#0891b2" variant="flat" prepend-icon="mdi-refresh" :loading="loading" rounded="lg" @click="cargar">
            Actualizar
          </v-btn>
        </div>
      </div>

      <!-- PRESETS RÁPIDOS -->
      <div class="fs-presets">
        <button class="fs-preset" @click="setPreset('12m')">Últimos 12 meses</button>
        <button class="fs-preset" @click="setPreset('ytd')">Este año</button>
        <button class="fs-preset" @click="setPreset('6m')">Últimos 6 meses</button>
        <button class="fs-preset" @click="setPreset('3m')">Últimos 3 meses</button>
      </div>

      <!-- LOADING -->
      <div v-if="loading" class="fc-loading">
        <v-progress-circular indeterminate color="#0891b2" size="48" />
        <p>Analizando tomas físicas...</p>
      </div>

      <template v-else-if="data && (data.productos.length || data.serieMensual.length)">

        <!-- KPI CARDS -->
        <div class="fc-kpis">
          <div class="fc-kpi">
            <div class="fc-kpi-accent" style="background:#ef4444"></div>
            <div class="fc-kpi-icon" style="background:rgba(239,68,68,0.12)">
              <v-icon size="20" color="#ef4444">mdi-arrow-down-bold-circle-outline</v-icon>
            </div>
            <div class="fc-kpi-body">
              <div class="fc-kpi-lbl">Total Faltante</div>
              <div class="fc-kpi-val" style="color:#ef4444">{{ fmt(data.kpis.totalFaltante) }}</div>
              <div class="fc-kpi-sub">pérdida por inventario faltante</div>
            </div>
          </div>
          <div class="fc-kpi">
            <div class="fc-kpi-accent" style="background:#22c55e"></div>
            <div class="fc-kpi-icon" style="background:rgba(34,197,94,0.12)">
              <v-icon size="20" color="#22c55e">mdi-arrow-up-bold-circle-outline</v-icon>
            </div>
            <div class="fc-kpi-body">
              <div class="fc-kpi-lbl">Total Sobrante</div>
              <div class="fc-kpi-val" style="color:#22c55e">{{ fmt(data.kpis.totalSobrante) }}</div>
              <div class="fc-kpi-sub">inventario contado de más</div>
            </div>
          </div>
          <div class="fc-kpi">
            <div class="fc-kpi-accent" :style="{ background: netoColor }"></div>
            <div class="fc-kpi-icon" :style="{ background: netoBg }">
              <v-icon size="20" :color="netoColor">mdi-scale-balance</v-icon>
            </div>
            <div class="fc-kpi-body">
              <div class="fc-kpi-lbl">Neto</div>
              <div class="fc-kpi-val" :style="{ color: netoColor }">{{ fmt(data.kpis.neto) }}</div>
              <div class="fc-kpi-sub">{{ data.kpis.neto >= 0 ? 'sobrante neto' : 'faltante neto' }}</div>
            </div>
          </div>
          <div class="fc-kpi">
            <div class="fc-kpi-accent" style="background:#f59e0b"></div>
            <div class="fc-kpi-icon" style="background:rgba(245,158,11,0.12)">
              <v-icon size="20" color="#f59e0b">mdi-percent-outline</v-icon>
            </div>
            <div class="fc-kpi-body">
              <div class="fc-kpi-lbl">Faltante / Ventas</div>
              <div class="fc-kpi-val" style="color:#f59e0b">
                {{ data.kpis.pctFaltanteVentas !== null ? fmtPct(data.kpis.pctFaltanteVentas) : '—' }}
              </div>
              <div class="fc-kpi-sub">sobre ventas de {{ fmt(data.kpis.totalVentas) }}</div>
            </div>
          </div>
          <div class="fc-kpi">
            <div class="fc-kpi-accent" style="background:#ef4444"></div>
            <div class="fc-kpi-icon" style="background:rgba(239,68,68,0.12)">
              <v-icon size="20" color="#ef4444">mdi-alert-circle-outline</v-icon>
            </div>
            <div class="fc-kpi-body">
              <div class="fc-kpi-lbl">Mayor Faltante</div>
              <div class="fc-kpi-val" style="color:#ef4444;font-size:15px">
                {{ data.kpis.mayorFaltante ? fmt(data.kpis.mayorFaltante.faltante_valor) : '—' }}
              </div>
              <div class="fc-kpi-sub">{{ data.kpis.mayorFaltante?.producto_nombre || '—' }}</div>
            </div>
          </div>
          <div class="fc-kpi">
            <div class="fc-kpi-accent" style="background:#6366f1"></div>
            <div class="fc-kpi-icon" style="background:rgba(99,102,241,0.12)">
              <v-icon size="20" color="#6366f1">mdi-package-variant-closed</v-icon>
            </div>
            <div class="fc-kpi-body">
              <div class="fc-kpi-lbl">Productos Afectados</div>
              <div class="fc-kpi-val" style="color:#6366f1">{{ data.kpis.productosAfectados }}</div>
              <div class="fc-kpi-sub">con faltante o sobrante</div>
            </div>
          </div>
        </div>

        <!-- GRÁFICO EVOLUCIÓN MENSUAL -->
        <div class="fc-card fc-card-full">
          <div class="fc-card-header">
            <v-icon size="18" color="#0891b2">mdi-chart-bar</v-icon>
            <span class="fc-card-title">Evolución Mensual de Sobrantes y Faltantes</span>
            <div class="fs-toggle">
              <button :class="{ active: modoGlobal === 'valor' }" @click="setModoGlobal('valor')">Valor $</button>
              <button :class="{ active: modoGlobal === 'cantidad' }" @click="setModoGlobal('cantidad')">Cantidad</button>
            </div>
          </div>
          <div ref="chartMensualRef" class="chart-area"></div>
        </div>

        <!-- TABLA RANKING -->
        <div class="fc-card fc-card-full">
          <div class="fc-card-header">
            <v-icon size="18" color="#0891b2">mdi-format-list-numbered</v-icon>
            <span class="fc-card-title">Ranking de Productos</span>
            <input v-model="busqueda" placeholder="Buscar producto..." class="ac-search" />
          </div>
          <div class="fc-table-wrap">
            <table class="fc-table">
              <thead>
                <tr>
                  <th @click="sortBy('producto_codigo')" class="sortable">
                    CÓDIGO <v-icon size="12">{{ sortIcon('producto_codigo') }}</v-icon>
                  </th>
                  <th @click="sortBy('producto_nombre')" class="sortable">
                    PRODUCTO <v-icon size="12">{{ sortIcon('producto_nombre') }}</v-icon>
                  </th>
                  <th>UNIDAD</th>
                  <th class="tr" @click="sortBy('precio_costo')" style="cursor:pointer">
                    COSTO <v-icon size="12">{{ sortIcon('precio_costo') }}</v-icon>
                  </th>
                  <th class="tr" @click="sortBy('sobrante_cant')" style="cursor:pointer">
                    SOBRANTE (CANT) <v-icon size="12">{{ sortIcon('sobrante_cant') }}</v-icon>
                  </th>
                  <th class="tr" @click="sortBy('faltante_cant')" style="cursor:pointer">
                    FALTANTE (CANT) <v-icon size="12">{{ sortIcon('faltante_cant') }}</v-icon>
                  </th>
                  <th class="tr" @click="sortBy('diferencia_cant')" style="cursor:pointer">
                    DIFERENCIA <v-icon size="12">{{ sortIcon('diferencia_cant') }}</v-icon>
                  </th>
                  <th class="tr" @click="sortBy('neto_valor')" style="cursor:pointer">
                    NETO $ <v-icon size="12">{{ sortIcon('neto_valor') }}</v-icon>
                  </th>
                  <th class="tr"># TOMAS</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="grupo in productosFiltrados" :key="`grupo-${grupo.grupo_codigo}`">
                  <!-- Header del grupo -->
                  <tr class="fc-tr-group-header">
                    <td colspan="9" class="font-weight-bold" style="background: rgba(6, 182, 212, 0.15); padding: 8px 12px">
                      {{ grupo.grupo_nombre || 'SIN GRUPO' }}
                    </td>
                  </tr>
                  <!-- Productos del grupo -->
                  <tr v-for="p in grupo.productos" :key="p.producto_codigo"
                      class="fc-tr ac-tr-click"
                      :class="{ 'ac-row-selected': productoSel?.producto_codigo === p.producto_codigo }"
                      @click="seleccionarProducto(p)">
                    <td class="ac-prod-cod">{{ p.producto_codigo }}</td>
                    <td class="ac-prod-name">{{ p.producto_nombre }}</td>
                    <td>{{ p.und || '—' }}</td>
                    <td class="tr">{{ fmt(p.precio_costo) }}</td>
                    <td class="tr">{{ p.sobrante_cant > 0 ? fmtNum(p.sobrante_cant) : '—' }}</td>
                    <td class="tr">{{ p.faltante_cant > 0 ? fmtNum(p.faltante_cant) : '—' }}</td>
                    <td class="tr" :style="{ color: (p.sobrante_cant - p.faltante_cant) >= 0 ? '#22c55e' : '#ef4444' }">
                      {{ fmtNum(p.sobrante_cant - p.faltante_cant) }}
                    </td>
                    <td class="tr font-weight-bold">
                      <span v-if="p.neto_valor > 0" class="badge-pos">{{ fmt(p.neto_valor) }}</span>
                      <span v-else-if="p.neto_valor < 0" class="badge-neg">{{ fmt(p.neto_valor) }}</span>
                      <span v-else class="badge-dim">$0.00</span>
                    </td>
                    <td class="tr">{{ p.num_tomas }}</td>
                  </tr>
                  <!-- Subtotal del grupo -->
                  <tr class="fc-tr-subtotal">
                    <td colspan="4" class="font-weight-bold" style="text-align: left">Subtotal {{ grupo.grupo_nombre || 'SIN GRUPO' }}</td>
                    <td class="tr font-weight-bold">{{ fmtNum(grupo.subtotal.sobrante_cant) }}</td>
                    <td class="tr font-weight-bold">{{ fmtNum(grupo.subtotal.faltante_cant) }}</td>
                    <td class="tr font-weight-bold" :style="{ color: grupo.subtotal.diferencia_cant >= 0 ? '#22c55e' : '#ef4444' }">
                      {{ fmtNum(grupo.subtotal.diferencia_cant) }}
                    </td>
                    <td class="tr font-weight-bold" :style="{ color: grupo.subtotal.neto_valor >= 0 ? '#22c55e' : '#ef4444' }">
                      {{ fmt(grupo.subtotal.neto_valor) }}
                    </td>
                    <td class="tr"></td>
                  </tr>
                </template>
              </tbody>
              <tfoot>
                <tr class="fc-tr-totals">
                  <td colspan="4" class="font-weight-bold">TOTALES</td>
                  <td class="tr font-weight-bold">{{ fmtNum(productosTotales.sobrante_cant) }}</td>
                  <td class="tr font-weight-bold">{{ fmtNum(productosTotales.faltante_cant) }}</td>
                  <td class="tr font-weight-bold" :style="{ color: productosTotales.diferencia_cant >= 0 ? '#22c55e' : '#ef4444' }">
                    {{ fmtNum(productosTotales.diferencia_cant) }}
                  </td>
                  <td class="tr font-weight-bold" :style="{ color: productosTotales.neto_valor >= 0 ? '#22c55e' : '#ef4444' }">
                    {{ fmt(productosTotales.neto_valor) }}
                  </td>
                  <td class="tr"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- DETALLE PRODUCTO -->
        <div v-if="productoSel" ref="detalleRef" class="fc-card fc-card-full ac-detalle">
          <div class="fc-card-header">
            <v-icon size="18" color="#0891b2">mdi-chart-line</v-icon>
            <span class="fc-card-title">Detalle: {{ productoSel.producto_nombre }}</span>
            <div class="fs-toggle">
              <button :class="{ active: modoDetalle === 'valor' }" @click="setModoDetalle('valor')">Valor $</button>
              <button :class="{ active: modoDetalle === 'cantidad' }" @click="setModoDetalle('cantidad')">Cantidad</button>
            </div>
            <button class="ac-close-btn" @click="cerrarDetalle">
              <v-icon size="18">mdi-close</v-icon>
            </button>
          </div>

          <div v-if="loadingDetalle" class="fc-loading" style="padding:40px 0">
            <v-progress-circular indeterminate color="#0891b2" size="36" />
            <p>Cargando movimiento del producto...</p>
          </div>

          <template v-else-if="detalle">
            <!-- Mini KPIs del producto -->
            <div class="ac-mini-kpis">
              <div class="ac-mini-kpi">
                <span class="ac-mini-lbl">Sobrante Total</span>
                <span class="ac-mini-val" style="color:#22c55e">{{ fmt(detalle.kpis.totalSobranteValor) }}</span>
              </div>
              <div class="ac-mini-kpi">
                <span class="ac-mini-lbl">Faltante Total</span>
                <span class="ac-mini-val" style="color:#ef4444">{{ fmt(detalle.kpis.totalFaltanteValor) }}</span>
              </div>
              <div class="ac-mini-kpi">
                <span class="ac-mini-lbl">Neto</span>
                <span class="ac-mini-val" :style="{ color: detalle.kpis.netoValor >= 0 ? '#22c55e' : '#ef4444' }">
                  {{ fmt(detalle.kpis.netoValor) }}
                </span>
              </div>
              <div class="ac-mini-kpi">
                <span class="ac-mini-lbl">Sobrante (cant)</span>
                <span class="ac-mini-val">{{ fmtNum(detalle.kpis.totalSobranteCant) }}</span>
              </div>
              <div class="ac-mini-kpi">
                <span class="ac-mini-lbl">Faltante (cant)</span>
                <span class="ac-mini-val">{{ fmtNum(detalle.kpis.totalFaltanteCant) }}</span>
              </div>
              <div class="ac-mini-kpi">
                <span class="ac-mini-lbl"># Tomas</span>
                <span class="ac-mini-val">{{ detalle.kpis.numTomas }}</span>
              </div>
            </div>

            <!-- Gráfico movimiento del producto -->
            <div class="fc-card-header" style="margin-top:16px">
              <v-icon size="16" color="#0891b2">mdi-chart-timeline-variant</v-icon>
              <span class="fc-card-title" style="font-size:12px">
                Movimiento Mensual — {{ modoDetalle === 'valor' ? 'Valor $' : 'Cantidad' }}
              </span>
            </div>
            <div ref="chartDetalleRef" class="chart-area"></div>

            <!-- Tabla histórico de tomas -->
            <div class="fc-card-header" style="margin-top:18px">
              <v-icon size="16" color="#8b5cf6">mdi-history</v-icon>
              <span class="fc-card-title" style="font-size:12px">Histórico de Tomas Físicas</span>
            </div>
            <div class="fc-table-wrap">
              <table class="fc-table">
                <thead>
                  <tr>
                    <th>FECHA</th>
                    <th>CENTRO DE COSTO</th>
                    <th class="tr">SOBRANTE</th>
                    <th class="tr">FALTANTE</th>
                    <th class="tr">NETO (CANT)</th>
                    <th class="tr">NETO $</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(h, i) in [...detalle.historico].reverse()" :key="i" class="fc-tr">
                    <td>{{ fmtFecha(h.fecha) }}</td>
                    <td>{{ h.ccosto_nombre || '—' }}</td>
                    <td class="tr" style="color:#22c55e">{{ h.sobrante_cant > 0 ? fmtNum(h.sobrante_cant) : '—' }}</td>
                    <td class="tr" style="color:#ef4444">{{ h.faltante_cant > 0 ? fmtNum(h.faltante_cant) : '—' }}</td>
                    <td class="tr">{{ fmtNum(h.neto_cant) }}</td>
                    <td class="tr font-weight-bold" :style="{ color: h.neto_valor >= 0 ? '#22c55e' : '#ef4444' }">
                      {{ fmt(h.neto_valor) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>

      </template>

      <div v-else-if="!loading" class="fc-empty">
        <v-icon size="56" color="#94a3b8">mdi-scale-balance</v-icon>
        <p>No hay tomas físicas registradas en el período seleccionado.</p>
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

// ── Estado principal ──────────────────────────────────────────────
const loading  = ref(false)
const data     = ref(null)
const busqueda = ref('')
const grupoSel = ref('')
const ccostoSel = ref('')
const gruposDisponibles = ref([])
const ccostos = ref([])

const modoGlobal  = ref('valor')   // 'valor' | 'cantidad'
const modoDetalle = ref('valor')

const defaultHasta = () => new Date().toISOString().slice(0, 10)
const defaultDesde = () => {
  const d = new Date(); d.setMonth(d.getMonth() - 11); d.setDate(1)
  return d.toISOString().slice(0, 10)
}
const desde = ref(defaultDesde())
const hasta = ref(defaultHasta())

function setPreset(p) {
  const hoy = new Date()
  hasta.value = hoy.toISOString().slice(0, 10)
  const d = new Date()
  if (p === '12m') { d.setMonth(d.getMonth() - 11); d.setDate(1) }
  else if (p === 'ytd') { d.setMonth(0); d.setDate(1) }
  else if (p === '6m')  { d.setMonth(d.getMonth() - 5); d.setDate(1) }
  else if (p === '3m')  { d.setMonth(d.getMonth() - 2); d.setDate(1) }
  desde.value = d.toISOString().slice(0, 10)
  cargar()
}

// ── Ordenamiento tabla ranking ────────────────────────────────────
const sortCol = ref('faltante_valor')
const sortDir = ref('desc')
function sortBy(col) {
  if (sortCol.value === col) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortCol.value = col; sortDir.value = 'desc' }
}
function sortIcon(col) {
  if (sortCol.value !== col) return 'mdi-sort'
  return sortDir.value === 'asc' ? 'mdi-sort-ascending' : 'mdi-sort-descending'
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

  // Agrupar por grupo_codigo
  const grupos = {}
  lista.forEach(p => {
    const grp = p.grupo_codigo || 'SIN_GRUPO'
    if (!grupos[grp]) {
      grupos[grp] = {
        grupo_codigo: p.grupo_codigo,
        grupo_nombre: p.grupo_nombre,
        productos: []
      }
    }
    grupos[grp].productos.push(p)
  })

  // Ordenar grupos por grupo_codigo
  const gruposOrdenados = Object.values(grupos).sort((a, b) =>
    (a.grupo_codigo || '').localeCompare(b.grupo_codigo || '')
  )

  // Ordenar productos dentro de cada grupo alfabéticamente por nombre
  gruposOrdenados.forEach(g => {
    g.productos.sort((a, b) => (a.producto_nombre || '').localeCompare(b.producto_nombre || ''))

    // Calcular subtotal del grupo
    g.subtotal = {
      sobrante_cant: g.productos.reduce((sum, p) => sum + (p.sobrante_cant || 0), 0),
      faltante_cant: g.productos.reduce((sum, p) => sum + (p.faltante_cant || 0), 0),
      sobrante_valor: g.productos.reduce((sum, p) => sum + (p.sobrante_valor || 0), 0),
      faltante_valor: g.productos.reduce((sum, p) => sum + (p.faltante_valor || 0), 0),
      neto_valor: g.productos.reduce((sum, p) => sum + (p.neto_valor || 0), 0),
      num_tomas: g.productos.reduce((sum, p) => sum + (p.num_tomas || 0), 0),
    }
    g.subtotal.diferencia_cant = g.subtotal.sobrante_cant - g.subtotal.faltante_cant
  })

  return gruposOrdenados
})

const productosTotales = computed(() => {
  const grupos = productosFiltrados.value
  return {
    sobrante_cant: grupos.reduce((sum, g) => sum + (g.subtotal?.sobrante_cant || 0), 0),
    faltante_cant: grupos.reduce((sum, g) => sum + (g.subtotal?.faltante_cant || 0), 0),
    sobrante_valor: grupos.reduce((sum, g) => sum + (g.subtotal?.sobrante_valor || 0), 0),
    faltante_valor: grupos.reduce((sum, g) => sum + (g.subtotal?.faltante_valor || 0), 0),
    neto_valor: grupos.reduce((sum, g) => sum + (g.subtotal?.neto_valor || 0), 0),
    num_tomas: grupos.reduce((sum, g) => sum + (g.subtotal?.num_tomas || 0), 0),
    diferencia_cant: grupos.reduce((sum, g) => sum + (g.subtotal?.diferencia_cant || 0), 0),
  }
})

// ── KPIs derivados ────────────────────────────────────────────────
const netoColor = computed(() => (data.value?.kpis?.neto ?? 0) >= 0 ? '#22c55e' : '#ef4444')
const netoBg    = computed(() => (data.value?.kpis?.neto ?? 0) >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)')

// ── Estado detalle producto ───────────────────────────────────────
const productoSel    = ref(null)
const detalle        = ref(null)
const loadingDetalle = ref(false)
const detalleRef     = ref(null)
const chartMensualRef = ref(null)
const chartDetalleRef = ref(null)
let chartMensual = null
let chartDetalle = null

function setModoGlobal(m) { modoGlobal.value = m; nextTick(() => renderMensual()) }
function setModoDetalle(m) { modoDetalle.value = m; nextTick(() => renderDetalle()) }

async function seleccionarProducto(p) {
  productoSel.value = p
  detalle.value     = null
  loadingDetalle.value = true
  await nextTick()
  detalleRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  try {
    const params = new URLSearchParams({ empresa: empresa.value, desde: desde.value, hasta: hasta.value })
    if (ccostoSel.value) params.set('ccosto', ccostoSel.value)
    const res = await fetch(`${API_BASE}/gerencia/analisis-faltantes/producto/${encodeURIComponent(p.producto_codigo)}?${params}`)
    const j = await res.json()
    if (!j.success) throw new Error(j.error)
    detalle.value = j
    loadingDetalle.value = false
    await nextTick()
    renderDetalle()
  } catch (e) {
    console.error('analisis-faltantes/producto:', e)
    loadingDetalle.value = false
  }
}

function cerrarDetalle() {
  productoSel.value = null
  detalle.value = null
  chartDetalle?.destroy(); chartDetalle = null
}

// ── Carga principal ───────────────────────────────────────────────
async function cargarCcostos() {
  if (!empresa.value) return
  try {
    const res = await fetch(`${API_BASE}/ccostos?empresa=${encodeURIComponent(empresa.value)}`)
    const j = await res.json()
    if (j.success) ccostos.value = j.data || []
  } catch (e) {
    console.error('ccostos:', e)
  }
}

async function cargar() {
  if (!empresa.value) return
  cerrarDetalle()
  loading.value = true
  try {
    const params = new URLSearchParams({
      empresa: empresa.value, desde: desde.value, hasta: hasta.value,
    })
    if (ccostoSel.value) params.set('ccosto', ccostoSel.value)
    if (grupoSel.value)  params.set('grupo', grupoSel.value)
    const res = await fetch(`${API_BASE}/gerencia/analisis-faltantes?${params}`)
    const j = await res.json()
    if (!j.success) throw new Error(j.error)
    data.value = j
    gruposDisponibles.value = j.gruposDisponibles || []
    loading.value = false
    await nextTick()
    renderMensual()
  } catch (e) {
    console.error('analisis-faltantes:', e)
    loading.value = false
  }
}

// ── Helpers gráfica ───────────────────────────────────────────────
function isDark() {
  return document.documentElement.classList.contains('v-theme--dark') ||
         document.body.classList.contains('v-theme--dark')
}
function themeColors() {
  return isDark()
    ? { fg: '#94a3b8', grid: 'rgba(255,255,255,0.06)' }
    : { fg: '#64748b', grid: 'rgba(0,0,0,0.06)' }
}
function labelMes(key) {
  // key = 'YYYY-MM'
  const [y, m] = key.split('-')
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${meses[parseInt(m, 10) - 1]} ${y.slice(2)}`
}

function renderMensual() {
  chartMensual?.destroy(); chartMensual = null
  if (!chartMensualRef.value || !data.value?.serieMensual?.length) return
  const { fg, grid } = themeColors()
  const serie = data.value.serieMensual
  const cats = serie.map(s => labelMes(s.periodo_key))
  const esValor = modoGlobal.value === 'valor'

  const sobrante = serie.map(s => esValor ? s.sobrante_valor : s.sobrante_cant)
  const faltante = serie.map(s => esValor ? s.faltante_valor : s.faltante_cant)
  const neto     = serie.map(s => esValor ? s.neto_valor : s.neto_cant)

  chartMensual = new ApexCharts(chartMensualRef.value, {
    chart: {
      type: 'line', height: 360, toolbar: { show: false },
      fontFamily: 'Inter,sans-serif', background: 'transparent',
      animations: { enabled: true, speed: 500 },
    },
    theme: { mode: isDark() ? 'dark' : 'light' },
    series: [
      { name: 'Sobrante', data: sobrante, color: '#22c55e' },
      { name: 'Faltante', data: faltante, color: '#ef4444' },
      { name: 'Neto', data: neto, color: '#6366f1' },
    ],
    stroke: { width: 2.5, curve: 'smooth' },
    markers: { size: 5, strokeColors: '#fff', strokeWidth: 2, hover: { size: 7 } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: cats,
      labels: { style: { colors: fg, fontSize: '11px' } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: fg }, formatter: v => esValor ? fmtShort(v) : fmtNum(v) },
    },
    grid: { borderColor: grid, strokeDashArray: 4 },
    legend: { position: 'top', horizontalAlign: 'left', labels: { colors: fg }, markers: { size: 7 } },
    tooltip: {
      shared: true, intersect: false,
      y: { formatter: v => esValor ? fmt(Math.abs(v)) : fmtNum(Math.abs(v)) },
    },
  })
  chartMensual.render()
}

function renderDetalle() {
  chartDetalle?.destroy(); chartDetalle = null
  if (!chartDetalleRef.value || !detalle.value?.serieMensual?.length) return
  const { fg, grid } = themeColors()
  const serie = detalle.value.serieMensual
  const cats = serie.map(s => labelMes(s.periodo_key))
  const esValor = modoDetalle.value === 'valor'

  const sobrante = serie.map(s => esValor ? s.sobrante_valor : s.sobrante_cant)
  const faltante = serie.map(s => esValor ? -Math.abs(s.faltante_valor) : -Math.abs(s.faltante_cant))

  chartDetalle = new ApexCharts(chartDetalleRef.value, {
    chart: {
      type: 'bar', height: 320, stacked: true, toolbar: { show: false },
      fontFamily: 'Inter,sans-serif', background: 'transparent',
      animations: { enabled: true, speed: 500 },
    },
    theme: { mode: isDark() ? 'dark' : 'light' },
    series: [
      { name: 'Sobrante', data: sobrante, color: '#22c55e' },
      { name: 'Faltante', data: faltante, color: '#ef4444' },
    ],
    plotOptions: { bar: { columnWidth: '50%', borderRadius: 3 } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: cats,
      labels: { style: { colors: fg, fontSize: '11px' } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: fg }, formatter: v => esValor ? fmtShort(v) : fmtNum(v) },
    },
    grid: { borderColor: grid, strokeDashArray: 4 },
    legend: { position: 'top', horizontalAlign: 'left', labels: { colors: fg }, markers: { size: 7 } },
    tooltip: {
      shared: true, intersect: false,
      y: { formatter: v => esValor ? fmt(Math.abs(v)) : fmtNum(Math.abs(v)) },
    },
  })
  chartDetalle.render()
}

watch([desde, hasta], () => {}) // fechas se aplican con el botón/preset

// ── Formatters ────────────────────────────────────────────────────
function fmt(v) {
  const n = parseFloat(v) || 0
  const sign = n < 0 ? '-' : ''
  return sign + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtShort(v) {
  const n = Math.abs(parseFloat(v) || 0)
  const sign = v < 0 ? '-' : ''
  if (n >= 1e6) return sign + '$' + (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return sign + '$' + (n / 1e3).toFixed(1) + 'K'
  return sign + '$' + n.toFixed(0)
}
function fmtNum(v) {
  if (v === null || v === undefined) return '—'
  return (parseFloat(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtPct(v) {
  if (v === null || v === undefined) return '—'
  return (parseFloat(v) || 0).toFixed(2) + '%'
}
function fmtFecha(v) {
  if (!v) return '—'
  const [y, m, d] = String(v).split('T')[0].split('-')
  return (y && m && d) ? `${m}/${d}/${y}` : String(v)
}

onMounted(async () => {
  await cargarCcostos()
  cargar()
})
onBeforeUnmount(() => {
  chartMensual?.destroy(); chartMensual = null
  chartDetalle?.destroy(); chartDetalle = null
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
.fc-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.fc-header-left { display: flex; align-items: center; gap: 16px; }
.fc-icon-wrap {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
  background: linear-gradient(135deg, #06b6d4, #0891b2);
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

/* PRESETS */
.fs-presets { display: flex; gap: 8px; margin-bottom: 22px; flex-wrap: wrap; }
.fs-preset {
  padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  background: rgb(var(--v-theme-surface)); color: rgba(var(--v-theme-on-surface), 0.7);
  cursor: pointer; transition: all 0.15s;
}
.fs-preset:hover { background: rgba(6,182,212,0.1); color: #0891b2; border-color: rgba(6,182,212,0.4); }

/* TOGGLE valor/cantidad */
.fs-toggle {
  display: inline-flex; border-radius: 8px; overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.14); margin-left: auto;
}
.fs-toggle button {
  padding: 6px 14px; font-size: 12px; font-weight: 700; cursor: pointer;
  background: transparent; color: rgba(var(--v-theme-on-surface), 0.55); border: none;
  transition: all 0.15s;
}
.fs-toggle button.active { background: #0891b2; color: white; }

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
.fc-card-title { font-size: 13.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: rgb(var(--v-theme-on-surface)); }

/* Búsqueda en tabla */
.ac-search {
  margin-left: auto;
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
.fc-tr-group-header {
  background: rgba(6, 182, 212, 0.08) !important;
}
.fc-tr-group-header:hover { background: rgba(6, 182, 212, 0.12) !important; }
.fc-tr-subtotal {
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}
.fc-tr-totals {
  background: rgba(var(--v-theme-on-surface), 0.08);
  border-top: 2px solid rgba(var(--v-theme-on-surface), 0.15);
  border-bottom: 2px solid rgba(var(--v-theme-on-surface), 0.15);
}
.ac-tr-click { cursor: pointer; }
.ac-row-selected { background: rgba(6, 182, 212, 0.07) !important; }
.font-weight-bold { font-weight: 700; }
.text-dim { color: rgba(var(--v-theme-on-surface), 0.45); }

.ac-prod-name { font-weight: 600; font-size: 13px; }
.ac-prod-cod { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.45); }

/* Badges */
.badge-pos { background: rgba(34,197,94,0.12); color: #16a34a; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 10px; }
.badge-neg { background: rgba(239,68,68,0.12); color: #ef4444; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 10px; }
.badge-dim { background: rgba(148,163,184,0.12); color: #94a3b8; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 10px; }

/* Detalle */
.ac-detalle { border: 2px solid rgba(6, 182, 212, 0.3); }
.ac-close-btn {
  background: transparent; border: none; cursor: pointer;
  color: rgba(var(--v-theme-on-surface), 0.5); border-radius: 8px; padding: 4px 6px;
  transition: background 0.15s;
}
.ac-close-btn:hover { background: rgba(var(--v-theme-on-surface), 0.08); }

/* Mini KPIs del detalle */
.ac-mini-kpis { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
.ac-mini-kpi {
  display: flex; flex-direction: column; gap: 2px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 10px; padding: 10px 16px; min-width: 130px;
}
.ac-mini-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.4); }
.ac-mini-val { font-size: 16px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); }

.chart-area { min-height: 320px; }
</style>
