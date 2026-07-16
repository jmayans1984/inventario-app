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

        <!-- Pronóstico 5 días (real) -->
        <div v-if="pronostico.length" class="dx-forecast">
          <div v-for="(d, i) in pronostico" :key="i" class="dx-fc-day">
            <div class="dx-fc-name">{{ d.dia }}</div>
            <div class="dx-fc-icon">{{ d.icono }}</div>
            <div class="dx-fc-temps">
              <span class="dx-fc-max">{{ d.max }}°</span>
              <span class="dx-fc-min">{{ d.min }}°</span>
            </div>
            <div class="dx-fc-rain" :style="{ opacity: d.lluvia > 0 ? 1 : .25 }">
              <v-icon size="9" color="#7dd3fc">mdi-water</v-icon>
              {{ d.lluvia }}%
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════
           KPIs FINANCIEROS CON TENDENCIA
      ══════════════════════════════════════════════════════ -->
      <div class="dx-kpis">
        <div class="dx-kpi" style="--kc:#10b981" @click="irA('/tesoreria/reportes/ventas-periodo')">
          <div class="dx-kpi-head">
            <span class="dx-kpi-lbl">VENTAS DEL MES</span>
            <div class="dx-kpi-ic" style="background:rgba(16,185,129,.12)">
              <v-icon size="17" color="#10b981">mdi-cash-register</v-icon>
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

        <div class="dx-kpi" style="--kc:#ef4444" @click="irA('/contabilidad/procesos/gastos')">
          <div class="dx-kpi-head">
            <span class="dx-kpi-lbl">GASTOS DEL MES</span>
            <div class="dx-kpi-ic" style="background:rgba(239,68,68,.1)">
              <v-icon size="17" color="#ef4444">mdi-cart-arrow-down</v-icon>
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

        <div class="dx-kpi" style="--kc:#0ea5e9" @click="irA('/tesoreria/procesos/movimientos-bancarios')">
          <div class="dx-kpi-head">
            <span class="dx-kpi-lbl">SALDO BANCARIO</span>
            <div class="dx-kpi-ic" style="background:rgba(14,165,233,.1)">
              <v-icon size="17" color="#0ea5e9">mdi-bank-outline</v-icon>
            </div>
          </div>
          <div class="dx-kpi-val">
            <span v-if="!cargando">{{ fmt(resumen?.saldoBancario?.total) }}</span>
            <span v-else class="dx-skel"></span>
          </div>
          <div v-if="!cargando && resumen?.saldoBancario?.variacion !== null" class="dx-kpi-trend" :class="trendClass(resumen?.saldoBancario?.variacion)">
            <v-icon size="13">{{ trendIcon(resumen?.saldoBancario?.variacion) }}</v-icon>
            {{ Math.abs(resumen?.saldoBancario?.variacion || 0).toFixed(1) }}% vs mes anterior
          </div>
        </div>

        <div class="dx-kpi" style="--kc:#f59e0b" @click="irA('/tesoreria/procesos/facturas-venta')">
          <div class="dx-kpi-head">
            <span class="dx-kpi-lbl">FACTURAS PENDIENTES</span>
            <div class="dx-kpi-ic" style="background:rgba(245,158,11,.12)">
              <v-icon size="17" color="#f59e0b">mdi-file-clock-outline</v-icon>
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
           CUERPO: CENTRO DE ALERTAS + ACCESOS + ACTIVIDAD
      ══════════════════════════════════════════════════════ -->
      <div class="dx-body">

        <!-- ── Centro de alertas ── -->
        <div class="dx-panel dx-alerts">
          <div class="dx-panel-header">
            <div class="dx-panel-title">
              <div class="dx-panel-title-ic" style="background:rgba(239,68,68,.1)">
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

        <!-- ── Columna derecha ── -->
        <div class="dx-right">

          <!-- Accesos directos a módulos -->
          <div class="dx-panel">
            <div class="dx-panel-header">
              <div class="dx-panel-title">
                <div class="dx-panel-title-ic" style="background:rgba(6,182,212,.1)">
                  <v-icon size="15" color="#06b6d4">mdi-view-grid-outline</v-icon>
                </div>
                ACCESOS DIRECTOS
              </div>
            </div>
            <div class="dx-mods">
              <div
                v-for="m in modulos"
                :key="m.path"
                class="dx-mod"
                :style="{ '--mc': m.color }"
                @click="irA(m.path)"
              >
                <div class="dx-mod-ic" :style="{ background: m.bg }">
                  <v-icon size="18" color="white">{{ m.icono }}</v-icon>
                </div>
                <span class="dx-mod-lbl">{{ m.nombre }}</span>
              </div>
            </div>
          </div>

          <!-- Últimos gastos -->
          <div class="dx-panel">
            <div class="dx-panel-header">
              <div class="dx-panel-title">
                <div class="dx-panel-title-ic" style="background:rgba(139,92,246,.1)">
                  <v-icon size="15" color="#8b5cf6">mdi-receipt-text-outline</v-icon>
                </div>
                ÚLTIMOS GASTOS
              </div>
              <button class="dx-panel-link" @click="irA('/contabilidad/procesos/gastos')">Ver todos</button>
            </div>
            <div v-if="cargando" class="dx-panel-loading">
              <v-progress-circular indeterminate size="20" width="2" color="#8b5cf6" />
            </div>
            <template v-else>
              <div v-if="!(resumen?.ultimosGastos || []).length" class="dx-panel-empty">
                <span>Sin gastos recientes</span>
              </div>
              <div v-for="g in (resumen?.ultimosGastos || []).slice(0, 5)" :key="g.codigo" class="dx-gasto-row">
                <div class="dx-gasto-info">
                  <div class="dx-gasto-prov">{{ g.proveedor_nombre }}</div>
                  <div class="dx-gasto-meta">{{ fmtFecha(g.fecha) }}<template v-if="g.concepto"> · {{ g.concepto }}</template></div>
                </div>
                <span class="dx-gasto-val">{{ fmt(g.total) }}</span>
              </div>
            </template>
          </div>

        </div>
      </div>

    </div>

    <ActualizacionesModal v-model:mostrar="mostrarActualizaciones" />
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
const pronostico = ref([])
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
      + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
      + '&temperature_unit=fahrenheit&timezone=America%2FNew_York&forecast_days=6'
    const res = await fetch(url)
    const json = await res.json()

    const w = wmo(json.current?.weather_code)
    clima.value = {
      temp: Math.round(json.current?.temperature_2m || 0),
      icono: w.icono,
      condicion: w.condicion,
    }

    const diasNombre = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const d = json.daily
    pronostico.value = (d?.time || []).slice(1, 6).map((fecha, i) => {
      const idx = i + 1
      const wd = wmo(d.weather_code[idx])
      return {
        dia: diasNombre[new Date(fecha + 'T12:00:00').getDay()],
        icono: wd.icono,
        max: Math.round(d.temperature_2m_max[idx]),
        min: Math.round(d.temperature_2m_min[idx]),
        lluvia: d.precipitation_probability_max?.[idx] ?? 0,
      }
    })
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

// ── Accesos directos a módulos ────────────────────────────────
const modulos = [
  { nombre: 'Almacén',      path: '/almacen',      icono: 'mdi-warehouse',              color: '#10b981', bg: 'linear-gradient(135deg,#10b981,#047857)' },
  { nombre: 'Tesorería',    path: '/tesoreria',    icono: 'mdi-bank-transfer',          color: '#0ea5e9', bg: 'linear-gradient(135deg,#0ea5e9,#0369a1)' },
  { nombre: 'Nómina',       path: '/nomina',       icono: 'mdi-account-group-outline',  color: '#ec4899', bg: 'linear-gradient(135deg,#ec4899,#be185d)' },
  { nombre: 'Producción',   path: '/produccion',   icono: 'mdi-chef-hat',               color: '#f59e0b', bg: 'linear-gradient(135deg,#f59e0b,#d97706)' },
  { nombre: 'Contabilidad', path: '/contabilidad', icono: 'mdi-calculator-variant',     color: '#8b5cf6', bg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' },
  { nombre: 'Gerencia',     path: '/gerencia',     icono: 'mdi-chart-areaspline',       color: '#06b6d4', bg: 'linear-gradient(135deg,#06b6d4,#0e7490)' },
]

onMounted(() => {
  cargarResumen()
  cargarAlertas()
  cargarClima()
})

// ── Formatters ────────────────────────────────────────────────
function fmt(val) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(parseFloat(val || 0))
}

function fmtFecha(f) {
  if (!f) return '—'
  const s = String(f).split('T')[0]
  const [y, m, d] = s.split('-')
  return `${m}/${d}/${y}`
}
</script>

<style scoped>
.dash-wrap { display: flex; flex-direction: column; gap: 18px; }

/* ══ HERO ═══════════════════════════════════════════════════ */
.dx-hero {
  position: relative; overflow: hidden;
  background: linear-gradient(130deg, #0b1220 0%, #101c33 55%, #0d2137 100%);
  border-radius: 20px;
  padding: 26px 30px 20px;
  box-shadow: 0 12px 34px rgba(2, 8, 23, .35);
}
.dx-hero-glow {
  position: absolute; top: -90px; right: -50px;
  width: 340px; height: 340px; border-radius: 50%;
  background: radial-gradient(circle, rgba(6,182,212,.22), transparent 65%);
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
.dx-greet-empresa { font-size: 11px; font-weight: 700; color: #22d3ee; letter-spacing: .8px; text-transform: uppercase; margin-top: 2px; }

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
.dx-forecast {
  position: relative;
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;
}
.dx-fc-day {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 12px; padding: 10px 6px;
  transition: background .15s;
}
.dx-fc-day:hover { background: rgba(255,255,255,.1); }
.dx-fc-name { font-size: 10px; font-weight: 800; color: rgba(255,255,255,.65); text-transform: uppercase; letter-spacing: .5px; }
.dx-fc-icon { font-size: 22px; line-height: 1.2; }
.dx-fc-temps { display: flex; gap: 6px; align-items: baseline; }
.dx-fc-max { font-size: 13px; font-weight: 800; color: white; }
.dx-fc-min { font-size: 11px; font-weight: 600; color: rgba(255,255,255,.4); }
.dx-fc-rain { display: flex; align-items: center; gap: 2px; font-size: 10px; font-weight: 700; color: #7dd3fc; }

@media (max-width: 800px) {
  .dx-forecast { grid-template-columns: repeat(5, 1fr); }
  .dx-clock { display: none; }
}

/* ══ KPIs ═══════════════════════════════════════════════════ */
.dx-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
.dx-kpi {
  position: relative;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), .07);
  border-radius: 15px; padding: 16px 18px;
  cursor: pointer; transition: all .18s;
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
.dx-trend-up   { color: #10b981; }
.dx-trend-down { color: #ef4444; }
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
.dx-right { display: flex; flex-direction: column; gap: 16px; }

.dx-panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), .07);
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
  font-size: 11px; font-weight: 700; color: #06b6d4;
  padding: 2px 6px; border-radius: 6px; transition: background .15s;
}
.dx-panel-link:hover { background: rgba(6,182,212,.08); }
.dx-panel-loading { display: flex; justify-content: center; padding: 18px; }
.dx-panel-empty { text-align: center; padding: 14px 0; font-size: 12px; color: rgba(var(--v-theme-on-surface), .4); }

/* ── Alertas ── */
.dx-alert-count {
  background: linear-gradient(135deg,#ef4444,#dc2626); color: white;
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
  cursor: pointer; transition: all .15s;
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
  background: rgba(16,185,129,.1);
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
  opacity: 0; transition: all .15s; padding: 0;
}
.dx-alert-row:hover .dx-alert-x { opacity: 1; }
.dx-alert-x:hover { background: rgba(239,68,68,.1); color: #ef4444; }
.dx-alert-more {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  border: none; background: rgba(var(--v-theme-on-surface), .04);
  border-radius: 9px; padding: 8px;
  font-size: 11px; font-weight: 700; color: rgba(var(--v-theme-on-surface), .55);
  cursor: pointer; transition: background .15s; margin-top: 4px;
}
.dx-alert-more:hover { background: rgba(var(--v-theme-on-surface), .08); }

/* ── Accesos directos ── */
.dx-mods { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.dx-mod {
  display: flex; flex-direction: column; align-items: center; gap: 7px;
  padding: 14px 6px; border-radius: 13px;
  border: 1px solid rgba(var(--v-theme-on-surface), .06);
  cursor: pointer; transition: all .18s;
}
.dx-mod:hover { border-color: var(--mc); transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,.07); }
.dx-mod-ic {
  width: 40px; height: 40px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 3px 8px rgba(0,0,0,.16);
}
.dx-mod-lbl { font-size: 10.5px; font-weight: 700; color: rgba(var(--v-theme-on-surface), .7); }

/* ── Últimos gastos ── */
.dx-gasto-row {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 7px 8px; border-radius: 9px; transition: background .15s;
}
.dx-gasto-row:hover { background: rgba(var(--v-theme-on-surface), .035); }
.dx-gasto-info { min-width: 0; }
.dx-gasto-prov { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dx-gasto-meta { font-size: 10px; color: rgba(var(--v-theme-on-surface), .45); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
.dx-gasto-val { flex-shrink: 0; font-family: monospace; font-size: 12px; font-weight: 700; color: #8b5cf6; }
</style>
