<template>
  <MainLayout>
    <div class="cv-wrap">

      <PageHeader
        title="Composición de Ventas por Sede"
        description="Cada concepto de la venta como porcentaje, para comparar sedes de distinto tamaño en la misma escala"
        :crumbs="['Gerencia', 'Reportes', 'Composición de Ventas']"
      >
        <template #actions>
          <div class="cv-controles">
            <div class="cv-fechas">
              <input type="date" v-model="desde" class="cv-date" aria-label="Desde" />
              <span class="cv-date-sep">→</span>
              <input type="date" v-model="hasta" class="cv-date" aria-label="Hasta" />
            </div>
            <div class="cv-presets">
              <button v-for="p in PRESETS" :key="p.label" class="cv-preset" @click="aplicarPreset(p)">
                {{ p.label }}
              </button>
            </div>
            <v-btn color="primary" variant="flat" size="small" prepend-icon="mdi-refresh"
                   :loading="loading" @click="cargar">
              Actualizar
            </v-btn>
          </div>
        </template>
      </PageHeader>

      <!-- LOADING -->
      <div v-if="loading" class="cv-estado">
        <v-progress-circular indeterminate color="primary" size="42" />
        <p>Leyendo ventas del período...</p>
      </div>

      <div v-else-if="!sedes.length" class="cv-estado">
        <v-icon size="46" color="var(--ink-400)">mdi-database-off-outline</v-icon>
        <p>No hay ventas registradas en el período seleccionado</p>
      </div>

      <template v-else>

        <!-- BASE DE CÁLCULO -->
        <div class="cv-base">
          <div class="cv-base-lbl">
            <v-icon size="15">mdi-division</v-icon>
            Los porcentajes se miden sobre
          </div>
          <div class="cv-seg">
            <button
              v-for="b in BASES" :key="b.key"
              class="cv-seg-btn" :class="{ 'cv-seg-btn--on': base === b.key }"
              @click="base = b.key"
            >{{ b.label }}</button>
          </div>
          <span class="cv-base-val">{{ money(totales[base]) }} en el período</span>
        </div>

        <!-- KPIs CONSOLIDADOS -->
        <div class="cv-kpis">
          <div class="cv-kpi cv-kpi--ancla">
            <div class="cv-kpi-lbl">Ventas Netas</div>
            <div class="cv-kpi-val">{{ money(totales.ventas_netas) }}</div>
            <div class="cv-kpi-foot">{{ totales.num_sedes }} sede(s) · {{ money(ventaDiaConsolidada) }} / día</div>
          </div>
          <div v-for="k in KPIS" :key="k.key" class="cv-kpi">
            <div class="cv-kpi-lbl">{{ k.label }}</div>
            <div class="cv-kpi-val" :style="`color:${k.color}`">{{ pct(pctDe(totales, k.key)) }}</div>
            <div class="cv-kpi-foot">{{ money(totales[k.key]) }}</div>
          </div>
        </div>

        <!-- BRECHAS ENTRE SEDES -->
        <div v-if="brechas.length" class="cv-card">
          <div class="cv-card-head">
            <v-icon size="15" color="var(--gold)">mdi-arrow-expand-horizontal</v-icon>
            Dónde más se separan las sedes
            <span class="cv-card-note">Diferencia en puntos porcentuales entre la sede más alta y la más baja</span>
          </div>
          <div class="cv-brechas">
            <div v-for="b in brechas" :key="b.key" class="cv-brecha">
              <div class="cv-brecha-top">
                <span class="cv-brecha-nom">{{ b.label }}</span>
                <span class="cv-brecha-gap">{{ b.spread.toFixed(1) }} pp</span>
              </div>
              <div class="cv-brecha-barra">
                <div class="cv-brecha-rango" :style="rangoEstilo(b)"></div>
              </div>
              <div class="cv-brecha-extremos">
                <span><strong>{{ pct(b.min) }}</strong> {{ b.sedeMin }}</span>
                <span><strong>{{ pct(b.max) }}</strong> {{ b.sedeMax }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- COMPARATIVO POR CONCEPTO -->
        <div class="cv-card">
          <div class="cv-card-head">
            <v-icon size="15" color="var(--indigo)">mdi-chart-bar</v-icon>
            Cada concepto, sede contra sede
            <span class="cv-card-note">% sobre {{ baseLabel }}</span>
          </div>
          <div ref="refConceptos" class="cv-chart"></div>
        </div>

        <div class="cv-duo">
          <!-- RADAR -->
          <div class="cv-card">
            <div class="cv-card-head">
              <v-icon size="15" color="var(--indigo)">mdi-radar</v-icon>
              Perfil de cada sede
              <span class="cv-card-note">Formas distintas = operaciones distintas</span>
            </div>
            <div ref="refRadar" class="cv-chart"></div>
          </div>

          <!-- MIX DE MEDIOS DE PAGO -->
          <div class="cv-card">
            <div class="cv-card-head">
              <v-icon size="15" color="var(--indigo)">mdi-credit-card-outline</v-icon>
              Con qué le pagan a cada sede
              <span class="cv-card-note">% del total recaudado</span>
            </div>
            <div ref="refMix" class="cv-chart"></div>
          </div>
        </div>

        <!-- HEATMAP -->
        <div class="cv-card">
          <div class="cv-card-head">
            <v-icon size="15" color="var(--indigo)">mdi-grid</v-icon>
            Mapa de calor concepto × sede
            <span class="cv-card-note">Entre más intenso, mayor peso sobre la venta</span>
          </div>
          <div ref="refHeat" class="cv-chart cv-chart--alto"></div>
        </div>

        <!-- EVOLUCIÓN MENSUAL -->
        <div v-if="mesesDisponibles.length > 1" class="cv-card">
          <div class="cv-card-head">
            <v-icon size="15" color="var(--indigo)">mdi-chart-line</v-icon>
            Evolución mes a mes
            <div class="cv-metric-sel">
              <button
                v-for="c in conceptos" :key="c.key"
                class="cv-chip" :class="{ 'cv-chip--on': metrica === c.key }"
                @click="metrica = c.key"
              >{{ c.label }}</button>
            </div>
          </div>
          <div ref="refEvolucion" class="cv-chart"></div>
        </div>

        <!-- TABLA COMPARATIVA -->
        <div class="cv-card">
          <div class="cv-card-head">
            <v-icon size="15" color="var(--indigo)">mdi-table-large</v-icon>
            Detalle comparativo
            <span class="cv-card-note">
              Resaltado el que se aparta más de 15% del consolidado
            </span>
          </div>
          <div class="cv-scroll">
            <table class="cv-table">
              <thead>
                <tr>
                  <th class="th-concepto">CONCEPTO</th>
                  <th v-for="s in sedes" :key="s.ccosto" class="th-sede">
                    <span class="th-punto" :style="`background:${colorSede(s.ccosto)}`"></span>
                    {{ s.nombre }}
                  </th>
                  <th class="th-total">CONSOLIDADO</th>
                </tr>
              </thead>
              <tbody>
                <tr class="fila-base">
                  <td class="td-concepto">{{ baseLabel }}</td>
                  <td v-for="s in sedes" :key="s.ccosto" class="td-num">{{ money(s[base]) }}</td>
                  <td class="td-num td-total">{{ money(totales[base]) }}</td>
                </tr>

                <template v-for="g in conceptosPorGrupo" :key="g.nombre">
                  <tr class="fila-grupo">
                    <td :colspan="sedes.length + 2">{{ g.nombre }}</td>
                  </tr>
                  <tr v-for="c in g.items" :key="c.key">
                    <td class="td-concepto td-indent">{{ c.label }}</td>
                    <td v-for="s in sedes" :key="s.ccosto" class="td-num" :class="tono(c, s)">
                      <span class="td-pct">{{ pct(pctDe(s, c.key)) }}</span>
                      <span class="td-money">{{ money(s[c.key]) }}</span>
                    </td>
                    <td class="td-num td-total">
                      <span class="td-pct">{{ pct(pctDe(totales, c.key)) }}</span>
                      <span class="td-money">{{ money(totales[c.key]) }}</span>
                    </td>
                  </tr>
                </template>

                <tr class="fila-grupo">
                  <td :colspan="sedes.length + 2">Operación</td>
                </tr>
                <tr>
                  <td class="td-concepto td-indent">Días operados</td>
                  <td v-for="s in sedes" :key="s.ccosto" class="td-num">
                    <span class="td-pct">{{ s.dias_operados }}</span>
                  </td>
                  <td class="td-num td-total"><span class="td-pct">{{ totales.dias_operados }}</span></td>
                </tr>
                <tr>
                  <td class="td-concepto td-indent">Venta neta / día</td>
                  <td v-for="s in sedes" :key="s.ccosto" class="td-num">
                    <span class="td-pct">{{ money(s.dias_operados ? s.ventas_netas / s.dias_operados : 0) }}</span>
                  </td>
                  <td class="td-num td-total"><span class="td-pct">{{ money(ventaDiaConsolidada) }}</span></td>
                </tr>
                <tr>
                  <td class="td-concepto td-indent">Participación en la venta total</td>
                  <td v-for="s in sedes" :key="s.ccosto" class="td-num">
                    <span class="td-pct">{{ pct(participacion(s)) }}</span>
                  </td>
                  <td class="td-num td-total"><span class="td-pct">100.0%</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="cv-nota">
            <v-icon size="13">mdi-information-outline</v-icon>
            <span>
              Todo sale del encabezado diario de ventas. Los medios de pago (tarjetas, efectivo,
              otros) suman el dinero recaudado, que incluye impuestos y propinas — por eso
              contra la venta neta pueden pasar del 100%. Para el reparto entre medios, mire la
              gráfica de barras apiladas, que usa el recaudo como base.
            </span>
          </div>
        </div>

      </template>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useTheme } from 'vuetify'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import ApexCharts from 'apexcharts'

const authStore = useAuthStore()
const empresa = computed(() =>
  authStore.empresa || authStore.user?.empresa || localStorage.getItem('empresaActual') || ''
)
const theme = useTheme()

// ── Estado ────────────────────────────────────────────────────────
const loading   = ref(false)
const data      = ref(null)
const base      = ref('ventas_netas')
const metrica   = ref('descuentos')

const BASES = [
  { key: 'ventas_netas',  label: 'Ventas netas'  },
  { key: 'ventas_brutas', label: 'Ventas brutas' },
]
const baseLabel = computed(() => BASES.find(b => b.key === base.value).label)

const KPIS = [
  { key: 'descuentos', label: 'Descuentos',  color: 'var(--warning)' },
  { key: 'comisiones', label: 'Comisiones',  color: 'var(--error)'   },
  { key: 'propinas',   label: 'Propinas',    color: 'var(--success)' },
  { key: 'tarjetas',   label: 'Tarjetas',    color: 'var(--indigo)'  },
  { key: 'efectivo',   label: 'Efectivo',    color: 'var(--gold)'    },
]

// Paleta por sede: se reparte por índice y se reutiliza en todas las gráficas
// y en la tabla, para que un color signifique siempre la misma sede.
const PALETA = ['#4f46e5', '#0891b2', '#b8720b', '#15803d', '#dc2626',
                '#7c3aed', '#db2777', '#0284c7', '#65a30d', '#ea580c']

// ── Fechas ────────────────────────────────────────────────────────
function primerDiaMes() {
  const d = new Date(); d.setDate(1)
  return fechaISO(d)
}
function fechaISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const desde = ref(primerDiaMes())
const hasta = ref(fechaISO(new Date()))

const PRESETS = [
  { label: 'Este mes',   meses: 0 },
  { label: 'Mes pasado', mesPasado: true },
  { label: '3 meses',    meses: 3 },
  { label: '12 meses',   meses: 12 },
]

function aplicarPreset(p) {
  const hoy = new Date()
  if (p.mesPasado) {
    desde.value = fechaISO(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1))
    hasta.value = fechaISO(new Date(hoy.getFullYear(), hoy.getMonth(), 0))
  } else if (p.meses === 0) {
    desde.value = primerDiaMes()
    hasta.value = fechaISO(hoy)
  } else {
    desde.value = fechaISO(new Date(hoy.getFullYear(), hoy.getMonth() - p.meses + 1, 1))
    hasta.value = fechaISO(hoy)
  }
  cargar()
}

// ── Derivados ─────────────────────────────────────────────────────
const sedes     = computed(() => data.value?.sedes || [])
const totales   = computed(() => data.value?.totales || {})
const conceptos = computed(() => data.value?.conceptos || [])
const serie     = computed(() => data.value?.serie || [])

const colorPorSede = computed(() => Object.fromEntries(
  sedes.value.map((s, i) => [s.ccosto, PALETA[i % PALETA.length]])
))
function colorSede(cc) { return colorPorSede.value[cc] || 'var(--ink-400)' }

function pctDe(fila, key) {
  const b = Number(fila?.[base.value]) || 0
  return b > 0 ? (Number(fila?.[key]) || 0) / b * 100 : 0
}
function participacion(s) {
  const t = Number(totales.value.ventas_netas) || 0
  return t > 0 ? (Number(s.ventas_netas) || 0) / t * 100 : 0
}
const ventaDiaConsolidada = computed(() => {
  const d = Number(totales.value.dias_operados) || 0
  return d > 0 ? (Number(totales.value.ventas_netas) || 0) / d : 0
})

const conceptosPorGrupo = computed(() => {
  const mapa = new Map()
  for (const c of conceptos.value) {
    if (!mapa.has(c.grupo)) mapa.set(c.grupo, { nombre: c.grupo, items: [] })
    mapa.get(c.grupo).items.push(c)
  }
  return [...mapa.values()]
})

// Brechas: dónde la dispersión entre sedes es mayor. Con una sola sede
// no hay nada que comparar, así que el panel desaparece.
const brechas = computed(() => {
  if (sedes.value.length < 2) return []
  return conceptos.value.map(c => {
    const vals = sedes.value.map(s => ({ v: pctDe(s, c.key), nombre: s.nombre }))
    const min = vals.reduce((a, b) => (b.v < a.v ? b : a))
    const max = vals.reduce((a, b) => (b.v > a.v ? b : a))
    return {
      key: c.key, label: c.label,
      min: min.v, max: max.v, sedeMin: min.nombre, sedeMax: max.nombre,
      spread: max.v - min.v,
    }
  })
  .filter(b => b.spread > 0.05)
  .sort((a, b) => b.spread - a.spread)
  .slice(0, 4)
})

function rangoEstilo(b) {
  const tope = Math.max(...brechas.value.map(x => x.max), 1)
  return {
    left:  `${(b.min / tope) * 100}%`,
    width: `${Math.max(((b.max - b.min) / tope) * 100, 1.5)}%`,
  }
}

// Marca la celda cuando se aparta más de 15% relativo del consolidado.
// El signo de "malo" depende del concepto: más descuento es peor, más
// propina es mejor, y los medios de pago solo se señalan como distintos.
function tono(c, sede) {
  const ref = pctDe(totales.value, c.key)
  if (!ref) return ''
  const dif = pctDe(sede, c.key) - ref
  if (Math.abs(dif) < ref * 0.15) return ''
  if (c.sentido === 'neutro') return 'cel--dif'
  const peor = c.sentido === 'menos_mejor' ? dif > 0 : dif < 0
  return peor ? 'cel--peor' : 'cel--mejor'
}

const mesesDisponibles = computed(() =>
  [...new Set(serie.value.map(r => r.periodo))].sort()
)

// ── Formato ───────────────────────────────────────────────────────
function money(v) {
  if (v === null || v === undefined) return '—'
  return '$' + Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })
}
function moneyCorto(v) {
  const n = Math.abs(Number(v) || 0)
  if (n >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'k'
  return '$' + Math.round(n)
}
function pct(v) {
  if (v === null || v === undefined) return '—'
  return Number(v).toFixed(1) + '%'
}
function labelMes(key) {
  const [y, m] = key.split('-')
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${meses[parseInt(m, 10) - 1]} ${y.slice(2)}`
}

// ── Gráficas ──────────────────────────────────────────────────────
const refConceptos = ref(null)
const refRadar     = ref(null)
const refMix       = ref(null)
const refHeat      = ref(null)
const refEvolucion = ref(null)

let chConceptos = null, chRadar = null, chMix = null, chHeat = null, chEvolucion = null

const esOscuro = computed(() => theme.global.current.value.dark)

function ejes() {
  return esOscuro.value
    ? { fg: '#b3aa9a', grid: 'rgba(255,255,255,0.07)' }
    : { fg: '#6b6459', grid: 'rgba(0,0,0,0.07)' }
}
function baseChart(extra = {}) {
  return {
    chart: {
      toolbar: { show: false }, background: 'transparent',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      animations: { enabled: true, speed: 400 },
      ...extra,
    },
    theme: { mode: esOscuro.value ? 'dark' : 'light' },
  }
}
function leyenda() {
  return {
    position: 'top', horizontalAlign: 'left', fontSize: '12px',
    labels: { colors: ejes().fg }, markers: { size: 6 },
    itemMargin: { horizontal: 8, vertical: 3 },
  }
}

function pintarConceptos() {
  chConceptos?.destroy(); chConceptos = null
  if (!refConceptos.value || !sedes.value.length) return
  const { fg, grid } = ejes()

  chConceptos = new ApexCharts(refConceptos.value, {
    ...baseChart({ type: 'bar', height: 380 }),
    series: sedes.value.map(s => ({
      name: s.nombre,
      color: colorSede(s.ccosto),
      data: conceptos.value.map(c => Number(pctDe(s, c.key).toFixed(2))),
    })),
    plotOptions: { bar: { columnWidth: '70%', borderRadius: 3, borderRadiusApplication: 'end' } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    xaxis: {
      categories: conceptos.value.map(c => c.label),
      labels: { style: { colors: fg, fontSize: '11px' } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: fg }, formatter: v => v.toFixed(0) + '%' } },
    grid: { borderColor: grid, strokeDashArray: 4 },
    legend: leyenda(),
    tooltip: { y: { formatter: v => v.toFixed(2) + '%' } },
  })
  chConceptos.render()
}

function pintarRadar() {
  chRadar?.destroy(); chRadar = null
  if (!refRadar.value || !sedes.value.length) return
  const { fg, grid } = ejes()

  chRadar = new ApexCharts(refRadar.value, {
    ...baseChart({ type: 'radar', height: 360 }),
    series: sedes.value.map(s => ({
      name: s.nombre,
      color: colorSede(s.ccosto),
      data: conceptos.value.map(c => Number(pctDe(s, c.key).toFixed(2))),
    })),
    labels: conceptos.value.map(c => c.label),
    stroke: { width: 2 },
    fill: { opacity: 0.12 },
    markers: { size: 3 },
    dataLabels: { enabled: false },
    plotOptions: { radar: { polygons: { strokeColors: grid, connectorColors: grid } } },
    yaxis: { labels: { formatter: v => v.toFixed(0) + '%', style: { colors: [fg] } } },
    xaxis: { labels: { style: { colors: conceptos.value.map(() => fg), fontSize: '11px' } } },
    legend: leyenda(),
    tooltip: { y: { formatter: v => v.toFixed(2) + '%' } },
  })
  chRadar.render()
}

function pintarMix() {
  chMix?.destroy(); chMix = null
  if (!refMix.value || !sedes.value.length) return
  const { fg, grid } = ejes()

  // La base aquí es el recaudo (tarjetas + efectivo + otros), no la venta:
  // es la única forma de que el reparto entre medios sume 100%.
  const medios = [
    { key: 'tarjetas', label: 'Tarjetas',     color: '#4f46e5' },
    { key: 'efectivo', label: 'Efectivo',     color: '#15803d' },
    { key: 'otros',    label: 'Otros medios', color: '#b8720b' },
  ]
  const recaudo = (s) => medios.reduce((t, m) => t + (Number(s[m.key]) || 0), 0)

  chMix = new ApexCharts(refMix.value, {
    ...baseChart({ type: 'bar', height: 360, stacked: true, stackType: '100%' }),
    series: medios.map(m => ({
      name: m.label, color: m.color,
      data: sedes.value.map(s => Number(s[m.key]) || 0),
    })),
    plotOptions: { bar: { horizontal: true, barHeight: '62%', borderRadius: 3 } },
    dataLabels: {
      enabled: true, style: { fontSize: '11px', fontWeight: 700, colors: ['#fff'] },
      formatter: (v) => (v >= 7 ? v.toFixed(0) + '%' : ''),
    },
    xaxis: {
      categories: sedes.value.map(s => s.nombre),
      labels: { style: { colors: fg, fontSize: '11px' }, formatter: v => Math.round(v) + '%' },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: fg, fontSize: '11px' } } },
    grid: { borderColor: grid, strokeDashArray: 4 },
    legend: leyenda(),
    tooltip: {
      y: {
        formatter: (v, { seriesIndex, dataPointIndex }) => {
          const s = sedes.value[dataPointIndex]
          const tot = recaudo(s)
          const p = tot > 0 ? (v / tot) * 100 : 0
          return `${money(v)} · ${p.toFixed(1)}% del recaudo`
        },
      },
    },
  })
  chMix.render()
}

function pintarHeat() {
  chHeat?.destroy(); chHeat = null
  if (!refHeat.value || !sedes.value.length) return
  const { fg } = ejes()

  // Filas invertidas: ApexCharts dibuja la primera serie abajo, y se lee
  // mejor con los conceptos en el mismo orden que la tabla.
  const filas = [...conceptos.value].reverse()

  chHeat = new ApexCharts(refHeat.value, {
    ...baseChart({ type: 'heatmap', height: 40 * filas.length + 90 }),
    series: filas.map(c => ({
      name: c.label,
      data: sedes.value.map(s => ({ x: s.nombre, y: Number(pctDe(s, c.key).toFixed(2)) })),
    })),
    plotOptions: {
      heatmap: {
        radius: 4, enableShades: true, shadeIntensity: 0.55,
        colorScale: {
          ranges: [
            { from: 0,     to: 0.001, color: '#94a3b8', name: 'sin dato' },
            { from: 0.001, to: 2,     color: '#bbf7d0' },
            { from: 2,     to: 6,     color: '#86efac' },
            { from: 6,     to: 12,    color: '#fde047' },
            { from: 12,    to: 25,    color: '#fb923c' },
            { from: 25,    to: 1e6,   color: '#ef4444' },
          ],
        },
      },
    },
    dataLabels: {
      enabled: true,
      style: { fontSize: '11px', fontWeight: 700, colors: ['#1b1815'] },
      formatter: v => (v > 0 ? v.toFixed(1) + '%' : '—'),
    },
    xaxis: {
      type: 'category',
      labels: { style: { colors: fg, fontSize: '11px' } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: fg, fontSize: '11px' } } },
    legend: { show: false },
    tooltip: { y: { formatter: v => v.toFixed(2) + '% sobre ' + baseLabel.value.toLowerCase() } },
  })
  chHeat.render()
}

function pintarEvolucion() {
  chEvolucion?.destroy(); chEvolucion = null
  if (!refEvolucion.value || mesesDisponibles.value.length < 2) return
  const { fg, grid } = ejes()

  const meses = mesesDisponibles.value
  const porSede = new Map()
  for (const r of serie.value) {
    if (!porSede.has(r.ccosto)) porSede.set(r.ccosto, new Map())
    porSede.get(r.ccosto).set(r.periodo, r)
  }

  const conceptoActual = conceptos.value.find(c => c.key === metrica.value)

  chEvolucion = new ApexCharts(refEvolucion.value, {
    ...baseChart({ type: 'line', height: 360 }),
    series: sedes.value.map(s => ({
      name: s.nombre,
      color: colorSede(s.ccosto),
      data: meses.map(m => {
        const fila = porSede.get(s.ccosto)?.get(m)
        // Sin ventas ese mes se corta la línea en vez de dibujar un cero
        // que parecería una caída real del indicador.
        return fila ? Number(pctDe(fila, metrica.value).toFixed(2)) : null
      }),
    })),
    stroke: { width: 2.5, curve: 'smooth' },
    markers: { size: 4, strokeColors: esOscuro.value ? '#1d1a15' : '#fff', strokeWidth: 2, hover: { size: 6 } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: meses.map(labelMes),
      labels: { style: { colors: fg, fontSize: '11px' } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: fg }, formatter: v => (v === null ? '—' : v.toFixed(1) + '%') },
      title: {
        text: `${conceptoActual?.label || ''} · % sobre ${baseLabel.value.toLowerCase()}`,
        style: { color: fg, fontSize: '11px', fontWeight: 600 },
      },
    },
    grid: { borderColor: grid, strokeDashArray: 4 },
    legend: leyenda(),
    tooltip: { shared: true, y: { formatter: v => (v === null ? 'sin ventas' : v.toFixed(2) + '%') } },
  })
  chEvolucion.render()
}

async function pintarTodo() {
  await nextTick()
  pintarConceptos()
  pintarRadar()
  pintarMix()
  pintarHeat()
  pintarEvolucion()
}

function destruirTodo() {
  for (const ch of [chConceptos, chRadar, chMix, chHeat, chEvolucion]) ch?.destroy()
  chConceptos = chRadar = chMix = chHeat = chEvolucion = null
}

// ── Carga ─────────────────────────────────────────────────────────
async function cargar() {
  if (!empresa.value) return
  loading.value = true
  destruirTodo()
  try {
    const r = await api.get('/gerencia/composicion-ventas', {
      params: { empresa: empresa.value, desde: desde.value, hasta: hasta.value },
    })
    data.value = r.data?.success === false ? null : r.data
  } catch (e) {
    console.error('Error cargando composición de ventas:', e)
    data.value = null
  } finally {
    loading.value = false
  }
  await pintarTodo()
}

// Cambiar la base o la métrica solo redibuja: los pesos ya están en memoria.
watch(base, pintarTodo)
watch(metrica, pintarEvolucion)
watch(esOscuro, pintarTodo)

onMounted(cargar)
onBeforeUnmount(destruirTodo)
</script>

<style scoped>
.cv-wrap { display: flex; flex-direction: column; gap: var(--space-md); }

/* ── Controles del header ── */
.cv-controles { display: flex; align-items: center; gap: var(--space-sm); flex-wrap: wrap; }
.cv-fechas { display: flex; align-items: center; gap: 6px; }
.cv-date {
  height: 34px; padding: 0 10px; border-radius: var(--radius-sm);
  font-size: var(--text-sm); outline: none;
  border: 1px solid var(--border-strong);
  background: var(--surface); color: var(--ink-900);
}
.cv-date:focus-visible { border-color: var(--indigo); box-shadow: 0 0 0 3px var(--indigo-wash); }
.cv-date-sep { color: var(--ink-400); font-size: var(--text-sm); }

.cv-presets { display: flex; gap: 4px; }
.cv-preset {
  padding: 6px 11px; border-radius: var(--radius-sm);
  font-size: var(--text-xs); font-weight: 700; cursor: pointer;
  border: 1px solid var(--border); background: transparent; color: var(--ink-600);
  transition: color var(--dur-fast) var(--ease-out),
              border-color var(--dur-fast) var(--ease-out),
              background var(--dur-fast) var(--ease-out);
}
.cv-preset:hover { border-color: var(--indigo); color: var(--indigo); background: var(--indigo-wash); }
.cv-preset:active { transform: scale(0.97); }

/* ── Estados ── */
.cv-estado {
  display: flex; flex-direction: column; align-items: center; gap: var(--space-sm);
  padding: var(--space-3xl) var(--space-md);
  color: var(--ink-400); font-size: var(--text-base);
}

/* ── Selector de base ── */
.cv-base {
  display: flex; align-items: center; gap: var(--space-sm); flex-wrap: wrap;
  padding: 10px var(--space-md);
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-md);
}
.cv-base-lbl {
  display: flex; align-items: center; gap: 6px;
  font-size: var(--text-sm); font-weight: 600; color: var(--ink-600);
}
.cv-seg {
  display: flex; gap: 2px; padding: 3px;
  background: var(--surface-sunken); border-radius: var(--radius-sm);
}
.cv-seg-btn {
  padding: 5px 14px; border: none; background: transparent; cursor: pointer;
  border-radius: 4px; font-size: var(--text-sm); font-weight: 700; color: var(--ink-600);
  transition: background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
}
.cv-seg-btn:hover { color: var(--ink-900); }
.cv-seg-btn--on { background: var(--surface); color: var(--indigo); box-shadow: var(--shadow-sm); }
.cv-base-val { margin-left: auto; font-size: var(--text-sm); color: var(--ink-600); font-variant-numeric: tabular-nums; }

/* ── KPIs ── */
.cv-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(158px, 1fr)); gap: var(--space-sm); }
.cv-kpi {
  padding: var(--space-md);
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-md);
}
.cv-kpi--ancla { border-color: var(--indigo); background: var(--indigo-wash); }
.cv-kpi-lbl {
  font-size: 10px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase;
  color: var(--ink-600);
}
.cv-kpi-val {
  font-size: var(--text-xl); font-weight: 800; margin-top: 3px;
  font-variant-numeric: tabular-nums; color: var(--ink-900);
}
.cv-kpi-foot { font-size: var(--text-xs); color: var(--ink-600); margin-top: 2px; font-variant-numeric: tabular-nums; }

/* ── Card ── */
.cv-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); overflow: hidden;
}
.cv-card-head {
  display: flex; align-items: center; gap: var(--space-xs); flex-wrap: wrap;
  padding: 12px var(--space-md); border-bottom: 1px solid var(--border);
  font-size: var(--text-xs); font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase;
  color: var(--ink-600);
}
.cv-card-note {
  font-weight: 500; text-transform: none; letter-spacing: 0;
  font-size: var(--text-xs); color: var(--ink-600);
}
.cv-chart { padding: var(--space-xs) var(--space-sm) var(--space-sm); min-height: 300px; }
.cv-chart--alto { min-height: 340px; }
.cv-duo { display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: var(--space-md); }

/* ── Brechas ── */
.cv-brechas {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-md); padding: var(--space-md);
}
.cv-brecha { display: flex; flex-direction: column; gap: 6px; }
.cv-brecha-top { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-xs); }
.cv-brecha-nom { font-size: var(--text-base); font-weight: 700; color: var(--ink-900); }
.cv-brecha-gap {
  font-size: var(--text-sm); font-weight: 800; color: var(--gold);
  font-variant-numeric: tabular-nums;
}
.cv-brecha-barra {
  position: relative; height: 7px; border-radius: var(--radius-full);
  background: var(--surface-sunken); overflow: hidden;
}
.cv-brecha-rango {
  position: absolute; top: 0; bottom: 0;
  border-radius: var(--radius-full);
  background: linear-gradient(90deg, var(--success), var(--gold), var(--error));
}
.cv-brecha-extremos {
  display: flex; justify-content: space-between; gap: var(--space-xs);
  font-size: var(--text-xs); color: var(--ink-600);
}
.cv-brecha-extremos strong { color: var(--ink-700); font-variant-numeric: tabular-nums; }
.cv-brecha-extremos span:last-child { text-align: right; }

/* ── Selector de métrica ── */
.cv-metric-sel { display: flex; gap: 4px; flex-wrap: wrap; margin-left: auto; }
.cv-chip {
  padding: 4px 10px; border-radius: var(--radius-full);
  font-size: 10px; font-weight: 700; letter-spacing: 0.3px; cursor: pointer;
  border: 1px solid var(--border); background: transparent; color: var(--ink-600);
  text-transform: none;
  transition: background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out),
              border-color var(--dur-fast) var(--ease-out);
}
.cv-chip:hover { border-color: var(--indigo); color: var(--indigo); }
.cv-chip--on { background: var(--indigo); border-color: var(--indigo); color: #fff; }
.cv-chip:active { transform: scale(0.97); }

/* ── Tabla ── */
.cv-scroll { overflow-x: auto; }
.cv-table { width: 100%; border-collapse: collapse; font-size: var(--text-base); }
.cv-table th {
  padding: 10px 14px; font-size: 10px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase;
  color: var(--ink-600); background: var(--surface-sunken);
  border-bottom: 1.5px solid var(--border-strong);
  white-space: nowrap;
}
.th-concepto { text-align: left; min-width: 190px; }
.th-sede, .th-total { text-align: right; min-width: 130px; }
.th-total { color: var(--indigo); }
.th-punto {
  display: inline-block; width: 7px; height: 7px; border-radius: 50%;
  margin-right: 5px; vertical-align: middle;
}

.cv-table td { padding: 8px 14px; border-bottom: 1px solid var(--border); }
.td-concepto { font-weight: 600; white-space: nowrap; color: var(--ink-900); }
.td-indent { padding-left: 26px !important; font-weight: 500; color: var(--ink-700); }
.td-num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.td-pct { display: block; font-weight: 700; color: var(--ink-900); }
.td-money { display: block; font-size: var(--text-xs); color: var(--ink-600); margin-top: 1px; }
.td-total { background: var(--indigo-wash); }
.td-total .td-pct { color: var(--indigo); }

.fila-base td { background: var(--surface-sunken); font-weight: 700; }
.fila-base .td-num { font-weight: 800; color: var(--ink-900); }
.fila-grupo td {
  padding: 7px 14px; font-size: 10px; font-weight: 800;
  letter-spacing: 0.6px; text-transform: uppercase;
  color: var(--ink-700); background: var(--surface-sunken);
}

.cel--peor  { background: var(--error-wash); }
.cel--peor  .td-pct { color: var(--error); }
.cel--mejor { background: var(--success-wash); }
.cel--mejor .td-pct { color: var(--success); }
.cel--dif   { background: var(--info-wash); }
.cel--dif   .td-pct { color: var(--info); }

.cv-nota {
  display: flex; align-items: flex-start; gap: 7px;
  padding: 11px var(--space-md); font-size: var(--text-xs); line-height: 1.55;
  color: var(--ink-600); border-top: 1px solid var(--border);
}

@media (prefers-reduced-motion: reduce) {
  .cv-preset, .cv-seg-btn, .cv-chip { transition: none; }
  .cv-preset:active, .cv-chip:active { transform: none; }
}

@media (max-width: 720px) {
  .cv-duo { grid-template-columns: 1fr; }
  .cv-controles { width: 100%; }
  .cv-base-val { margin-left: 0; width: 100%; }
}
</style>
