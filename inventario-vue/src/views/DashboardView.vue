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
           WEATHER KPI - TODO EN UNA FILA
      ══════════════════════════════════════════════════════ -->
      <div class="dweather-container">
        <!-- Clima actual (hoy) -->
        <div class="dweather-main">
          <div class="dweather-bg" :style="{ background: weatherGradient }"></div>
          <div class="dweather-content">
            <div class="dweather-icon">{{ weatherIcon }}</div>
            <div class="dweather-body">
              <div class="dweather-label">Hoy</div>
              <div class="dweather-temp">{{ tempActualF }}°F</div>
              <div class="dweather-condition">{{ weatherCondition }}</div>
              <div class="dweather-location">📍 {{ ubicacion }}</div>
              <div v-if="precipitacion > 0" class="dweather-rain">🌧️ {{ precipitacion }}%</div>
            </div>
          </div>
        </div>

        <!-- Pronóstico 5 días siguientes en fila -->
        <div class="dweather-forecast">
          <div v-for="(day, idx) in proximos5Dias" :key="idx" class="dforecast-day">
            <div class="dfd-dayname">{{ day.dayName }}</div>
            <div class="dfd-date">{{ day.date }}</div>
            <div class="dfd-icon">{{ day.icon }}</div>
            <div class="dfd-temp">{{ day.tempF }}°F</div>
            <div class="dfd-rain" v-if="day.rain > 0">{{ day.rain }}%</div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════
           ALERTAS COMPACTO + ACCIONES RÁPIDAS
      ══════════════════════════════════════════════════════ -->
      <div class="dalerts-compact">
        <div v-if="alertas.length > 0" class="dalerts-mini">
          <div class="dalerts-mini-header">
            <v-icon size="16">mdi-alert-circle</v-icon>
            <span>{{ alertas.length }} Alertas</span>
          </div>
          <div class="dalerts-mini-list">
            <div v-for="(alerta, idx) in alertas.slice(0, 4)" :key="idx" class="dalert-mini-card">
              <div class="dalert-mini-icon">{{ alerta.icon }}</div>
              <div class="dalert-mini-text">
                <div class="dalert-mini-title">{{ alerta.titulo }}</div>
              </div>
              <button class="dalert-mini-close" @click="eliminarAlerta(idx)">✕</button>
            </div>
            <div v-if="alertas.length > 4" class="dalert-mini-more">+{{ alertas.length - 4 }} más</div>
          </div>
        </div>

        <!-- ACCIONES RÁPIDAS BASADAS EN NOTIFICACIONES -->
        <div class="quick-actions-grid">
          <div v-if="contarAlertasPorTipo('ORDEN_COMPRA') > 0" class="quick-action-card orden-compra" @click="irA('/produccion/procesos/ordenes-compra')">
            <div class="qac-icon">📋</div>
            <div class="qac-content">
              <div class="qac-label">Órdenes Compra</div>
              <div class="qac-value">{{ contarAlertasPorTipo('ORDEN_COMPRA') }} nuevas</div>
            </div>
            <v-icon class="qac-arrow">mdi-chevron-right</v-icon>
          </div>

          <div v-if="contarAlertasPorTipo('stock_fuera') > 0" class="quick-action-card stock-fuera" @click="irA('/almacen/reportes/alertas-stock')">
            <div class="qac-icon">🔴</div>
            <div class="qac-content">
              <div class="qac-label">Sin Stock</div>
              <div class="qac-value">{{ contarAlertasPorTipo('stock_fuera') }} productos</div>
            </div>
            <v-icon class="qac-arrow">mdi-chevron-right</v-icon>
          </div>

          <div v-if="contarAlertasPorTipo('stock_bajo') > 0" class="quick-action-card stock-bajo" @click="irA('/almacen/reportes/alertas-stock')">
            <div class="qac-icon">📦</div>
            <div class="qac-content">
              <div class="qac-label">Stock Bajo</div>
              <div class="qac-value">{{ contarAlertasPorTipo('stock_bajo') }} productos</div>
            </div>
            <v-icon class="qac-arrow">mdi-chevron-right</v-icon>
          </div>

          <div v-if="contarAlertasPorTipo('alerta_general') > 0" class="quick-action-card alerta-general" @click="irA('/almacen/procesos/gestion-inventario')">
            <div class="qac-icon">⚠️</div>
            <div class="qac-content">
              <div class="qac-label">Alerta General</div>
              <div class="qac-value">{{ contarAlertasPorTipo('alerta_general') }} alertas</div>
            </div>
            <v-icon class="qac-arrow">mdi-chevron-right</v-icon>
          </div>

          <div v-if="contarAlertasPorTipo('reportes') > 0" class="quick-action-card reportes" @click="irA('/almacen/reportes/kardex')">
            <div class="qac-icon">📊</div>
            <div class="qac-content">
              <div class="qac-label">Reportes</div>
              <div class="qac-value">{{ contarAlertasPorTipo('reportes') }} listos</div>
            </div>
            <v-icon class="qac-arrow">mdi-chevron-right</v-icon>
          </div>

          <div v-if="contarAlertasPorTipo('actualizaciones') > 0" class="quick-action-card actualizaciones" @click="irA('/')">
            <div class="qac-icon">⚡</div>
            <div class="qac-content">
              <div class="qac-label">Actualizaciones</div>
              <div class="qac-value">{{ contarAlertasPorTipo('actualizaciones') }} nuevas</div>
            </div>
            <v-icon class="qac-arrow">mdi-chevron-right</v-icon>
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
import { notificacionesService } from '../services/notificaciones.service'

const router    = useRouter()
const authStore = useAuthStore()

// ── Reloj en tiempo real ──────────────────────────────────────
const ahora = ref(new Date())
let timerReloj = null
onMounted(() => { timerReloj = setInterval(() => { ahora.value = new Date() }, 1000) })
onUnmounted(() => { clearInterval(timerReloj) })

// ── Hora actual (fija para el clima, solo cambia cada hora) ──
const horaClimaActual = computed(() => {
  const h = Math.floor(ahora.value.getHours())
  return h
})

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
  const h = horaClimaActual.value
  if (h < 6) return 15
  if (h < 12) return 22 + 3
  if (h < 18) return 28 + 2
  return 24 + 1
})

const tempActualF = computed(() => {
  return Math.round((tempActual.value * 9/5) + 32)
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
  const diasNombre = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const today = new Date()
  return [1, 2, 3, 4, 5].map((offset, i) => {
    const fecha = new Date(today)
    fecha.setDate(fecha.getDate() + offset)
    const diaNum = String(fecha.getDate()).padStart(2, '0')
    const mesNum = String(fecha.getMonth() + 1).padStart(2, '0')
    const dayIdx = fecha.getDay()
    const dayName = diasNombre[dayIdx]

    const rainChance = [30, 60, 20, 50, 40][i]
    let icon = '☀️'
    if (rainChance > 70) icon = '🌧️'
    else if (rainChance > 50) icon = '🌦️'
    else if (rainChance > 30) icon = '☁️'
    else if (rainChance > 15) icon = '⛅'

    const tempC = 24 + 1
    const tempF = Math.round((tempC * 9/5) + 32)

    return {
      dayName,
      date: `${mesNum}/${diaNum}`,
      icon,
      temp: tempC,
      tempF,
      rain: rainChance
    }
  })
})

// ── Alertas del sistema ────────────────────────────────────────
const alertas = ref([])

async function cargarAlertas() {
  try {
    const res = await notificacionesService.obtenerNotificaciones()
    const notificaciones = res.data || []
    if (Array.isArray(notificaciones)) {
      alertas.value = notificaciones.map(n => ({
        id: n.id,
        tipo: n.tipo || 'INFO',
        icon: obtenerIconoTipo(n.tipo || 'INFO'),
        titulo: n.titulo,
        descripcion: n.mensaje,
        hora: formatFecha(n.fecha_creacion)
      }))
    }
  } catch (e) {
    console.error('Error cargando alertas:', e)
    alertas.value = []
  }
}

function obtenerIconoTipo(tipo) {
  const iconMap = {
    'CRÍTICO': '⚠️',
    'ADVERTENCIA': '⚡',
    'INFO': 'ℹ️'
  }
  return iconMap[tipo] || 'ℹ️'
}

function formatFecha(fecha) {
  if (!fecha) return '—'
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

function contarAlertasPorTipo(tipo) {
  return alertas.value.filter(a => a.tipo === tipo).length
}

function irA(ruta) {
  router.push(ruta)
}

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

onMounted(() => {
  cargarResumen()
  cargarAlertas()
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
  flex-direction: row;
  gap: 12px;
  align-items: stretch;
}

.dweather-main {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  align-items: center;
  min-width: 280px;
  flex-shrink: 0;
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
  gap: 16px;
  color: white;
  width: 100%;
  padding: 20px 24px;
}

.dweather-icon {
  font-size: 50px;
  line-height: 1;
  flex-shrink: 0;
}

.dweather-body {
  text-align: left;
  flex: 1;
}

.dweather-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  opacity: 0.8;
  margin-bottom: 2px;
  letter-spacing: 0.5px;
}

.dweather-temp {
  font-size: 32px;
  font-weight: 900;
  line-height: 1;
  margin-bottom: 2px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.dweather-condition {
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 3px;
  opacity: 0.95;
}

.dweather-location {
  font-size: 10px;
  font-weight: 500;
  opacity: 0.9;
  margin-bottom: 2px;
}

.dweather-rain {
  font-size: 10px;
  font-weight: 600;
  opacity: 0.95;
}

/* ══ Pronóstico 5 días ═══════════════════════════════════════ */
.dweather-forecast {
  display: flex;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.dforecast-day {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 10px;
  padding: 12px 8px;
  text-align: center;
  flex: 1;
  min-width: 0;
}

.dfd-dayname {
  font-size: 11px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 2px;
  text-transform: capitalize;
}

.dfd-date {
  font-size: 9px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.dfd-icon {
  font-size: 24px;
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

/* ══ PANEL DE ALERTAS ════════════════════════════════════════ */
.dalerts-panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 16px;
  overflow: hidden;
}

.dalerts-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.dalerts-count {
  margin-left: auto;
  background: rgba(255, 255, 255, 0.25);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 900;
}

.dalerts-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  font-size: 13px;
  text-align: center;
}

.dalerts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
}

.dalert-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  border-left: 4px solid;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.dalert-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.dalert-card:hover {
  transform: translateX(4px);
}

.dalert-card:hover::before {
  opacity: 0.05;
}

/* Tipos de alerta */
.dalert-CRÍTICO {
  background: rgba(239, 68, 68, 0.08);
  border-left-color: #ef4444;
}

.dalert-CRÍTICO::before {
  background: #ef4444;
}

.dalert-ADVERTENCIA {
  background: rgba(245, 158, 11, 0.08);
  border-left-color: #f59e0b;
}

.dalert-ADVERTENCIA::before {
  background: #f59e0b;
}

.dalert-INFO {
  background: rgba(6, 182, 212, 0.08);
  border-left-color: #06b6d4;
}

.dalert-INFO::before {
  background: #06b6d4;
}

.dalert-badge {
  display: inline-block;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.8px;
  padding: 3px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 2px;
}

.dalert-CRÍTICO .dalert-badge {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.dalert-ADVERTENCIA .dalert-badge {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.dalert-INFO .dalert-badge {
  background: rgba(6, 182, 212, 0.2);
  color: #06b6d4;
}

.dalert-icon {
  font-size: 24px;
  flex-shrink: 0;
  margin-top: 2px;
}

.dalert-content {
  flex: 1;
  min-width: 0;
}

.dalert-title {
  font-size: 13px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 3px;
}

.dalert-desc {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  line-height: 1.4;
  margin-bottom: 6px;
}

.dalert-time {
  font-size: 10px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  font-weight: 600;
}

.dalert-delete {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 0, 0, 0.1);
  color: #ef4444;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.dalert-delete:hover {
  background: rgba(255, 0, 0, 0.2);
  transform: scale(1.1);
}

.dalert-delete:active {
  transform: scale(0.95);
}

/* ══ ALERTAS COMPACTO ══════════════════════════════════ */
.dalerts-compact {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dalerts-mini {
  background: rgba(239, 68, 68, 0.08);
  border-left: 4px solid #ef4444;
  border-radius: 12px;
  padding: 12px 16px;
  overflow: hidden;
}

.dalerts-mini-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #ef4444;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dalerts-mini-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dalert-mini-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface));
}

.dalert-mini-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.dalert-mini-text {
  flex: 1;
  min-width: 0;
}

.dalert-mini-title {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dalert-mini-close {
  background: none;
  border: none;
  color: rgba(var(--v-theme-on-surface), 0.4);
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  flex-shrink: 0;
}

.dalert-mini-close:hover {
  color: #ef4444;
}

.dalert-mini-more {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  padding: 6px 8px;
  text-align: center;
  font-style: italic;
}

/* ══ QUICK ACTIONS GRID ════════════════════════════════ */
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.quick-action-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
  overflow: hidden;
  position: relative;
}

.quick-action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.quick-action-card:hover {
  transform: translateY(-4px);
  border-color: currentColor;
}

.quick-action-card:hover::before {
  opacity: 0.1;
}

.quick-action-card.stock-bajo {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05));
  border-left: 4px solid #f59e0b;
  color: #f59e0b;
}

.quick-action-card.stock-bajo::before {
  background: #f59e0b;
}

.quick-action-card.stock-fuera {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
  border-left: 4px solid #ef4444;
  color: #ef4444;
}

.quick-action-card.stock-fuera::before {
  background: #ef4444;
}

.quick-action-card.alerta-general {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(168, 85, 247, 0.05));
  border-left: 4px solid #a855f7;
  color: #a855f7;
}

.quick-action-card.alerta-general::before {
  background: #a855f7;
}

.quick-action-card.orden-compra {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05));
  border-left: 4px solid #3b82f6;
  color: #3b82f6;
}

.quick-action-card.orden-compra::before {
  background: #3b82f6;
}

.quick-action-card.reportes {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
  border-left: 4px solid #22c55e;
  color: #22c55e;
}

.quick-action-card.reportes::before {
  background: #22c55e;
}

.quick-action-card.actualizaciones {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(14, 165, 233, 0.05));
  border-left: 4px solid #0ea5e9;
  color: #0ea5e9;
}

.quick-action-card.actualizaciones::before {
  background: #0ea5e9;
}

.qac-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.qac-content {
  flex: 1;
  position: relative;
  z-index: 1;
}

.qac-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.7;
  margin-bottom: 2px;
}

.qac-value {
  font-size: 18px;
  font-weight: 800;
  line-height: 1;
}

.qac-arrow {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.3s;
  position: relative;
  z-index: 1;
}

.quick-action-card:hover .qac-arrow {
  opacity: 1;
}

</style>
