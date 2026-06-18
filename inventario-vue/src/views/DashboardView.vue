<template>
  <MainLayout>
    <div class="dash-wrap">

      <!-- ══════════════════════════════════════════════════════
           BANNER DE BIENVENIDA
      ══════════════════════════════════════════════════════ -->
      <div class="dash-banner">
        <div class="dash-banner-left">
          <div class="dash-greeting-icon">{{ greetingEmoji }}</div>
          <div>
            <div class="dash-greeting">{{ greeting }},</div>
            <div class="dash-empresa">{{ authStore.userNombre || 'Usuario' }}</div>
          </div>
        </div>
        <div class="dash-banner-right">
          <div class="dash-date-big">{{ horaActual }}</div>
          <div class="dash-date-sub">{{ fechaLarga }}</div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════
           WEATHER KPI
      ══════════════════════════════════════════════════════ -->
      <div class="dweather-container">
        <div class="dweather-main">
          <div class="dweather-bg" :style="{ background: weatherGradient }"></div>
          <div class="dweather-content">
            <div class="dweather-icon">{{ weatherIcon }}</div>
            <div class="dweather-body">
              <div class="dweather-temp">{{ tempActual }}°</div>
              <div class="dweather-condition">{{ weatherCondition }}</div>
              <div class="dweather-location">📍 {{ ubicacion }}</div>
              <div v-if="precipitacion > 0" class="dweather-rain">🌧️ {{ precipitacion }}% chance de lluvia</div>
            </div>
          </div>
        </div>

        <!-- Pronóstico 5 días -->
        <div class="dweather-forecast">
          <div v-for="(day, idx) in proximos5Dias" :key="idx" class="dforecast-day">
            <div class="dfd-date">{{ day.date }}</div>
            <div class="dfd-icon">{{ day.icon }}</div>
            <div class="dfd-temp">{{ day.temp }}°</div>
            <div class="dfd-rain" v-if="day.rain > 0">{{ day.rain }}%</div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════
           CUERPO PRINCIPAL: MÓDULOS + ÚLTIMOS GASTOS
      ══════════════════════════════════════════════════════ -->
      <div class="dash-main">

        <!-- ── ACCESO A MÓDULOS ── -->
        <div class="dash-modules">
          <div class="dash-section-header">
            <v-icon size="14" color="#06b6d4">mdi-view-grid-outline</v-icon>
            <span>MÓDULOS DEL SISTEMA</span>
          </div>

          <div class="dash-grupos">
            <div v-for="grupo in grupos" :key="grupo.nombre" class="dash-grupo">

              <!-- Encabezado del grupo -->
              <div class="dgrupo-header" :style="{ '--gc': grupo.color }">
                <div class="dgrupo-icon">
                  <v-icon size="14" :color="grupo.color">{{ grupo.icon }}</v-icon>
                </div>
                <span class="dgrupo-nombre">{{ grupo.nombre }}</span>
                <div class="dgrupo-line"></div>
              </div>

              <!-- 3 tiles del grupo -->
              <div class="dgrupo-tiles">
                <div
                  v-for="mod in grupo.items"
                  :key="mod.label"
                  class="dmod"
                  :class="{ 'dmod--pronto': mod.pronto }"
                  :style="{ '--mc': grupo.color }"
                  @click="!mod.pronto && ir(mod.ruta)"
                >
                  <div class="dmod-icon-wrap">
                    <v-icon size="22" :color="mod.pronto ? 'rgba(var(--v-theme-on-surface),0.25)' : grupo.color">{{ mod.icon }}</v-icon>
                  </div>
                  <div class="dmod-body">
                    <div class="dmod-label">{{ mod.label }}</div>
                    <div v-if="mod.pronto" class="dmod-pronto-badge">Próximamente</div>
                  </div>
                  <v-icon v-if="!mod.pronto" size="13" class="dmod-arrow">mdi-chevron-right</v-icon>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- ── ÚLTIMOS GASTOS ── -->
        <div class="dash-recent">
          <div class="dash-section-header">
            <v-icon size="14" color="#10b981">mdi-clock-outline</v-icon>
            <span>ÚLTIMOS GASTOS</span>
            <button class="dash-ver-mas" @click="ir('/contabilidad/procesos/gastos')">
              Ver todos <v-icon size="12">mdi-arrow-right</v-icon>
            </button>
          </div>

          <div v-if="cargando" class="dash-recent-list">
            <div v-for="n in 5" :key="n" class="drec-skel"></div>
          </div>

          <div v-else-if="!resumen?.ultimosGastos?.length" class="dash-empty">
            <v-icon size="36" color="rgba(var(--v-theme-on-surface),0.15)">mdi-receipt-text-outline</v-icon>
            <span>Sin gastos registrados este mes</span>
          </div>

          <div v-else class="dash-recent-list">
            <div
              v-for="g in resumen.ultimosGastos"
              :key="g.codigo"
              class="drec"
              @click="ir('/contabilidad/procesos/gastos')"
            >
              <div class="drec-icon">
                <v-icon size="16" color="#10b981">mdi-receipt-text-outline</v-icon>
              </div>
              <div class="drec-body">
                <div class="drec-concepto">{{ g.concepto || '—' }}</div>
                <div class="drec-meta">
                  {{ fmtFecha(g.fecha) }}
                  <span class="drec-sep">·</span>
                  {{ g.proveedor_nombre || '—' }}
                </div>
              </div>
              <div class="drec-right">
                <div class="drec-total">{{ fmt(g.total) }}</div>
                <div class="drec-estado" :class="`drec-estado--${g.estado?.toLowerCase()}`">
                  {{ g.estado }}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../components/layouts/MainLayout.vue'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'

const router    = useRouter()
const authStore = useAuthStore()

// ── Reloj en tiempo real ──────────────────────────────────────
const ahora = ref(new Date())
let timerReloj = null
onMounted(() => { timerReloj = setInterval(() => { ahora.value = new Date() }, 1000) })
onUnmounted(() => { clearInterval(timerReloj) })

const horaActual = computed(() => {
  return ahora.value.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
})

const fechaLarga = computed(() => {
  const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }; return ahora.value.toLocaleDateString('en-US', opts)
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

// ── Clima ──────────────────────────────────────────────────────
const ubicacion = 'Orlando, Florida, USA'

const tempActual = computed(() => {
  const h = ahora.value.getHours()
  if (h < 6) return 15
  if (h < 12) return 22 + Math.floor(Math.random() * 6)
  if (h < 18) return 28 + Math.floor(Math.random() * 5)
  return 24 + Math.floor(Math.random() * 4)
})

const precipitacion = computed(() => {
  const conditions = Math.random()
  if (conditions > 0.7) return 80
  if (conditions > 0.5) return 60
  if (conditions > 0.3) return 30
  return 10
})

const weatherCondition = computed(() => {
  if (precipitacion.value > 70) return 'Lluvia Moderada'
  if (precipitacion.value > 50) return 'Lluvia Ligera'
  if (precipitacion.value > 30) return 'Nublado'
  if (precipitacion.value > 15) return 'Parcialmente Nublado'
  return 'Soleado'
})

const weatherIcon = computed(() => {
  if (precipitacion.value > 70) return '🌧️'
  if (precipitacion.value > 50) return '🌦️'
  if (precipitacion.value > 30) return '☁️'
  if (precipitacion.value > 15) return '⛅'
  return '☀️'
})

const weatherGradient = computed(() => {
  const h = ahora.value.getHours()
  let baseGradient = ''

  // Según la hora del día
  if (h < 6) baseGradient = 'linear-gradient(135deg, #0a0e27, #1a1a3f)'
  else if (h < 9) baseGradient = 'linear-gradient(135deg, #667eea, #764ba2)'
  else if (h < 12) baseGradient = 'linear-gradient(135deg, #87ceeb, #e0f6ff)'
  else if (h < 15) baseGradient = 'linear-gradient(135deg, #ffd89b, #19547b)'
  else if (h < 18) baseGradient = 'linear-gradient(135deg, #ff9a56, #ff6a88)'
  else if (h < 20) baseGradient = 'linear-gradient(135deg, #ff8c42, #ff5722)'
  else baseGradient = 'linear-gradient(135deg, #2c3e50, #3498db)'

  // Oscurecer según el clima
  if (precipitacion.value > 70) return 'linear-gradient(135deg, #4a5568, #2d3748)'
  if (precipitacion.value > 50) return 'linear-gradient(135deg, #667eea, #5a67d8)'
  if (precipitacion.value > 30) return 'linear-gradient(135deg, #718096, #4a5568)'

  return baseGradient
})

const proximos5Dias = computed(() => {
  const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']
  const today = new Date()
  return dias.map((d, i) => {
    const fecha = new Date(today)
    fecha.setDate(fecha.getDate() + i + 1)
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const dia = String(fecha.getDate()).padStart(2, '0')

    const rainChance = [30, 60, 20, 50, 40][i]
    let icon = '☀️'
    if (rainChance > 70) icon = '🌧️'
    else if (rainChance > 50) icon = '🌦️'
    else if (rainChance > 30) icon = '☁️'
    else if (rainChance > 15) icon = '⛅'

    return {
      date: `${mes}/${dia}`,
      icon,
      temp: 24 + Math.floor(Math.random() * 6),
      rain: rainChance
    }
  })
})

// ── Datos del dashboard ───────────────────────────────────────
const resumen  = ref(null)
const cargando = ref(true)

const empresa = computed(() =>
  authStore.empresa || authStore.user?.empresa || localStorage.getItem('empresaActual') || ''
)

async function cargarResumen() {
  if (!empresa.value) return
  cargando.value = true
  try {
    const res = await api.get('/dashboard/resumen', { params: { empresa: empresa.value } })
    if (res.data?.success) resumen.value = res.data.data
  } catch (e) { console.error('dashboard:', e) }
  finally { cargando.value = false }
}

onMounted(cargarResumen)

// ── Grupos de módulos ─────────────────────────────────────────
const grupos = [
  {
    nombre: 'CONTABILIDAD',
    icon:   'mdi-calculator',
    color:  '#10b981',
    items: [
      { label: 'Gestión de Gastos',     icon: 'mdi-receipt-text-outline',  ruta: '/contabilidad/procesos/gastos' },
      { label: 'Reporte de Gastos',     icon: 'mdi-chart-bar',             ruta: '/contabilidad/reportes/gastos' },
      { label: 'Estado de Resultados',  icon: 'mdi-file-chart-outline',    ruta: '/contabilidad/reportes/estado-resultados' },
    ]
  },
  {
    nombre: 'TESORERÍA',
    icon:   'mdi-bank-outline',
    color:  '#8b5cf6',
    items: [
      { label: 'Importar Ventas',       icon: 'mdi-storefront-outline',    ruta: '/tesoreria/procesos/importar-ventas' },
      { label: 'Movimiento Bancario',   icon: 'mdi-bank-transfer',         ruta: '/tesoreria/procesos/movimientos-bancarios' },
      { label: 'Saldo Bancario',        icon: 'mdi-chart-timeline-variant', ruta: '/tesoreria/reportes/movimiento-cuentas' },
    ]
  },
  {
    nombre: 'ALMACÉN',
    icon:   'mdi-warehouse',
    color:  '#06b6d4',
    items: [
      { label: 'Gestión de Inventario', icon: 'mdi-package-variant',       ruta: '/almacen/procesos/gestion-inventario' },
      { label: 'Reporte Kardex',        icon: 'mdi-clipboard-list-outline', ruta: '/almacen/reportes/kardex' },
      { label: 'Mov. por Producto',     icon: 'mdi-swap-vertical-bold',    ruta: '/almacen/reportes/movimiento-producto' },
    ]
  },
  {
    nombre: 'RECETAS',
    icon:   'mdi-chef-hat',
    color:  '#f97316',
    items: [
      { label: 'Artículos e Insumos',   icon: 'mdi-food-apple-outline',              ruta: '/recetas/configuracion/articulos' },
      { label: 'Gestión de Costos',     icon: 'mdi-calculator-variant-outline',      ruta: '/recetas/procesos/costos' },
      { label: 'Valoración por Ventas', icon: 'mdi-chart-bar',                       ruta: '/recetas/reportes/valoracion-ventas' },
    ]
  },
  {
    nombre: 'NÓMINA',
    icon:   'mdi-account-group-outline',
    color:  '#f59e0b',
    items: [
      { label: 'Empleados',             icon: 'mdi-badge-account-outline', ruta: '/nomina/configuracion/empleados' },
      { label: 'Liquidación de Nómina', icon: 'mdi-cash-multiple',         ruta: '/nomina/procesos/liquidacion' },
      { label: 'Recibos de Pago',       icon: 'mdi-file-document-outline', ruta: '/nomina/reportes/recibos' },
    ]
  },
  {
    nombre: 'GERENCIA',
    icon:   'mdi-chart-line',
    color:  '#10b981',
    items: [
      { label: 'Dashboard Ejecutivo',  icon: 'mdi-view-dashboard-outline', ruta: '/gerencia/reportes/ejecutivo' },
      { label: 'Análisis de Ventas',   icon: 'mdi-chart-areaspline',       ruta: '/gerencia/reportes/analisis-ventas' },
      { label: 'KPIs',                 icon: 'mdi-gauge',                  ruta: '/gerencia/reportes/kpis' },
    ]
  },
]

function ir(ruta) {
  router.push(ruta)
}

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
.dash-wrap {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ══ BANNER ══════════════════════════════════════════════════ */
.dash-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f2744 100%);
  border-radius: 16px;
  padding: 24px 32px;
  gap: 16px;
  flex-wrap: wrap;
}

.dash-banner-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dash-greeting-icon {
  font-size: 36px;
  line-height: 1;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
}

.dash-greeting {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255,255,255,0.55);
  letter-spacing: 0.3px;
}

.dash-empresa {
  font-size: 24px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.3px;
  line-height: 1.2;
}

.dash-banner-right {
  text-align: right;
}

.dash-date-big {
  font-size: 32px;
  font-weight: 800;
  color: #06b6d4;
  letter-spacing: -1px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.dash-date-sub {
  font-size: 12px;
  color: rgba(255,255,255,0.45);
  margin-top: 4px;
  text-transform: capitalize;
}

/* ══ KPI CARDS ═══════════════════════════════════════════════ */
.dash-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

@media (max-width: 900px) { .dash-kpis { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 500px)  { .dash-kpis { grid-template-columns: 1fr; } }

.dkpi {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 18px 18px 0;
  position: relative;
  overflow: hidden;
  transition: transform 0.18s, box-shadow 0.18s;
}

.dkpi:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

.dkpi-accent {
  width: 4px;
  border-radius: 0 4px 4px 0;
  align-self: stretch;
  flex-shrink: 0;
}

.dkpi-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dkpi-body { flex: 1; min-width: 0; }

.dkpi-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: rgba(var(--v-theme-on-surface), 0.45);
  margin-bottom: 4px;
}

.dkpi-value {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.5px;
  line-height: 1;
  margin-bottom: 6px;
}

.dkpi-sub {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  display: flex;
  align-items: center;
  gap: 4px;
}

.dkpi-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 5px;
}

.dkpi-skel {
  display: block;
  width: 80px;
  height: 20px;
  border-radius: 4px;
  background: linear-gradient(90deg,
    rgba(var(--v-theme-on-surface), 0.06) 25%,
    rgba(var(--v-theme-on-surface), 0.12) 50%,
    rgba(var(--v-theme-on-surface), 0.06) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ══ WEATHER CARD ════════════════════════════════════════════ */
.dweather-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dweather-main {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dweather-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.dweather-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 24px;
  color: white;
  width: 100%;
  padding: 0 40px;
}

.dweather-icon {
  font-size: 70px;
  line-height: 1;
  flex-shrink: 0;
}

.dweather-body {
  text-align: left;
}

.dweather-temp {
  font-size: 42px;
  font-weight: 900;
  line-height: 1;
  margin-bottom: 4px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.dweather-condition {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
  opacity: 0.95;
}

.dweather-location {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.9;
  margin-bottom: 4px;
}

.dweather-rain {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.95;
}

/* ══ Pronóstico 5 días ═══════════════════════════════════════ */
.dweather-forecast {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.dforecast-day {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 10px;
  padding: 10px;
  text-align: center;
}

.dfd-date {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.dfd-icon {
  font-size: 28px;
  margin-bottom: 4px;
}

.dfd-temp {
  font-size: 13px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 3px;
}

.dfd-rain {
  font-size: 11px;
  font-weight: 600;
  color: #06b6d4;
}

/* ══ CUERPO PRINCIPAL ════════════════════════════════════════ */
.dash-main {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 14px;
  align-items: start;
}

@media (max-width: 960px) { .dash-main { grid-template-columns: 1fr; } }

/* ══ SECTION HEADERS ════════════════════════════════════════ */
.dash-section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.2px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  text-transform: uppercase;
  margin-bottom: 12px;
}

.dash-ver-mas {
  margin-left: auto;
  font-size: 10px;
  font-weight: 700;
  color: #06b6d4;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.15s;
}
.dash-ver-mas:hover { background: rgba(6,182,212,0.08); }

/* ══ MÓDULOS ════════════════════════════════════════════════ */
.dash-modules {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-radius: 16px;
  padding: 20px;
}

.dash-grupos {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* Encabezado de cada grupo */
.dgrupo-header {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 8px;
}

.dgrupo-icon {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--gc) 14%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dgrupo-nombre {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.2px;
  color: var(--gc);
  white-space: nowrap;
}

.dgrupo-line {
  flex: 1;
  height: 1px;
  background: color-mix(in srgb, var(--gc) 20%, transparent);
  border-radius: 1px;
}

/* 3 tiles por fila */
.dgrupo-tiles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

@media (max-width: 600px) { .dgrupo-tiles { grid-template-columns: 1fr; } }

.dmod {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 10px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  cursor: pointer;
  transition: all 0.18s;
  background: transparent;
  position: relative;
  overflow: hidden;
}

.dmod::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--mc);
  border-radius: 0 3px 3px 0;
  opacity: 0;
  transition: opacity 0.18s;
}

.dmod:not(.dmod--pronto):hover {
  border-color: var(--mc);
  background: rgba(var(--v-theme-on-surface), 0.02);
  transform: translateX(2px);
}

.dmod:not(.dmod--pronto):hover::before { opacity: 1; }
.dmod:not(.dmod--pronto):hover .dmod-arrow { opacity: 1; }
.dmod:not(.dmod--pronto):hover .dmod-icon-wrap {
  background: color-mix(in srgb, var(--mc) 14%, transparent);
}

/* Tile "próximamente" */
.dmod--pronto {
  cursor: default;
  opacity: 0.45;
}

.dmod-icon-wrap {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-on-surface), 0.05);
  flex-shrink: 0;
  transition: background 0.18s;
}

.dmod-body { flex: 1; min-width: 0; }

.dmod-label {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dmod-pronto-badge {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  margin-top: 2px;
}

.dmod-arrow {
  opacity: 0;
  flex-shrink: 0;
  color: var(--mc);
  transition: opacity 0.18s;
}

/* ══ ÚLTIMOS GASTOS ════════════════════════════════════════ */
.dash-recent {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-radius: 16px;
  padding: 20px;
}

.dash-recent-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.drec-skel {
  height: 60px;
  border-radius: 10px;
  background: linear-gradient(90deg,
    rgba(var(--v-theme-on-surface), 0.05) 25%,
    rgba(var(--v-theme-on-surface), 0.09) 50%,
    rgba(var(--v-theme-on-surface), 0.05) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.drec {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  cursor: pointer;
  transition: all 0.15s;
}

.drec:hover {
  border-color: rgba(16,185,129,0.3);
  background: rgba(16,185,129,0.04);
}

.drec-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(16,185,129,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.drec-body { flex: 1; min-width: 0; }

.drec-concepto {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.drec-meta {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}

.drec-sep { opacity: 0.4; }

.drec-right { text-align: right; flex-shrink: 0; }

.drec-total {
  font-size: 13px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}

.drec-estado {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  margin-top: 3px;
  padding: 2px 6px;
  border-radius: 4px;
}

.drec-estado--pendiente  { background: rgba(245,158,11,0.15); color: #f59e0b; }
.drec-estado--pagada     { background: rgba(16,185,129,0.15); color: #10b981; }
.drec-estado--anulada    { background: rgba(239,68,68,0.15);  color: #ef4444; }

.dash-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  color: rgba(var(--v-theme-on-surface), 0.35);
  font-size: 12px;
}
</style>
