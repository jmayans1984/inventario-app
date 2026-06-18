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
            <div class="dfd-dayname">{{ day.dayName }}</div>
            <div class="dfd-date">{{ day.date }}</div>
            <div class="dfd-icon">{{ day.icon }}</div>
            <div class="dfd-temp">{{ day.temp }}°</div>
            <div class="dfd-rain" v-if="day.rain > 0">{{ day.rain }}%</div>
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
  const diasNombre = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const today = new Date()
  return diasNombre.slice(0, 5).map((d, i) => {
    const fecha = new Date(today)
    fecha.setDate(fecha.getDate() + i + 1)
    const diaNum = String(fecha.getDate()).padStart(2, '0')
    const mesNum = String(fecha.getMonth() + 1).padStart(2, '0')

    const rainChance = [30, 60, 20, 50, 40][i]
    let icon = '☀️'
    if (rainChance > 70) icon = '🌧️'
    else if (rainChance > 50) icon = '🌦️'
    else if (rainChance > 30) icon = '☁️'
    else if (rainChance > 15) icon = '⛅'

    return {
      dayName: d,
      date: `${mesNum}/${diaNum}`,
      icon,
      temp: 24 + 1,
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

</style>
