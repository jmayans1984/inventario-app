<template>
  <MainLayout>
    <div class="dash-wrap">

      <!-- ══════════════════════════════════════════════════════
           HERO: SALUDO + RELOJ + CLIMA REAL
      ══════════════════════════════════════════════════════ -->
      <div class="dx-hero">
        <div class="dx-hero-glow"></div>
        <div class="dx-hero-grid"></div>

        <div class="dx-hero-main">
          <!-- Saludo -->
          <div class="dx-greet">
            <div class="dx-greet-emoji">{{ greetingEmoji }}</div>
            <div>
              <div class="dx-greet-lbl">{{ greeting }},</div>
              <div class="dx-greet-name">{{ (authStore.userNombre || 'Usuario').split(' ')[0] }}</div>
              <div class="dx-greet-empresa">{{ authStore.empresaNombre || '' }}</div>
            </div>
          </div>

          <!-- Reloj -->
          <div class="dx-clock">
            <div class="dx-clock-time">{{ horaActual }}</div>
            <div class="dx-clock-date">{{ fechaLarga }}</div>
          </div>

          <!-- Clima actual (real) -->
          <div class="dx-weather">
            <template v-if="clima">
              <div class="dx-weather-icon">{{ clima.icono }}</div>
              <div>
                <div class="dx-weather-temp">{{ clima.temp }}°F</div>
                <div class="dx-weather-cond">{{ clima.condicion }}</div>
                <div class="dx-weather-loc">
                  <v-icon size="10" color="rgba(255,255,255,.5)">mdi-map-marker-outline</v-icon>
                  Orlando, FL
                </div>
              </div>
            </template>
            <template v-else-if="climaError">
              <div class="dx-weather-icon">🌐</div>
              <div class="dx-weather-cond" style="opacity:.6">Clima no disponible</div>
            </template>
            <template v-else>
              <div class="dx-weather-skel"></div>
            </template>
          </div>
        </div>

      </div>

      <!-- ══════════════════════════════════════════════════════
           HOY EN VIVO — se alimenta del SSE de Square
      ══════════════════════════════════════════════════════ -->
      <div v-if="vivoSedes.length" class="dx-band">
        <div class="dx-band-head">
          <span class="dx-pulse" :class="{ 'dx-pulse-off': !vivoConectado }"></span>
          <span class="dx-band-title">HOY EN VIVO</span>
          <span class="dx-band-note">
            {{ vivoConectado ? 'Square · en tiempo real' : 'Reconectando…' }}
          </span>
          <button class="dx-band-link" @click="irA('/tesoreria/procesos/ventas-vivo')">Ver detalle</button>
        </div>
        <div class="dx-vivo">
          <div v-for="sd in vivoSedes" :key="sd.codigo" class="dx-vivo-sede">
            <div class="dx-vivo-nombre">{{ sd.nombre }}</div>
            <div class="dx-vivo-monto">{{ fmt(sd.ventas) }}</div>
            <div class="dx-vivo-pie">
              <span>{{ sd.ordenes }} {{ sd.ordenes === 1 ? 'orden' : 'órdenes' }}</span>
              <span v-if="sd.pctDelPromedio != null" class="dx-vivo-pct" :class="clasePct(sd.pctDelPromedio)">
                {{ Math.round(sd.pctDelPromedio) }}% de un {{ nombreDiaHoy }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════
           COMPARATIVO DEL MES — solo cifras exactas de Square.
           Materia prima y utilidad quedan fuera a proposito: dependen
           de la toma fisica de inventario, asi que no son un dato
           cerrado y no deben presentarse como si lo fueran.
      ══════════════════════════════════════════════════════ -->
      <div v-if="comparativo" class="dx-band">
        <div class="dx-band-head">
          <span class="dx-band-title">MES CONTRA MES</span>
          <span class="dx-band-note">
            Del 1 al {{ comparativo.hastaDia }} de {{ etiquetaComp }}
          </span>
        </div>

        <!-- Las brutas van aparte: en el mismo eje que los demas conceptos
             los aplastarian y no se veria nada. -->
        <div class="dx-comp-titular">
          <div class="dx-comp-tit-lbl">VENTAS BRUTAS</div>
          <div class="dx-comp-tit-val">{{ fmt(comparativo.brutas.actual) }}</div>
          <div class="dx-comp-tit-vs">
            <span :class="claseVar(comparativo.brutas.variacion)">
              <v-icon size="14">{{ (comparativo.brutas.variacion || 0) >= 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}</v-icon>
              {{ textoVar(comparativo.brutas.variacion) }}
            </span>
            <span class="dx-comp-tit-ant">
              {{ fmt(comparativo.brutas.anterior) }} el mes pasado al mismo día
            </span>
          </div>
        </div>

        <div class="dx-comp-wrap">
          <div ref="compRef" class="dx-comp"></div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════
           KPIs FINANCIEROS CON TENDENCIA
      ══════════════════════════════════════════════════════ -->
      <div class="dx-kpis">
        <div class="dx-kpi stagger-in" style="--kc:var(--success); --stagger-index:0" @click="irA('/tesoreria/reportes/ventas-periodo')">
          <div class="dx-kpi-head">
            <span class="dx-kpi-lbl">VENTAS DEL MES</span>
            <div class="dx-kpi-ic" style="background:var(--success-wash)">
              <v-icon size="17" color="var(--success)">mdi-cash-register</v-icon>
            </div>
          </div>
          <div class="dx-kpi-val">
            <span v-if="!cargando">{{ fmt(resumen?.ventasMes?.total) }}</span>
            <span v-else class="dx-skel"></span>
          </div>
          <div v-if="!cargando && resumen?.ventasMes?.variacion !== null" class="dx-kpi-trend" :class="trendClass(resumen?.ventasMes?.variacion)">
            <v-icon size="13">{{ trendIcon(resumen?.ventasMes?.variacion) }}</v-icon>
            {{ Math.abs(resumen?.ventasMes?.variacion || 0).toFixed(1) }}% vs mes anterior
          </div>
        </div>

        <div class="dx-kpi stagger-in" style="--kc:var(--error); --stagger-index:1" @click="irA('/contabilidad/procesos/gastos')">
          <div class="dx-kpi-head">
            <span class="dx-kpi-lbl">GASTOS DEL MES</span>
            <div class="dx-kpi-ic" style="background:var(--error-wash)">
              <v-icon size="17" color="var(--error)">mdi-cart-arrow-down</v-icon>
            </div>
          </div>
          <div class="dx-kpi-val">
            <span v-if="!cargando">{{ fmt(resumen?.gastos?.total) }}</span>
            <span v-else class="dx-skel"></span>
          </div>
          <div v-if="!cargando && resumen?.gastos?.variacion !== null" class="dx-kpi-trend" :class="trendClass(resumen?.gastos?.variacion, true)">
            <v-icon size="13">{{ trendIcon(resumen?.gastos?.variacion) }}</v-icon>
            {{ Math.abs(resumen?.gastos?.variacion || 0).toFixed(1) }}% vs mes anterior
          </div>
        </div>

        <div class="dx-kpi stagger-in" style="--kc:var(--gold); --stagger-index:3" @click="irA('/tesoreria/procesos/facturas-venta')">
          <div class="dx-kpi-head">
            <span class="dx-kpi-lbl">FACTURAS PENDIENTES</span>
            <div class="dx-kpi-ic" style="background:var(--gold-wash)">
              <v-icon size="17" color="var(--gold)">mdi-file-clock-outline</v-icon>
            </div>
          </div>
          <div class="dx-kpi-val">
            <span v-if="!cargando">{{ resumen?.facturasPend?.cantidad || 0 }}</span>
            <span v-else class="dx-skel"></span>
          </div>
          <div v-if="!cargando" class="dx-kpi-trend dx-trend-neutral">
            {{ fmt(resumen?.facturasPend?.valor) }} por cobrar
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════
           CURVA DEL MES — acumulado contra el mes anterior
      ══════════════════════════════════════════════════════ -->
      <div class="dx-band">
        <div class="dx-band-head">
          <span class="dx-band-title">VENTAS ACUMULADAS</span>
          <span class="dx-band-note">{{ etiquetaCurva }}</span>
          <span v-if="deltaCurva !== null" class="dx-curva-delta" :class="deltaCurva >= 0 ? 'dx-trend-up' : 'dx-trend-down'">
            <v-icon size="14">{{ deltaCurva >= 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}</v-icon>
            {{ Math.abs(deltaCurva).toFixed(1) }}% al mismo día
          </span>
        </div>
        <div class="dx-curva-wrap">
          <div ref="curvaRef" class="dx-curva"></div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════
           REQUIERE ATENCIÓN — ordenado por impacto en dinero
      ══════════════════════════════════════════════════════ -->
      <div v-if="atencion.length" class="dx-band">
        <div class="dx-band-head">
          <span class="dx-band-title">REQUIERE ATENCIÓN</span>
          <span class="dx-band-note">Ordenado por impacto en dinero</span>
        </div>
        <div
          v-for="a in atencion"
          :key="a.id"
          class="dx-atencion"
          :class="{ 'dx-atencion-click': a.ruta }"
          @click="a.ruta && irA(a.ruta)"
        >
          <span class="dx-atencion-sev" :style="{ background: a.color }"></span>
          <div class="dx-atencion-cuerpo">
            <div class="dx-atencion-titulo">{{ a.titulo }}</div>
            <div class="dx-atencion-desc">{{ a.descripcion }}</div>
          </div>
          <span class="dx-atencion-monto" :style="{ color: a.color }">
            {{ a.monto ? fmt(a.monto) : '—' }}
          </span>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════
           CUERPO: CENTRO DE ALERTAS + ACCESOS + ACTIVIDAD
      ══════════════════════════════════════════════════════ -->
      <div class="dx-body dx-body-solo">

        <!-- ── Centro de alertas ── -->
        <div class="dx-panel dx-alerts">
          <div class="dx-panel-header">
            <div class="dx-panel-title">
              <div class="dx-panel-title-ic" style="background:var(--error-wash)">
                <v-icon size="15" color="#ef4444">mdi-bell-ring-outline</v-icon>
              </div>
              CENTRO DE ALERTAS
              <span v-if="alertas.length" class="dx-alert-count">{{ alertas.length }}</span>
            </div>
          </div>

          <!-- Chips resumen por tipo (acciones rápidas) -->
          <div v-if="chipsAccion.length" class="dx-chips">
            <button
              v-for="ch in chipsAccion"
              :key="ch.tipo"
              class="dx-chip"
              :style="{ '--cc': ch.color }"
              @click="ch.accion"
            >
              <v-icon size="13" :color="ch.color">{{ ch.icono }}</v-icon>
              <span class="dx-chip-lbl">{{ ch.label }}</span>
              <span class="dx-chip-num">{{ ch.count }}</span>
            </button>
          </div>

          <!-- Lista -->
          <div v-if="alertas.length === 0" class="dx-alerts-empty">
            <div class="dx-alerts-empty-ic">
              <v-icon size="26" color="#10b981">mdi-check-all</v-icon>
            </div>
            <div class="dx-alerts-empty-title">Todo al día</div>
            <div class="dx-alerts-empty-sub">No tienes alertas pendientes</div>
          </div>
          <div v-else class="dx-alert-list">
            <div
              v-for="(a, idx) in alertasVisibles"
              :key="a.id || idx"
              class="dx-alert-row"
            >
              <div class="dx-alert-ic" :style="{ background: colorTipo(a.tipo) + '18' }">
                <v-icon size="15" :color="colorTipo(a.tipo)">{{ iconoTipo(a.tipo) }}</v-icon>
              </div>
              <div class="dx-alert-info">
                <div class="dx-alert-title">{{ a.titulo }}</div>
                <div v-if="a.descripcion" class="dx-alert-desc">{{ a.descripcion }}</div>
              </div>
              <span class="dx-alert-hora">{{ a.hora }}</span>
              <button class="dx-alert-x" title="Descartar" @click="eliminarAlerta(alertas.indexOf(a))">
                <v-icon size="14">mdi-close</v-icon>
              </button>
            </div>
            <button v-if="alertas.length > limiteAlertas" class="dx-alert-more" @click="limiteAlertas += 10">
              Ver {{ Math.min(alertas.length - limiteAlertas, 10) }} más
              <v-icon size="13">mdi-chevron-down</v-icon>
            </button>
          </div>
        </div>

      </div>

    </div>

    <ActualizacionesModal v-model:mostrar="mostrarActualizaciones" />
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import ApexCharts from 'apexcharts'
import { useRouter } from 'vue-router'
import MainLayout from '../components/layouts/MainLayout.vue'
import ActualizacionesModal from '../components/ActualizacionesModal.vue'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'
import { notificacionesService } from '../services/notificaciones.service'

const router    = useRouter()
const authStore = useAuthStore()
const irA = (ruta) => router.push(ruta)

// ── Reloj en tiempo real ──────────────────────────────────────
const ahora = ref(new Date())
let timerReloj = null
onMounted(() => { timerReloj = setInterval(() => { ahora.value = new Date() }, 1000) })
onUnmounted(() => { clearInterval(timerReloj) })

const horaActual = computed(() =>
  ahora.value.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
)
const fechaLarga = computed(() => {
  const s = ahora.value.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
})
const greeting = computed(() => {
  const h = ahora.value.getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
})
const greetingEmoji = computed(() => {
  const h = ahora.value.getHours()
  if (h < 12) return '🌤️'
  if (h < 18) return '☀️'
  return '🌙'
})

// ── Clima REAL — Open-Meteo (gratis, sin API key) ─────────────
// Coordenadas: Orlando, FL
const clima = ref(null)
const climaError = ref(false)

// Mapa de códigos WMO → icono + descripción en español
function wmo(code) {
  if (code === 0)                 return { icono: '☀️', condicion: 'Despejado' }
  if (code === 1)                 return { icono: '🌤️', condicion: 'Mayormente despejado' }
  if (code === 2)                 return { icono: '⛅', condicion: 'Parcialmente nublado' }
  if (code === 3)                 return { icono: '☁️', condicion: 'Nublado' }
  if (code === 45 || code === 48) return { icono: '🌫️', condicion: 'Niebla' }
  if (code >= 51 && code <= 57)   return { icono: '🌦️', condicion: 'Llovizna' }
  if (code >= 61 && code <= 67)   return { icono: '🌧️', condicion: 'Lluvia' }
  if (code >= 71 && code <= 77)   return { icono: '🌨️', condicion: 'Nieve' }
  if (code >= 80 && code <= 82)   return { icono: '🌧️', condicion: 'Aguaceros' }
  if (code >= 95)                 return { icono: '⛈️', condicion: 'Tormenta' }
  return { icono: '🌡️', condicion: '—' }
}

async function cargarClima() {
  try {
    const url = 'https://api.open-meteo.com/v1/forecast'
      + '?latitude=28.5384&longitude=-81.3789'
      + '&current=temperature_2m,weather_code'
      + '&temperature_unit=fahrenheit&timezone=America%2FNew_York&forecast_days=1'
    const res = await fetch(url)
    const json = await res.json()

    const w = wmo(json.current?.weather_code)
    clima.value = {
      temp: Math.round(json.current?.temperature_2m || 0),
      icono: w.icono,
      condicion: w.condicion,
    }

  } catch (e) {
    console.error('cargarClima:', e)
    climaError.value = true
  }
}

// ── Resumen financiero ────────────────────────────────────────
const resumen  = ref(null)
const cargando = ref(true)
const empresa = computed(() =>
  authStore.empresa || authStore.user?.empresa || localStorage.getItem('empresaActual') || ''
)

async function cargarResumen() {
  if (!empresa.value) { cargando.value = false; return }
  try {
    const res = await api.get('/dashboard/resumen', { params: { empresa: empresa.value } })
    if (res.data?.success) resumen.value = res.data.data
  } catch (e) { console.error('dashboard:', e) }
  finally { cargando.value = false }
}

function trendClass(v, invertir = false) {
  if (v === null || v === undefined) return 'dx-trend-neutral'
  const positivo = invertir ? v < 0 : v >= 0
  return positivo ? 'dx-trend-up' : 'dx-trend-down'
}
function trendIcon(v) {
  return (v || 0) >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'
}

// ══════════════════════════════════════════════════════════════
// CURVA DEL MES + NÓMINA PENDIENTE
// ══════════════════════════════════════════════════════════════
const panel    = ref(null)
const curvaRef = ref(null)
let chartCurva = null

const etiquetaCurva = computed(() => {
  const c = panel.value?.curva
  if (!c) return ''
  const cap = (t) => (t || '').charAt(0).toUpperCase() + (t || '').slice(1)
  return `${cap(c.etiquetaActual)} vs ${cap(c.etiquetaAnterior)}`
})

// Diferencia contra el mes anterior EN EL MISMO DIA del mes, no contra su
// cierre: comparar 24 dias contra 31 siempre daria negativo.
const deltaCurva = computed(() => {
  const c = panel.value?.curva
  if (!c?.actual?.length) return null
  let i = -1
  for (let k = c.actual.length - 1; k >= 0; k--) {
    if (c.actual[k] != null) { i = k; break }
  }
  if (i < 0) return null
  const a = c.actual[i], b = c.anterior[i]
  if (!b) return null
  return ((a - b) / b) * 100
})

// Paleta de los graficos. Naranja para el mes en curso, indigo para el
// anterior: es el par mas seguro para daltonismo (rojo-verde no los
// confunde) y los cuatro tonos estan medidos contra su fondo.
//
//   claro  naranja #ea580c 3.56:1 · indigo #4f46e5 6.29:1
//   oscuro naranja #fb923c 7.66:1 · indigo #818cf8 5.81:1
//
// El minimo para lineas y barras con significado es 3:1. El gris que habia
// antes para el mes anterior daba 2.73:1 en claro — por debajo del minimo,
// y por eso se perdia contra el fondo blanco.
function paletaGrafico() {
  const oscuro = esOscuro()
  return {
    oscuro,
    actual:   oscuro ? '#fb923c' : '#ea580c',
    anterior: oscuro ? '#818cf8' : '#4f46e5',
    fg:       oscuro ? '#b3aa9a' : '#6b6459',
    grid:     oscuro ? 'rgba(245,241,232,.07)' : 'rgba(27,24,21,.07)',
  }
}

function esOscuro() {
  return document.documentElement.classList.contains('v-theme--dark') ||
         document.body.classList.contains('v-theme--dark')
}

function renderCurva() {
  const c = panel.value?.curva
  if (!curvaRef.value || !c?.dias?.length) return
  chartCurva?.destroy()
  const { oscuro, actual, anterior, fg, grid } = paletaGrafico()
  const [etA, etB] = etiquetaCurva.value.split(' vs ')

  chartCurva = new ApexCharts(curvaRef.value, {
    chart: {
      type: 'area', height: 240, toolbar: { show: false },
      fontFamily: "'Plus Jakarta Sans', sans-serif", background: 'transparent',
      animations: { enabled: true, speed: 500 },
    },
    theme: { mode: oscuro ? 'dark' : 'light' },
    series: [
      { name: etA || 'Este mes',     data: c.actual },
      { name: etB || 'Mes anterior', data: c.anterior },
    ],
    xaxis: {
      categories: c.dias,
      labels: { style: { colors: fg, fontSize: '11px' } },
      axisBorder: { show: false }, axisTicks: { show: false },
      tickAmount: 10,
    },
    yaxis: {
      labels: {
        style: { colors: fg, fontSize: '11px' },
        formatter: (v) => '$' + Math.round(v / 1000) + 'k',
      },
    },
    // El mes en curso va solido y con relleno; el anterior es la referencia,
    // asi que va punteado y sin relleno para que no compitan.
    colors: [actual, anterior],
    stroke: { curve: 'smooth', width: [3, 2], dashArray: [0, 5] },
    fill: {
      type: ['gradient', 'solid'],
      opacity: [1, 0],
      gradient: { shadeIntensity: 1, opacityFrom: 0.32, opacityTo: 0.03, stops: [0, 100] },
    },
    grid: { borderColor: grid, strokeDashArray: 4, padding: { left: 4, right: 8 } },
    legend: { show: true, position: 'top', horizontalAlign: 'right', labels: { colors: fg }, markers: { radius: 3 } },
    dataLabels: { enabled: false },
    tooltip: {
      shared: true, intersect: false,
      x: { formatter: (v) => 'Día ' + v },
      y: { formatter: (v) => (v == null ? '—' : fmt(v)) },
    },
  })
  chartCurva.render()
}

async function cargarPanel() {
  if (!empresa.value) return
  try {
    const res = await api.get('/dashboard/panel', { params: { empresa: empresa.value } })
    if (res.data?.success) {
      panel.value = res.data.data
      await nextTick()
      renderCurva()
      renderComp()
    }
  } catch (e) { console.error('panel:', e) }
}

// ══════════════════════════════════════════════════════════════
// COMPARATIVO MES CONTRA MES
// ══════════════════════════════════════════════════════════════
const compRef = ref(null)
let chartComp = null

const comparativo = computed(() => panel.value?.comparativo || null)

const etiquetaComp = computed(() => {
  const c = panel.value?.curva
  if (!c) return ''
  return `${c.etiquetaActual} vs ${c.etiquetaAnterior}`
})

function claseVar(v) {
  if (v === null || v === undefined) return 'dx-trend-neutral'
  return v >= 0 ? 'dx-trend-up' : 'dx-trend-down'
}
function textoVar(v) {
  if (v === null || v === undefined) return 'sin base para comparar'
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`
}

function renderComp() {
  const c = comparativo.value
  if (!compRef.value || !c?.conceptos?.length) return
  chartComp?.destroy()
  const { oscuro, actual, anterior, fg, grid } = paletaGrafico()
  const [etA, etB] = etiquetaComp.value.split(' vs ')

  // De mayor a menor segun el mes en curso: lo que mas pesa, arriba.
  const ord = [...c.conceptos].sort((a, b) => b.actual - a.actual)

  chartComp = new ApexCharts(compRef.value, {
    chart: {
      type: 'bar', height: 300, toolbar: { show: false },
      fontFamily: "'Plus Jakarta Sans', sans-serif", background: 'transparent',
      animations: { enabled: true, speed: 450 },
    },
    theme: { mode: oscuro ? 'dark' : 'light' },
    series: [
      { name: etA || 'Este mes',     data: ord.map(x => x.actual) },
      { name: etB || 'Mes anterior', data: ord.map(x => x.anterior) },
    ],
    // Barras horizontales: las etiquetas ("Comisiones delivery") no caben
    // bajo una barra vertical sin girarse o cortarse.
    plotOptions: { bar: { horizontal: true, barHeight: '68%', borderRadius: 3, borderRadiusApplication: 'end' } },
    colors: [actual, anterior],
    xaxis: {
      categories: ord.map(x => x.label),
      labels: {
        style: { colors: fg, fontSize: '11px' },
        formatter: (v) => '$' + Math.round(Number(v) / 1000) + 'k',
      },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: fg, fontSize: '11.5px' } } },
    grid: { borderColor: grid, strokeDashArray: 4 },
    legend: { position: 'top', horizontalAlign: 'right', labels: { colors: fg }, markers: { radius: 3 } },
    dataLabels: { enabled: false },
    tooltip: {
      shared: true, intersect: false,
      y: { formatter: (v) => fmt(v) },
    },
  })
  chartComp.render()
}

// ══════════════════════════════════════════════════════════════
// REQUIERE ATENCIÓN — lo mismo de siempre, pero ordenado por plata
// ══════════════════════════════════════════════════════════════
const atencion = computed(() => {
  const out = []
  const np = panel.value?.nominaPendiente

  if (np?.semanas > 0) {
    const n = np.semanas
    out.push({
      id: 'nomina-pendiente',
      titulo: `${n} semana${n > 1 ? 's' : ''} de nómina sin liquidar`,
      descripcion: 'El gasto todavía no pesa en el mes, así que la utilidad se ve mejor de lo que es',
      monto: np.montoEstimado,
      color: 'var(--error)',
      ruta: '/nomina/procesos/liquidacion',
    })
  }

  const fp = resumen.value?.facturasPend
  if (fp?.cantidad > 0) {
    out.push({
      id: 'facturas',
      titulo: `${fp.cantidad} factura${fp.cantidad > 1 ? 's' : ''} pendiente${fp.cantidad > 1 ? 's' : ''} de cobro`,
      descripcion: 'Cuentas por cobrar abiertas',
      monto: fp.valor,
      color: 'var(--warning)',
      ruta: '/tesoreria/procesos/facturas-venta',
    })
  }

  // Las comisiones de delivery no existian el mes pasado y ahora si: es un
  // costo nuevo que conviene ver, no una desviacion contra una meta.
  const cd = comparativo.value?.conceptos?.find(x => x.clave === 'comDelivery')
  if (cd?.actual > 0 && cd.variacion === null) {
    out.push({
      id: 'com-delivery',
      titulo: 'Comisiones de delivery, nuevas este mes',
      descripcion: 'El mes pasado no hubo. Sale del sobreprecio de las plataformas',
      monto: cd.actual,
      color: 'var(--warning)',
      ruta: '/contabilidad/reportes/estado-resultados',
    })
  }

  return out.sort((a, b) => (b.monto || 0) - (a.monto || 0))
})

// ══════════════════════════════════════════════════════════════
// HOY EN VIVO — mismo SSE que alimenta Ventas en Vivo
// ══════════════════════════════════════════════════════════════
const vivoSedes     = ref([])
const vivoConectado = ref(false)
let fuenteVivo = null

const nombreDiaHoy = computed(() =>
  ahora.value.toLocaleDateString('es-CO', { weekday: 'long' })
)

function clasePct(p) {
  if (p >= 100) return 'dx-pct-ok'
  if (p >= 85)  return 'dx-pct-warn'
  return 'dx-pct-bad'
}

function conectarVivo() {
  if (!empresa.value) return
  const base = api.defaults.baseURL || ''
  try {
    fuenteVivo = new EventSource(`${base}/square/vivo/stream?empresa=${encodeURIComponent(empresa.value)}`)
    fuenteVivo.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data)
        vivoConectado.value = true
        vivoSedes.value = (d.sedes || []).filter(x => x.ventas > 0)
      } catch { /* trama incompleta: se ignora y se espera la siguiente */ }
    }
    // Si Square no esta configurado o la conexion cae, la franja simplemente
    // no aparece: es informacion extra, no debe romper el panel.
    fuenteVivo.onerror = () => { vivoConectado.value = false }
  } catch (e) {
    console.error('vivo:', e)
  }
}

// ── Alertas ───────────────────────────────────────────────────
const alertas = ref([])
const limiteAlertas = ref(6)
const mostrarActualizaciones = ref(false)

const alertasVisibles = computed(() => alertas.value.slice(0, limiteAlertas.value))

const TIPO_META = {
  'DESPACHO_BODEGA': { color: '#8b5cf6', icono: 'mdi-truck-outline' },
  'ORDEN_COMPRA':    { color: '#3b82f6', icono: 'mdi-clipboard-list-outline' },
  'stock_bajo':      { color: '#f59e0b', icono: 'mdi-package-down' },
  'stock_fuera':     { color: '#ef4444', icono: 'mdi-package-variant-remove' },
  'alerta_general':  { color: '#a855f7', icono: 'mdi-alert-outline' },
  'reportes':        { color: '#22c55e', icono: 'mdi-chart-bar' },
  'actualizaciones': { color: '#0ea5e9', icono: 'mdi-lightning-bolt-outline' },
  'CRÍTICO':         { color: '#ef4444', icono: 'mdi-alert-circle-outline' },
  'ADVERTENCIA':     { color: '#f59e0b', icono: 'mdi-alert-outline' },
  'INFO':            { color: '#06b6d4', icono: 'mdi-information-outline' },
}
const colorTipo = (t) => TIPO_META[t]?.color || '#06b6d4'
const iconoTipo = (t) => TIPO_META[t]?.icono || 'mdi-information-outline'

// Chips de acción rápida basados en los tipos presentes
const chipsAccion = computed(() => {
  const defs = [
    { tipo: 'DESPACHO_BODEGA', label: 'Despachos',     accion: () => irA('/almacen/procesos/despachos') },
    { tipo: 'ORDEN_COMPRA',    label: 'Órd. Compra',   accion: () => irA('/produccion/procesos/ordenes-compra') },
    { tipo: 'stock_fuera',     label: 'Sin stock',     accion: () => irA('/almacen/reportes/alertas-stock') },
    { tipo: 'stock_bajo',      label: 'Stock bajo',    accion: () => irA('/almacen/reportes/alertas-stock') },
    { tipo: 'reportes',        label: 'Reportes',      accion: () => irA('/almacen/reportes/kardex') },
    { tipo: 'actualizaciones', label: 'Novedades',     accion: () => { mostrarActualizaciones.value = true } },
  ]
  return defs
    .map(d => ({ ...d, count: alertas.value.filter(a => a.tipo === d.tipo).length, color: colorTipo(d.tipo), icono: iconoTipo(d.tipo) }))
    .filter(d => d.count > 0)
})

async function cargarAlertas() {
  try {
    const res = await notificacionesService.obtenerNotificaciones()
    const notificaciones = res.data || []
    if (Array.isArray(notificaciones)) {
      alertas.value = notificaciones.map(n => ({
        id: n.id,
        tipo: n.tipo || 'INFO',
        titulo: n.titulo,
        descripcion: n.mensaje,
        hora: formatHora(n.fecha_creacion),
      }))
    }
  } catch (e) {
    console.error('Error cargando alertas:', e)
    alertas.value = []
  }
}

function formatHora(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function eliminarAlerta(idx) {
  const alerta = alertas.value[idx]
  if (!alerta?.id) return
  try {
    await notificacionesService.eliminarNotificacion(alerta.id)
    alertas.value.splice(idx, 1)
  } catch (e) {
    console.error('Error eliminando alerta:', e)
  }
}


onMounted(() => {
  cargarResumen()
  cargarAlertas()
  cargarClima()
  cargarPanel()
  conectarVivo()
})

onUnmounted(() => {
  // El SSE y el grafico sobreviven al desmontaje si no se sueltan a mano:
  // uno deja la conexion abierta, el otro un nodo y sus listeners.
  fuenteVivo?.close()
  chartCurva?.destroy()
  chartComp?.destroy()
})

// ── Formatters ────────────────────────────────────────────────
function fmt(val) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(parseFloat(val || 0))
}
</script>

<style scoped>
.dash-wrap { display: flex; flex-direction: column; gap: 18px; }

/* ══ HERO ═══════════════════════════════════════════════════ */
.dx-hero {
  position: relative; overflow: hidden;
  background: linear-gradient(130deg, var(--sidebar-bg) 0%, #241d13 55%, #1c1710 100%);
  border-radius: var(--radius-xl);
  padding: 26px 30px 20px;
  box-shadow: var(--shadow-lg);
}
.dx-hero-glow {
  position: absolute; top: -90px; right: -50px;
  width: 340px; height: 340px; border-radius: 50%;
  background: radial-gradient(circle, rgba(240,168,60,.18), transparent 65%);
  pointer-events: none;
}
.dx-hero-grid {
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: radial-gradient(ellipse at 30% 0%, black 30%, transparent 75%);
}

.dx-hero-main {
  position: relative;
  display: flex; align-items: center; justify-content: space-between;
  gap: 24px; flex-wrap: wrap; margin-bottom: 18px;
}

/* Saludo */
.dx-greet { display: flex; align-items: center; gap: 16px; }
.dx-greet-emoji { font-size: 40px; line-height: 1; filter: drop-shadow(0 2px 10px rgba(0,0,0,.4)); }
.dx-greet-lbl { font-size: 13px; font-weight: 500; color: rgba(255,255,255,.5); letter-spacing: .3px; }
.dx-greet-name { font-size: 26px; font-weight: 900; color: white; letter-spacing: -.3px; line-height: 1.15; }
.dx-greet-empresa { font-size: 11px; font-weight: 700; color: var(--sidebar-accent); letter-spacing: .8px; text-transform: uppercase; margin-top: 2px; }

/* Reloj */
.dx-clock { text-align: center; }
.dx-clock-time { font-size: 38px; font-weight: 800; color: white; letter-spacing: -1px; font-variant-numeric: tabular-nums; line-height: 1; }
.dx-clock-date { font-size: 12px; color: rgba(255,255,255,.45); margin-top: 5px; }

/* Clima actual */
.dx-weather {
  display: flex; align-items: center; gap: 14px;
  background: rgba(255,255,255,.06); backdrop-filter: blur(6px);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 14px; padding: 12px 18px;
  min-width: 190px; min-height: 72px;
}
.dx-weather-icon { font-size: 40px; line-height: 1; }
.dx-weather-temp { font-size: 24px; font-weight: 900; color: white; line-height: 1; }
.dx-weather-cond { font-size: 11px; font-weight: 600; color: rgba(255,255,255,.75); margin-top: 3px; }
.dx-weather-loc { display: flex; align-items: center; gap: 3px; font-size: 10px; color: rgba(255,255,255,.5); margin-top: 2px; }
.dx-weather-skel { width: 140px; height: 44px; border-radius: 8px; background: rgba(255,255,255,.08); animation: dxPulse 1.2s ease-in-out infinite; }
@keyframes dxPulse { 0%,100% { opacity: .4 } 50% { opacity: .9 } }

/* Pronóstico */

@media (max-width: 800px) {
  .dx-clock { display: none; }
}

/* ══ KPIs ═══════════════════════════════════════════════════ */
.dx-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
.dx-kpi {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 16px 18px;
  cursor: pointer; transition: transform 180ms var(--ease-out), box-shadow 180ms var(--ease-out), border-color 180ms var(--ease-out);
  overflow: hidden;
}
.dx-kpi::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: var(--kc); opacity: .8;
}
.dx-kpi:hover { transform: translateY(-3px); box-shadow: 0 10px 26px rgba(0,0,0,.08); border-color: var(--kc); }
.dx-kpi-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.dx-kpi-lbl { font-size: 10px; font-weight: 800; letter-spacing: .8px; color: rgba(var(--v-theme-on-surface), .45); }
.dx-kpi-ic { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.dx-kpi-val { font-size: 24px; font-weight: 800; letter-spacing: -.5px; line-height: 1; margin-bottom: 8px; }
.dx-kpi-trend { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; }
.dx-trend-up   { color: var(--success); }
.dx-trend-down { color: var(--error); }
.dx-trend-neutral { color: rgba(var(--v-theme-on-surface), .45); }
.dx-skel {
  display: inline-block; width: 90px; height: 22px; border-radius: 5px;
  background: linear-gradient(90deg, rgba(var(--v-theme-on-surface),.06) 25%, rgba(var(--v-theme-on-surface),.12) 50%, rgba(var(--v-theme-on-surface),.06) 75%);
  background-size: 200% 100%; animation: dxShimmer 1.4s infinite;
}
@keyframes dxShimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }

/* ══ CUERPO ═════════════════════════════════════════════════ */
.dx-body { display: grid; grid-template-columns: 1fr 330px; gap: 16px; align-items: start; }
@media (max-width: 1000px) { .dx-body { grid-template-columns: 1fr; } }

.dx-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px; padding: 18px;
}
.dx-panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.dx-panel-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 11px; font-weight: 800; letter-spacing: .8px;
  color: rgba(var(--v-theme-on-surface), .6);
}
.dx-panel-title-ic { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.dx-panel-link {
  border: none; background: transparent; cursor: pointer;
  font-size: 11px; font-weight: 700; color: var(--indigo);
  padding: 2px 6px; border-radius: 6px; transition: background .15s;
}
.dx-panel-link:hover { background: var(--indigo-wash); }
.dx-panel-loading { display: flex; justify-content: center; padding: 18px; }
.dx-panel-empty { text-align: center; padding: 14px 0; font-size: 12px; color: rgba(var(--v-theme-on-surface), .4); }

/* ── Alertas ── */
.dx-alert-count {
  background: var(--error); color: white;
  min-width: 22px; text-align: center;
  padding: 2px 8px; border-radius: 11px;
  font-size: 11px; font-weight: 900;
}
.dx-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.dx-chip {
  display: inline-flex; align-items: center; gap: 6px;
  border: 1px solid color-mix(in srgb, var(--cc) 30%, transparent);
  background: color-mix(in srgb, var(--cc) 7%, transparent);
  border-radius: 20px; padding: 5px 11px;
  font-size: 11px; font-weight: 700; color: var(--cc);
  cursor: pointer; transition: background-color 150ms var(--ease-out), transform 150ms var(--ease-out);
}
.dx-chip:hover { background: color-mix(in srgb, var(--cc) 15%, transparent); transform: translateY(-1px); }
.dx-chip-num {
  background: var(--cc); color: white;
  min-width: 18px; text-align: center;
  padding: 1px 6px; border-radius: 9px;
  font-size: 10px; font-weight: 900;
}

.dx-alerts-empty { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 32px 0; }
.dx-alerts-empty-ic {
  width: 52px; height: 52px; border-radius: 50%;
  background: var(--success-wash);
  display: flex; align-items: center; justify-content: center; margin-bottom: 6px;
}
.dx-alerts-empty-title { font-size: 14px; font-weight: 800; }
.dx-alerts-empty-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface), .45); }

.dx-alert-list { display: flex; flex-direction: column; gap: 4px; }
.dx-alert-row {
  display: flex; align-items: center; gap: 12px;
  padding: 9px 10px; border-radius: 11px;
  transition: background .15s;
}
.dx-alert-row:hover { background: rgba(var(--v-theme-on-surface), .035); }
.dx-alert-ic {
  width: 32px; height: 32px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.dx-alert-info { flex: 1; min-width: 0; }
.dx-alert-title { font-size: 12.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dx-alert-desc { font-size: 11px; color: rgba(var(--v-theme-on-surface), .5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
.dx-alert-hora { flex-shrink: 0; font-size: 10px; font-weight: 600; color: rgba(var(--v-theme-on-surface), .35); font-variant-numeric: tabular-nums; }
.dx-alert-x {
  flex-shrink: 0; width: 26px; height: 26px;
  border: none; border-radius: 7px; background: transparent;
  color: rgba(var(--v-theme-on-surface), .3);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 150ms var(--ease-out), background-color 150ms var(--ease-out), color 150ms var(--ease-out); padding: 0;
}
.dx-alert-row:hover .dx-alert-x { opacity: 1; }
.dx-alert-x:hover { background: var(--error-wash); color: var(--error); }
.dx-alert-more {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  border: none; background: rgba(var(--v-theme-on-surface), .04);
  border-radius: 9px; padding: 8px;
  font-size: 11px; font-weight: 700; color: rgba(var(--v-theme-on-surface), .55);
  cursor: pointer; transition: background .15s; margin-top: 4px;
}
.dx-alert-more:hover { background: rgba(var(--v-theme-on-surface), .08); }

/* ── Accesos directos ── */

/* ── Últimos gastos ── */
/* ══════════════════════════════════════════════════════════════
   BANDAS DEL PANEL (hoy en vivo · mes contra mes · curva · atención)
   Todas comparten el mismo marco para que el inicio se lea como una
   sola pieza y no como cuatro widgets pegados.
   ══════════════════════════════════════════════════════════════ */
.dx-band {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), .1);
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, .04);
  overflow: hidden;
}
.dx-band-head {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 15px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .08);
}
.dx-band-title {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .1em;
  color: rgba(var(--v-theme-on-surface), .78);
}
.dx-band-note {
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), .5);
}
.dx-band-link {
  margin-left: auto;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--gold);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 6px;
}
.dx-band-link:hover { text-decoration: underline; }
.dx-band-link:focus-visible { outline: 2px solid var(--gold); outline-offset: 1px; }

/* El punto late solo mientras la conexión está viva: si se cae, se apaga
   en vez de seguir animando y mintiendo sobre el estado. */
.dx-pulse {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--success);
  flex-shrink: 0;
  animation: dxPulse 2.4s cubic-bezier(.4, 0, .6, 1) infinite;
}
.dx-pulse-off { background: rgba(var(--v-theme-on-surface), .25); animation: none; }
@keyframes dxPulse {
  0%   { box-shadow: 0 0 0 0 rgba(21, 128, 61, .45); }
  70%  { box-shadow: 0 0 0 7px rgba(21, 128, 61, 0); }
  100% { box-shadow: 0 0 0 0 rgba(21, 128, 61, 0); }
}
@media (prefers-reduced-motion: reduce) { .dx-pulse { animation: none; } }

/* ── Hoy en vivo ───────────────────────────────────────────── */
.dx-vivo { display: grid; grid-template-columns: repeat(auto-fit, minmax(215px, 1fr)); }
.dx-vivo-sede {
  padding: 13px 15px;
  border-right: 1px solid rgba(var(--v-theme-on-surface), .08);
  display: flex; flex-direction: column; gap: 3px;
}
.dx-vivo-sede:last-child { border-right: none; }
.dx-vivo-nombre {
  font-size: 11px; font-weight: 800; letter-spacing: .08em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .58);
}
.dx-vivo-monto {
  font-family: var(--font-mono); font-variant-numeric: tabular-nums;
  font-size: 23px; font-weight: 600; letter-spacing: -.02em;
}
.dx-vivo-pie {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  font-size: 12px; color: rgba(var(--v-theme-on-surface), .6);
}
.dx-vivo-pct {
  font-family: var(--font-mono); font-variant-numeric: tabular-nums;
  font-weight: 700; font-size: 11.5px;
  padding: 1px 7px; border-radius: 999px;
}
.dx-pct-ok   { color: var(--success); background: var(--success-wash); }
.dx-pct-warn { color: var(--warning); background: var(--warning-wash); }
.dx-pct-bad  { color: var(--error);   background: var(--error-wash); }

/* La marca es la meta: sin ella el porcentaje es un número suelto. */

/* ── Curva del mes ─────────────────────────────────────────── */
.dx-curva-wrap { padding: 6px 8px 10px; }
.dx-curva { width: 100%; }
.dx-curva-delta {
  margin-left: auto;
  display: inline-flex; align-items: center; gap: 3px;
  font-family: var(--font-mono); font-variant-numeric: tabular-nums;
  font-size: 12px; font-weight: 700;
}

/* ── Requiere atención ─────────────────────────────────────── */
.dx-atencion {
  display: flex; align-items: center; gap: 13px;
  padding: 12px 15px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .07);
}
.dx-atencion:last-child { border-bottom: none; }
.dx-atencion-click { cursor: pointer; transition: background var(--dur-fast) var(--ease-out); }
.dx-atencion-click:hover { background: rgba(var(--v-theme-on-surface), .035); }
.dx-atencion-sev { width: 3px; align-self: stretch; border-radius: 2px; flex-shrink: 0; }
.dx-atencion-cuerpo { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.dx-atencion-titulo { font-size: 13.5px; font-weight: 700; }
.dx-atencion-desc { font-size: 12px; color: rgba(var(--v-theme-on-surface), .58); }
.dx-atencion-monto {
  font-family: var(--font-mono); font-variant-numeric: tabular-nums;
  font-size: 16px; font-weight: 800; white-space: nowrap;
}

/* Sin la columna derecha, el centro de alertas ocupa todo el ancho. */
.dx-body-solo { grid-template-columns: 1fr !important; }

@media (max-width: 640px) {
}

/* ── Mes contra mes ────────────────────────────────────────── */
/* Las ventas brutas van fuera del gráfico: contra ellas, devoluciones
   o comisiones serían una línea de un píxel. */
.dx-comp-titular {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px 14px;
  padding: 14px 15px 4px;
}
.dx-comp-tit-lbl {
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: .09em;
  color: rgba(var(--v-theme-on-surface), .58);
  width: 100%;
}
.dx-comp-tit-val {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -.03em;
  line-height: 1.1;
}
.dx-comp-tit-vs {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}
.dx-comp-tit-vs > span:first-child {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  font-weight: 800;
}
.dx-comp-tit-ant {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), .55);
}
.dx-comp-wrap { padding: 0 8px 10px; }
.dx-comp { width: 100%; }

</style>
