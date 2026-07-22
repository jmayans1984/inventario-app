<template>
  <MainLayout>
    <div class="mod-container">

      <!-- ═══════════ HERO CON KPIs EN VIVO ═══════════ -->
      <div class="nom-hero">
        <div class="nom-hero-glow"></div>
        <div class="nom-hero-top">
          <div class="nom-hero-left">
            <div class="nom-hero-icon"><v-icon size="30" color="white">mdi-account-group-outline</v-icon></div>
            <div>
              <div class="nom-hero-title">NÓMINA</div>
              <div class="nom-hero-sub">Gestión de empleados, horarios, liquidaciones y recibos de pago</div>
            </div>
          </div>
          <div class="nom-hero-fecha">
            <v-icon size="13" color="rgba(255,255,255,.55)">mdi-calendar-outline</v-icon>
            {{ fechaHoy }}
          </div>
        </div>

        <!-- KPIs -->
        <div class="nom-kpi-row">
          <div class="nom-kpi" @click="go('/nomina/configuracion/empleados')">
            <div class="nom-kpi-icon"><v-icon size="18" color="#f9a8d4">mdi-account-check-outline</v-icon></div>
            <div>
              <div class="nom-kpi-val">
                <span v-if="!empLoading">{{ equipo.total }}</span>
                <span v-else class="nom-kpi-skel"></span>
              </div>
              <div class="nom-kpi-lbl">Empleados activos</div>
            </div>
          </div>
          <div class="nom-kpi" @click="go('/nomina/configuracion/empleados')">
            <div class="nom-kpi-icon"><v-icon size="18" color="#93c5fd">mdi-badge-account-outline</v-icon></div>
            <div>
              <div class="nom-kpi-val">
                <span v-if="!empLoading">{{ equipo.w2 }}</span>
                <span v-else class="nom-kpi-skel"></span>
              </div>
              <div class="nom-kpi-lbl">Empleados W2</div>
            </div>
          </div>
          <div class="nom-kpi" @click="go('/nomina/configuracion/empleados')">
            <div class="nom-kpi-icon"><v-icon size="18" color="#c4b5fd">mdi-account-hard-hat-outline</v-icon></div>
            <div>
              <div class="nom-kpi-val">
                <span v-if="!empLoading">{{ equipo.c1099 }}</span>
                <span v-else class="nom-kpi-skel"></span>
              </div>
              <div class="nom-kpi-lbl">Contratistas 1099</div>
            </div>
          </div>
          <div class="nom-kpi" @click="go('/nomina/procesos/horario')">
            <div class="nom-kpi-icon"><v-icon size="18" color="#6ee7b7">mdi-clock-outline</v-icon></div>
            <div>
              <div class="nom-kpi-val">
                <span v-if="!horasLoading">{{ totalHoras.toFixed(1) }}h</span>
                <span v-else class="nom-kpi-skel"></span>
              </div>
              <div class="nom-kpi-lbl">Horas esta semana</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════ CUERPO: NAVEGACIÓN + PANELES ═══════════ -->
      <div class="nom-body">

        <!-- ── Columna izquierda: navegación ── -->
        <div class="nom-nav">
          <div v-for="sec in secciones" :key="sec.label" class="nom-sec">
            <div class="nom-sec-label">
              <v-icon size="13" :color="sec.color">{{ sec.icon }}</v-icon>
              {{ sec.label }}
            </div>
            <div class="nom-grid">
              <div
                v-for="item in sec.items"
                :key="item.path"
                class="nom-card"
                :style="{ '--ac': sec.color }"
                @click="go(item.path)"
              >
                <div class="nom-card-icon" :style="{ background: sec.iconBg }">
                  <v-icon size="20" color="white">{{ item.icon }}</v-icon>
                </div>
                <div class="nom-card-body">
                  <div class="nom-card-title">{{ item.title }}</div>
                  <div class="nom-card-desc">{{ item.desc }}</div>
                </div>
                <v-icon size="15" :color="sec.color" class="nom-card-arrow">mdi-arrow-right</v-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Columna derecha: paneles en vivo ── -->
        <div class="nom-side">

          <!-- Equipo -->
          <div class="nom-panel">
            <div class="nom-panel-header">
              <div class="nom-panel-title">
                <v-icon size="14" color="#ec4899">mdi-account-group-outline</v-icon>
                EQUIPO ACTIVO
              </div>
              <button class="nom-panel-link" @click="go('/nomina/configuracion/empleados')">Ver empleados</button>
            </div>
            <div v-if="empLoading" class="nom-panel-loading">
              <v-progress-circular indeterminate size="20" width="2" color="#ec4899" />
            </div>
            <template v-else>
              <div v-if="equipo.total === 0" class="nom-panel-empty">
                <v-icon size="22" color="rgba(var(--v-theme-on-surface),.3)">mdi-account-off-outline</v-icon>
                <span>Sin empleados activos</span>
              </div>
              <template v-else>
                <!-- Chips W2 / 1099 / por horas / fijos -->
                <div class="nom-eq-chips">
                  <div class="nom-eq-chip nom-eq-w2">
                    <span class="nom-eq-chip-val">{{ equipo.w2 }}</span>
                    <span class="nom-eq-chip-lbl">W2</span>
                  </div>
                  <div class="nom-eq-chip nom-eq-1099">
                    <span class="nom-eq-chip-val">{{ equipo.c1099 }}</span>
                    <span class="nom-eq-chip-lbl">1099</span>
                  </div>
                  <div class="nom-eq-chip nom-eq-horas">
                    <span class="nom-eq-chip-val">{{ equipo.porHoras }}</span>
                    <span class="nom-eq-chip-lbl">Por horas</span>
                  </div>
                  <div class="nom-eq-chip nom-eq-fijo">
                    <span class="nom-eq-chip-val">{{ equipo.total - equipo.porHoras }}</span>
                    <span class="nom-eq-chip-lbl">Pago fijo</span>
                  </div>
                </div>
                <!-- Distribución por centro de costo -->
                <div class="nom-eq-sub">POR CENTRO DE COSTO</div>
                <div v-for="cc in equipo.porCcosto" :key="cc.nombre" class="nom-eq-row">
                  <span class="nom-eq-cc">{{ cc.nombre }}</span>
                  <span class="nom-eq-count">{{ cc.count }}</span>
                </div>
              </template>
            </template>
          </div>

          <!-- Horas de la semana por CCosto -->
          <div class="nom-panel">
            <div class="nom-panel-header">
              <div class="nom-panel-title">
                <v-icon size="14" color="#8b5cf6">mdi-clock-outline</v-icon>
                HORAS DE LA SEMANA
              </div>
              <button class="nom-panel-link" @click="go('/nomina/procesos/horario')">Ir a horario</button>
            </div>
            <div v-if="horasLoading" class="nom-panel-loading">
              <v-progress-circular indeterminate size="20" width="2" color="#8b5cf6" />
            </div>
            <template v-else>
              <div v-if="semanaInfo" class="nom-hr-semana">
                {{ fmtFechaCorta(semanaInfo.inicio) }} — {{ fmtFechaCorta(semanaInfo.fin) }}
              </div>
              <div v-if="horasCcosto.length === 0" class="nom-panel-empty">
                <v-icon size="22" color="rgba(var(--v-theme-on-surface),.3)">mdi-calendar-blank-outline</v-icon>
                <span>Sin horas registradas esta semana</span>
              </div>
              <div v-for="h in horasCcosto" :key="h.ccosto" class="nom-hr-row">
                <div class="nom-hr-top">
                  <span class="nom-hr-cc">{{ h.ccosto_nombre }}</span>
                  <span class="nom-hr-val">{{ h.horas.toFixed(1) }}h</span>
                </div>
                <div class="nom-hr-bar-track">
                  <div class="nom-hr-bar-fill" :style="{ width: barW(h.horas) + '%' }"></div>
                </div>
                <div class="nom-hr-meta">{{ h.empleados }} empleado{{ h.empleados !== 1 ? 's' : '' }}</div>
              </div>
              <div v-if="horasCcosto.length" class="nom-hr-total">
                <span>TOTAL</span>
                <span>{{ totalHoras.toFixed(1) }}h</span>
              </div>
            </template>
          </div>

        </div>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../components/layouts/MainLayout.vue'
import { useAuthStore } from '../stores/auth'
import { API_BASE } from '../utils/constants'

const router = useRouter()
const go = (path) => router.push(path)

const auth = useAuthStore()
const empresa = computed(() => auth.empresa)

// ─── Fecha de hoy formateada ─────────────────────────────────
const fechaHoy = computed(() => {
  const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  const s = new Date().toLocaleDateString('es-CO', opts)
  return s.charAt(0).toUpperCase() + s.slice(1)
})

// ─── Navegación (mismas rutas de siempre) ────────────────────
const secciones = [
  {
    label: 'CONFIGURACIÓN',
    icon: 'mdi-cog-outline',
    color: '#ec4899',
    iconBg: 'linear-gradient(135deg,#ec4899,#be185d)',
    items: [
      { path: '/nomina/configuracion/empleados',      icon: 'mdi-account-tie-outline', title: 'Empleados',       desc: 'Gestiona la plantilla, W2 y 1099' },
      { path: '/nomina/configuracion/cargos',         icon: 'mdi-briefcase-outline',   title: 'Cargos',          desc: 'Define los cargos y posiciones' },
      { path: '/nomina/configuracion/fiscal',         icon: 'mdi-file-cog-outline',    title: 'Config. Fiscal',  desc: 'Parámetros fiscales y tasas de impuestos' },
      { path: '/nomina/configuracion/horario-config', icon: 'mdi-clock-outline',       title: 'Config. Horario', desc: 'Tipos de horario y turnos' },
    ],
  },
  {
    label: 'PROCESOS',
    icon: 'mdi-lightning-bolt-outline',
    color: '#8b5cf6',
    iconBg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
    items: [
      { path: '/nomina/procesos/horario',     icon: 'mdi-calendar-week-outline', title: 'Horario Semanal',       desc: 'Registro de horas trabajadas por semana' },
      { path: '/nomina/procesos/liquidacion', icon: 'mdi-calculator',            title: 'Liquidación de Nómina', desc: 'Calcula y aprueba nóminas' },
      { path: '/nomina/procesos/propinas',    icon: 'mdi-cash-fast',             title: 'Gestión de Propinas',   desc: 'Reparte propinas del mes según horas trabajadas' },
    ],
  },
  {
    label: 'REPORTES',
    icon: 'mdi-chart-box-outline',
    color: '#f59e0b',
    iconBg: 'linear-gradient(135deg,#f59e0b,#d97706)',
    items: [
      { path: '/nomina/reportes/nomina',  icon: 'mdi-chart-bar',              title: 'Reporte de Nómina',  desc: 'Costos por período, empleado y CC' },
      { path: '/nomina/reportes/horario', icon: 'mdi-calendar-clock-outline', title: 'Reporte de Horario', desc: 'Horas trabajadas por empleado' },
      { path: '/nomina/reportes/recibos', icon: 'mdi-file-document-outline',  title: 'Recibos de Pago',    desc: 'Visualiza e imprime los recibos' },
      { path: '/nomina/reportes/propinas', icon: 'mdi-cash-fast',             title: 'Reporte de Propinas', desc: 'Propinas pagadas por empleado y período' },
    ],
  },
]

// ─── Equipo: empleados activos (W2/1099, por horas, por CC) ──
const empLoading = ref(true)
const equipo = ref({ total: 0, w2: 0, c1099: 0, porHoras: 0, porCcosto: [] })

async function cargarEquipo() {
  if (!empresa.value) { empLoading.value = false; return }
  try {
    const res = await fetch(`${API_BASE}/nomina/empleados?empresa=${empresa.value}&estado=ACTIVO`)
    const json = await res.json()
    if (!json.success) return
    const emps = json.data || []
    const porCc = {}
    for (const e of emps) {
      const cc = e.ccosto_nombre || e.ccosto || 'Sin CC'
      porCc[cc] = (porCc[cc] || 0) + 1
    }
    equipo.value = {
      total:    emps.length,
      w2:       emps.filter(e => e.tipo_empleado === 'W2').length,
      c1099:    emps.filter(e => e.tipo_empleado === '1099').length,
      porHoras: emps.filter(e => e.es_por_horas === true || e.es_por_horas === 'true').length,
      porCcosto: Object.entries(porCc)
        .map(([nombre, count]) => ({ nombre, count }))
        .sort((a, b) => b.count - a.count),
    }
  } catch (e) {
    console.error('cargarEquipo:', e)
  } finally {
    empLoading.value = false
  }
}

// ─── Horas de la semana por centro de costo ──────────────────
const horasLoading = ref(true)
const horasCcosto = ref([])
const semanaInfo = ref(null)
const totalHoras = computed(() => horasCcosto.value.reduce((s, h) => s + h.horas, 0))

async function cargarHoras() {
  if (!empresa.value) { horasLoading.value = false; return }
  try {
    const res = await fetch(`${API_BASE}/nomina/horas-semana?empresa=${empresa.value}`)
    const json = await res.json()
    if (json.success) {
      horasCcosto.value = json.data || []
      semanaInfo.value = json.semana
    }
  } catch (e) {
    console.error('cargarHoras:', e)
  } finally {
    horasLoading.value = false
  }
}

function barW(horas) {
  const max = Math.max(...horasCcosto.value.map(h => h.horas))
  if (!max || max <= 0) return 0
  const pct = (horas / max) * 100
  return pct < 4 ? 4 : pct
}

function fmtFechaCorta(f) {
  if (!f) return ''
  const d = new Date(String(f).substring(0, 10) + 'T12:00:00')
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

onMounted(() => {
  cargarEquipo()
  cargarHoras()
})
</script>

<style scoped>
.mod-container { padding: 24px; max-width: 1280px; margin: 0 auto; }

/* ═══ HERO ═══ */
.nom-hero {
  position: relative; overflow: hidden;
  border-radius: 18px; padding: 26px 28px 22px;
  background: linear-gradient(135deg, #831843 0%, #be185d 55%, #db2777 100%);
  margin-bottom: 24px;
  box-shadow: 0 10px 30px rgba(190, 24, 93, .25);
}
.nom-hero-glow {
  position: absolute; top: -60px; right: -40px;
  width: 260px; height: 260px; border-radius: 50%;
  background: radial-gradient(circle, rgba(249,168,212,.25), transparent 70%);
  pointer-events: none;
}
.nom-hero-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
.nom-hero-left { display: flex; align-items: center; gap: 16px; }
.nom-hero-icon {
  width: 56px; height: 56px; border-radius: 15px;
  background: rgba(255,255,255,.14); backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,.18);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.nom-hero-title { font-size: 24px; font-weight: 900; color: white; letter-spacing: 1px; }
.nom-hero-sub { font-size: 13px; color: rgba(255,255,255,.65); margin-top: 3px; }
.nom-hero-fecha {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: rgba(255,255,255,.6); font-weight: 500;
  background: rgba(255,255,255,.08); padding: 6px 12px; border-radius: 20px;
}

/* KPIs dentro del hero */
.nom-kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; position: relative; }
.nom-kpi {
  display: flex; align-items: center; gap: 12px;
  background: rgba(255,255,255,.09); backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 12px; padding: 12px 14px;
  cursor: pointer; transition: all .18s;
}
.nom-kpi:hover { background: rgba(255,255,255,.16); transform: translateY(-2px); }
.nom-kpi-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: rgba(255,255,255,.1);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.nom-kpi-val { font-size: 20px; font-weight: 800; color: white; line-height: 1.1; }
.nom-kpi-lbl { font-size: 10px; font-weight: 600; color: rgba(255,255,255,.6); text-transform: uppercase; letter-spacing: .4px; margin-top: 1px; }
.nom-kpi-skel { display: inline-block; width: 28px; height: 18px; border-radius: 4px; background: rgba(255,255,255,.2); animation: nomPulse 1.2s ease-in-out infinite; }
@keyframes nomPulse { 0%,100% { opacity: .4 } 50% { opacity: .9 } }

/* ═══ CUERPO ═══ */
.nom-body { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start; }
@media (max-width: 1000px) { .nom-body { grid-template-columns: 1fr; } }

/* Navegación */
.nom-sec { margin-bottom: 22px; }
.nom-sec-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .45);
  margin-bottom: 10px;
}
.nom-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; }
.nom-card {
  display: flex; align-items: center; gap: 13px;
  padding: 14px 15px; border-radius: 13px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), .07);
  cursor: pointer; transition: all .18s;
}
.nom-card:hover {
  border-color: var(--ac);
  box-shadow: 0 6px 18px rgba(0,0,0,.07);
  transform: translateY(-2px);
}
.nom-card-icon {
  width: 40px; height: 40px; border-radius: 11px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  box-shadow: 0 3px 8px rgba(0,0,0,.15);
}
.nom-card-body { flex: 1; min-width: 0; }
.nom-card-title { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
.nom-card-desc { font-size: 11px; color: rgba(var(--v-theme-on-surface), .5); line-height: 1.35; }
.nom-card-arrow { flex-shrink: 0; opacity: 0; transform: translateX(-4px); transition: all .18s; }
.nom-card:hover .nom-card-arrow { opacity: 1; transform: translateX(0); }

/* ═══ Paneles laterales ═══ */
.nom-side { display: flex; flex-direction: column; gap: 16px; }
.nom-panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), .07);
  border-radius: 14px; padding: 16px;
}
.nom-panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.nom-panel-title { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; letter-spacing: .8px; color: rgba(var(--v-theme-on-surface), .6); }
.nom-panel-link {
  border: none; background: transparent; cursor: pointer;
  font-size: 11px; font-weight: 700; color: #ec4899;
  padding: 2px 6px; border-radius: 6px; transition: background .15s;
}
.nom-panel-link:hover { background: rgba(236,72,153,.08); }
.nom-panel-loading { display: flex; justify-content: center; padding: 20px; }
.nom-panel-empty {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 18px 0; font-size: 12px; color: rgba(var(--v-theme-on-surface), .45);
}

/* Panel equipo: chips */
.nom-eq-chips { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
.nom-eq-chip {
  display: flex; flex-direction: column; align-items: center; gap: 1px;
  padding: 10px 6px; border-radius: 10px;
}
.nom-eq-w2    { background: rgba(59,130,246,.08);  }
.nom-eq-1099  { background: rgba(139,92,246,.08);  }
.nom-eq-horas { background: rgba(16,185,129,.08);  }
.nom-eq-fijo  { background: rgba(245,158,11,.08);  }
.nom-eq-chip-val { font-size: 18px; font-weight: 800; line-height: 1; }
.nom-eq-w2 .nom-eq-chip-val    { color: #3b82f6; }
.nom-eq-1099 .nom-eq-chip-val  { color: #8b5cf6; }
.nom-eq-horas .nom-eq-chip-val { color: #059669; }
.nom-eq-fijo .nom-eq-chip-val  { color: #d97706; }
.nom-eq-chip-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: rgba(var(--v-theme-on-surface), .5); }

.nom-eq-sub { font-size: 9px; font-weight: 800; letter-spacing: .8px; color: rgba(var(--v-theme-on-surface), .4); margin: 4px 0 6px; }
.nom-eq-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 10px; border-radius: 8px; transition: background .15s;
}
.nom-eq-row:hover { background: rgba(var(--v-theme-on-surface), .04); }
.nom-eq-cc { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nom-eq-count {
  flex-shrink: 0; min-width: 24px; text-align: center;
  padding: 2px 8px; border-radius: 10px;
  background: rgba(236,72,153,.1); color: #db2777;
  font-size: 11px; font-weight: 800;
}

/* Panel horas: barras por ccosto */
.nom-hr-semana {
  font-size: 10px; font-weight: 700; color: rgba(var(--v-theme-on-surface), .45);
  background: rgba(var(--v-theme-on-surface), .04);
  padding: 4px 10px; border-radius: 12px; display: inline-block; margin-bottom: 10px;
}
.nom-hr-row { padding: 6px 4px 8px; }
.nom-hr-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.nom-hr-cc { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nom-hr-val { font-family: monospace; font-size: 12px; font-weight: 700; color: #8b5cf6; flex-shrink: 0; }
.nom-hr-bar-track { height: 6px; border-radius: 3px; background: rgba(var(--v-theme-on-surface), .06); overflow: hidden; }
.nom-hr-bar-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg,#8b5cf6,#d946ef); transition: width .3s; }
.nom-hr-meta { font-size: 10px; color: rgba(var(--v-theme-on-surface), .4); margin-top: 3px; }
.nom-hr-total {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 8px; padding: 10px 4px 2px;
  border-top: 2px solid rgba(var(--v-theme-on-surface), .08);
  font-size: 11px; font-weight: 800; letter-spacing: .4px;
}
.nom-hr-total span:last-child { font-family: monospace; font-size: 13px; color: #8b5cf6; }
</style>
