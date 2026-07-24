<template>
  <MainLayout>
    <div class="mod-container">

      <!-- ═══════════ HERO CON KPIs EN VIVO ═══════════ -->
      <div class="cbl-hero">
        <div class="cbl-hero-glow"></div>
        <div class="cbl-hero-top">
          <div class="cbl-hero-left">
            <div class="cbl-hero-icon"><v-icon size="30" color="white">mdi-calculator-variant-outline</v-icon></div>
            <div>
              <div class="cbl-hero-title">CONTABILIDAD</div>
              <div class="cbl-hero-sub">Gestión de gastos, cuentas contables, centros de costo y reportes financieros</div>
            </div>
          </div>
          <div class="cbl-hero-fecha">
            <v-icon size="13" color="rgba(255,255,255,.55)">mdi-calendar-outline</v-icon>
            {{ fechaHoy }}
          </div>
        </div>

        <!-- KPIs -->
        <div class="cbl-kpi-row">
          <div class="cbl-kpi" @click="go('/contabilidad/reportes/gastos')">
            <div class="cbl-kpi-icon"><v-icon size="18" color="#10b981">mdi-cash-plus</v-icon></div>
            <div>
              <div class="cbl-kpi-val">
                <span v-if="!dashLoading">{{ fmt(kpis.ingresos.total) }}</span>
                <span v-else class="cbl-kpi-skel"></span>
              </div>
              <div class="cbl-kpi-lbl">Ingresos</div>
            </div>
          </div>
          <div class="cbl-kpi" @click="go('/contabilidad/procesos/gastos')">
            <div class="cbl-kpi-icon"><v-icon size="18" color="#f59e0b">mdi-factory</v-icon></div>
            <div>
              <div class="cbl-kpi-val">
                <span v-if="!dashLoading">{{ fmt(kpis.comprasMP.total) }}</span>
                <span v-else class="cbl-kpi-skel"></span>
              </div>
              <div class="cbl-kpi-lbl">Compras M.P.</div>
            </div>
          </div>
          <div class="cbl-kpi" @click="go('/contabilidad/reportes/gastos')">
            <div class="cbl-kpi-icon"><v-icon size="18" color="#ef4444">mdi-account-tie-outline</v-icon></div>
            <div>
              <div class="cbl-kpi-val">
                <span v-if="!dashLoading">{{ fmt(kpis.nomina.total) }}</span>
                <span v-else class="cbl-kpi-skel"></span>
              </div>
              <div class="cbl-kpi-lbl">Nómina</div>
            </div>
          </div>
          <div class="cbl-kpi" @click="go('/contabilidad/reportes/gastos')">
            <div class="cbl-kpi-icon"><v-icon size="18" color="#8b5cf6">mdi-chart-line</v-icon></div>
            <div>
              <div class="cbl-kpi-val">
                <span v-if="!dashLoading">{{ fmt(kpis.gastosGenerales.total) }}</span>
                <span v-else class="cbl-kpi-skel"></span>
              </div>
              <div class="cbl-kpi-lbl">Gastos Generales</div>
            </div>
          </div>
          <div class="cbl-kpi" @click="go('/contabilidad/reportes/gastos')">
            <div class="cbl-kpi-icon"><v-icon size="18" color="#ec4899">mdi-calculator-variant</v-icon></div>
            <div>
              <div class="cbl-kpi-val">
                <span v-if="!dashLoading">{{ fmt(kpis.impuestos.total) }}</span>
                <span v-else class="cbl-kpi-skel"></span>
              </div>
              <div class="cbl-kpi-lbl">Impuestos</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════ CUERPO: NAVEGACIÓN + PANELES ═══════════ -->
      <div class="cbl-body">

        <!-- ── Columna izquierda: navegación ── -->
        <div class="cbl-nav">
          <div v-for="sec in secciones" :key="sec.label" class="cbl-sec">
            <div class="cbl-sec-label">
              <v-icon size="13" :color="sec.color">{{ sec.icon }}</v-icon>
              {{ sec.label }}
            </div>
            <div class="cbl-grid">
              <div
                v-for="item in sec.items"
                :key="item.path"
                class="cbl-card"
                :style="{ '--ac': sec.color }"
                @click="go(item.path)"
              >
                <div class="cbl-card-icon" :style="{ background: sec.iconBg }">
                  <v-icon size="20" color="white">{{ item.icon }}</v-icon>
                </div>
                <div class="cbl-card-body">
                  <div class="cbl-card-title">{{ item.title }}</div>
                  <div class="cbl-card-desc">{{ item.desc }}</div>
                </div>
                <v-icon size="15" :color="sec.color" class="cbl-card-arrow">mdi-arrow-right</v-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Columna derecha: paneles en vivo ── -->
        <div class="cbl-side">

          <!-- Movimientos del mes por grupo -->
          <div class="cbl-panel">
            <div class="cbl-panel-header">
              <div class="cbl-panel-title">
                <v-icon size="14" color="#8b5cf6">mdi-chart-pie</v-icon>
                MOVIMIENTOS DEL MES
              </div>
              <button class="cbl-panel-link" @click="go('/contabilidad/reportes/gastos')">Ver reporte</button>
            </div>
            <div v-if="dashLoading" class="cbl-panel-loading">
              <v-progress-circular indeterminate size="20" width="2" color="#8b5cf6" />
            </div>
            <template v-else>
              <div v-if="pyg.length === 0" class="cbl-panel-empty">
                <v-icon size="22" color="rgba(var(--v-theme-on-surface),.3)">mdi-file-remove-outline</v-icon>
                <span>Sin movimientos este mes</span>
              </div>
              <div v-for="g in pyg" :key="g.grupo" :class="['cbl-pyg-row', g.bold && 'cbl-pyg-bold', g.tipo === 'subtotal-ingreso' && 'cbl-pyg-subtotal-ingreso', g.tipo === 'subtotal-gasto' && 'cbl-pyg-subtotal-gasto', g.tipo === 'utilidad' && (g.total >= 0 ? 'cbl-pyg-utilidad-pos' : 'cbl-pyg-utilidad-neg')]">
                <div class="cbl-pyg-top">
                  <span class="cbl-pyg-grupo">{{ g.grupo }}</span>
                  <span class="cbl-pyg-val" :class="g.bold && 'cbl-pyg-val-bold'">{{ fmt(g.total) }}</span>
                </div>
                <div v-if="!g.bold && g.tipo !== 'utilidad'" class="cbl-pyg-bar-track">
                  <div class="cbl-pyg-bar-fill" :style="{ width: barW(g.total) + '%', background: g.tipo === 'ingreso' ? 'linear-gradient(90deg,#10b981,#059669)' : 'linear-gradient(90deg,#f59e0b,#d97706)' }"></div>
                </div>
                <div v-if="g.cantidad > 0" class="cbl-pyg-meta">{{ g.cantidad }} registro{{ g.cantidad !== 1 ? 's' : '' }}</div>
              </div>
            </template>
          </div>

          <!-- Últimos gastos -->
          <div class="cbl-panel">
            <div class="cbl-panel-header">
              <div class="cbl-panel-title">
                <v-icon size="14" color="#06b6d4">mdi-history</v-icon>
                ÚLTIMOS GASTOS
              </div>
              <button class="cbl-panel-link" @click="go('/contabilidad/procesos/gastos')">Ver todos</button>
            </div>
            <div v-if="dashLoading" class="cbl-panel-loading">
              <v-progress-circular indeterminate size="20" width="2" color="#06b6d4" />
            </div>
            <template v-else>
              <div v-if="ultimosGastos.length === 0" class="cbl-panel-empty">
                <v-icon size="22" color="rgba(var(--v-theme-on-surface),.3)">mdi-receipt-text-remove-outline</v-icon>
                <span>Sin gastos registrados</span>
              </div>
              <div v-for="g in ultimosGastos" :key="g.codigo" class="cbl-gasto-row">
                <div class="cbl-gasto-info">
                  <div class="cbl-gasto-prov">{{ g.proveedor_nombre }}</div>
                  <div class="cbl-gasto-meta">{{ fmtFecha(g.fecha) }}<template v-if="g.concepto"> · {{ g.concepto }}</template></div>
                </div>
                <span class="cbl-gasto-val">{{ fmt(g.total) }}</span>
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

// ─── Fecha / mes actual ──────────────────────────────────────
const fechaHoy = computed(() => {
  const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  const s = new Date().toLocaleDateString('es-CO', opts)
  return s.charAt(0).toUpperCase() + s.slice(1)
})
const mesActual = computed(() =>
  new Date().toLocaleDateString('es-CO', { month: 'long' }).toUpperCase()
)

// ─── Formato moneda ──────────────────────────────────────────
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

// ─── Navegación (mismas rutas de siempre) ────────────────────
const secciones = [
  {
    label: 'CONFIGURACIÓN',
    icon: 'mdi-cog-outline',
    color: '#8b5cf6',
    iconBg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
    items: [
      { path: '/contabilidad/configuracion/proveedores',       icon: 'mdi-truck-outline',        title: 'Proveedores',       desc: 'Gestiona el catálogo de proveedores' },
      { path: '/contabilidad/configuracion/centros-costos',    icon: 'mdi-sitemap-outline',      title: 'Centros de Costo',  desc: 'Define y gestiona los centros de costo' },
      { path: '/contabilidad/configuracion/cuentas-bancarias', icon: 'mdi-bank-outline',         title: 'Cuentas Bancarias', desc: 'Registra las cuentas bancarias' },
      { path: '/contabilidad/configuracion/cuentas-contables', icon: 'mdi-book-account-outline', title: 'Cuentas Contables', desc: 'Plan de cuentas y catálogo contable' },
    ],
  },
  {
    label: 'PROCESOS',
    icon: 'mdi-lightning-bolt-outline',
    color: '#06b6d4',
    iconBg: 'linear-gradient(135deg,#06b6d4,#0e7490)',
    items: [
      { path: '/contabilidad/procesos/gastos', icon: 'mdi-receipt-text-outline', title: 'Gestión de Gastos', desc: 'Registro y control de gastos operativos' },
    ],
  },
  {
    label: 'REPORTES',
    icon: 'mdi-chart-box-outline',
    color: '#f43f5e',
    iconBg: 'linear-gradient(135deg,#f43f5e,#be123c)',
    items: [
      { path: '/contabilidad/reportes/gastos', icon: 'mdi-file-chart-outline', title: 'Reporte de Gastos', desc: 'Análisis por período y centro de costo' },
      { path: '/contabilidad/reportes/estado-resultados', icon: 'mdi-chart-line-stacked', title: 'Estado de Resultados', desc: 'P&L por período y centro de costo' },
    ],
  },
]

// ─── Dashboard: KPIs + P&G del mes + últimos gastos ─────────────────
const dashLoading = ref(true)
const kpis = ref({
  ingresos: { grupo: 'INGRESOS', total: 0, cantidad: 0 },
  comprasMP: { grupo: 'COMPRAS MATERIA PRIMA', total: 0, cantidad: 0 },
  nomina: { grupo: 'NÓMINA', total: 0, cantidad: 0 },
  gastosGenerales: { grupo: 'GASTOS GENERALES', total: 0, cantidad: 0 },
  otros: { grupo: 'OTROS', total: 0, cantidad: 0 },
  impuestos: { grupo: 'IMPUESTOS', total: 0, cantidad: 0 },
})
const pyg = ref([])
const totalMes = ref(0)
const cantidadMes = ref(0)
const ultimosGastos = ref([])

async function cargarDashboard() {
  if (!empresa.value) { dashLoading.value = false; return }
  try {
    const res = await fetch(`${API_BASE}/contabilidad/dashboard?empresa=${empresa.value}`)
    const json = await res.json()
    if (json.success && json.data) {
      kpis.value = json.data.kpis || kpis.value
      pyg.value = json.data.pyg || []
      totalMes.value = json.data.totalMes || 0
      cantidadMes.value = json.data.cantidadMes || 0
      ultimosGastos.value = json.data.ultimosGastos || []
    }
  } catch (e) {
    console.error('cargarDashboard:', e)
  } finally {
    dashLoading.value = false
  }
}

function barW(total) {
  const max = Math.max(...pyg.value.map(g => g.total))
  if (!max || max <= 0) return 0
  const p = (total / max) * 100
  return p < 4 ? 4 : p
}

function pct(total) {
  if (!totalMes.value) return '0'
  return ((total / totalMes.value) * 100).toFixed(1)
}

onMounted(() => {
  cargarDashboard()
})
</script>

<style scoped>
.mod-container { padding: 24px; max-width: 1280px; margin: 0 auto; }

/* ═══ HERO ═══ */
.cbl-hero {
  position: relative; overflow: hidden;
  border-radius: 18px; padding: 26px 28px 22px;
  background: linear-gradient(135deg, #4c1d95 0%, #6d28d9 55%, #7c3aed 100%);
  margin-bottom: 24px;
  box-shadow: 0 10px 30px rgba(109, 40, 217, .25);
}
.cbl-hero-glow {
  position: absolute; top: -60px; right: -40px;
  width: 260px; height: 260px; border-radius: 50%;
  background: radial-gradient(circle, rgba(196,181,253,.25), transparent 70%);
  pointer-events: none;
}
.cbl-hero-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
.cbl-hero-left { display: flex; align-items: center; gap: 16px; }
.cbl-hero-icon {
  width: 56px; height: 56px; border-radius: 15px;
  background: rgba(255,255,255,.14); backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,.18);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.cbl-hero-title { font-size: 24px; font-weight: 900; color: white; letter-spacing: 1px; }
.cbl-hero-sub { font-size: 13px; color: rgba(255,255,255,.65); margin-top: 3px; }
.cbl-hero-fecha {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: rgba(255,255,255,.6); font-weight: 500;
  background: rgba(255,255,255,.08); padding: 6px 12px; border-radius: 20px;
}

/* KPIs dentro del hero */
.cbl-kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; position: relative; }
.cbl-kpi {
  display: flex; align-items: center; gap: 12px;
  background: rgba(255,255,255,.09); backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 12px; padding: 12px 14px;
  cursor: pointer; transition: all .18s;
}
.cbl-kpi:hover { background: rgba(255,255,255,.16); transform: translateY(-2px); }
.cbl-kpi-warn { border-color: rgba(252,211,77,.3); }
.cbl-kpi-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: rgba(255,255,255,.1);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.cbl-kpi-val { font-size: 17px; font-weight: 800; color: white; line-height: 1.1; white-space: nowrap; }
.cbl-kpi-val-txt { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 170px; }
.cbl-kpi-lbl { font-size: 10px; font-weight: 600; color: rgba(255,255,255,.6); text-transform: uppercase; letter-spacing: .4px; margin-top: 1px; }
.cbl-kpi-skel { display: inline-block; width: 60px; height: 16px; border-radius: 4px; background: rgba(255,255,255,.2); animation: cblPulse 1.2s ease-in-out infinite; }
@keyframes cblPulse { 0%,100% { opacity: .4 } 50% { opacity: .9 } }

/* ═══ CUERPO ═══ */
.cbl-body { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start; }
@media (max-width: 1000px) { .cbl-body { grid-template-columns: 1fr; } }

/* Navegación */
.cbl-sec { margin-bottom: 22px; }
.cbl-sec-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .45);
  margin-bottom: 10px;
}
.cbl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; }
.cbl-card {
  display: flex; align-items: center; gap: 13px;
  padding: 14px 15px; border-radius: 13px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), .07);
  cursor: pointer; transition: all .18s;
}
.cbl-card:hover {
  border-color: var(--ac);
  box-shadow: 0 6px 18px rgba(0,0,0,.07);
  transform: translateY(-2px);
}
.cbl-card-icon {
  width: 40px; height: 40px; border-radius: 11px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  box-shadow: 0 3px 8px rgba(0,0,0,.15);
}
.cbl-card-body { flex: 1; min-width: 0; }
.cbl-card-title { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
.cbl-card-desc { font-size: 11px; color: rgba(var(--v-theme-on-surface), .5); line-height: 1.35; }
.cbl-card-arrow { flex-shrink: 0; opacity: 0; transform: translateX(-4px); transition: all .18s; }
.cbl-card:hover .cbl-card-arrow { opacity: 1; transform: translateX(0); }

/* ═══ Paneles laterales ═══ */
.cbl-side { display: flex; flex-direction: column; gap: 16px; }
.cbl-panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), .07);
  border-radius: 14px; padding: 16px;
}
.cbl-panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.cbl-panel-title { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; letter-spacing: .8px; color: rgba(var(--v-theme-on-surface), .6); }
.cbl-panel-link {
  border: none; background: transparent; cursor: pointer;
  font-size: 11px; font-weight: 700; color: #8b5cf6;
  padding: 2px 6px; border-radius: 6px; transition: background .15s;
}
.cbl-panel-link:hover { background: rgba(139,92,246,.08); }
.cbl-panel-loading { display: flex; justify-content: center; padding: 20px; }
.cbl-panel-empty {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 18px 0; font-size: 12px; color: rgba(var(--v-theme-on-surface), .45);
}

/* P&G: barras por grupo */
.cbl-pyg-row { padding: 6px 4px 8px; }
.cbl-pyg-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; gap: 8px; }
.cbl-pyg-grupo { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cbl-pyg-val { font-family: monospace; font-size: 12px; font-weight: 700; color: #8b5cf6; flex-shrink: 0; }
.cbl-pyg-bar-track { height: 6px; border-radius: 3px; background: rgba(var(--v-theme-on-surface), .06); overflow: hidden; }
.cbl-pyg-bar-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg,#8b5cf6,#d946ef); transition: width .3s; }
.cbl-pyg-meta { font-size: 10px; color: rgba(var(--v-theme-on-surface), .4); margin-top: 3px; }
.cbl-pyg-bold {
  padding: 10px 8px 8px !important;
  margin-top: 12px;
  border-radius: 8px;
  border: 1px solid;
}
.cbl-pyg-bold .cbl-pyg-grupo { font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: .3px; }
.cbl-pyg-val-bold { font-size: 13px !important; font-weight: 900 !important; }
.cbl-pyg-subtotal-ingreso {
  background: rgba(16,185,129,.12) !important;
  border-color: rgba(16,185,129,.25) !important;
}
.cbl-pyg-subtotal-ingreso .cbl-pyg-val-bold { color: #047857 !important; }
.cbl-pyg-subtotal-gasto {
  background: rgba(239,68,68,.12) !important;
  border-color: rgba(239,68,68,.25) !important;
  margin-top: 16px !important;
}
.cbl-pyg-subtotal-gasto .cbl-pyg-val-bold { color: #b91c1c !important; }
.cbl-pyg-utilidad-pos { background: rgba(16,185,129,.12) !important; border-color: rgba(16,185,129,.25) !important; margin-top: 12px !important; }
.cbl-pyg-utilidad-pos .cbl-pyg-val-bold { color: #047857 !important; }
.cbl-pyg-utilidad-neg { background: rgba(239,68,68,.12) !important; border-color: rgba(239,68,68,.25) !important; margin-top: 12px !important; }
.cbl-pyg-utilidad-neg .cbl-pyg-val-bold { color: #b91c1c !important; }
.cbl-pyg-total {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 8px; padding: 10px 4px 2px;
  border-top: 2px solid rgba(var(--v-theme-on-surface), .08);
  font-size: 11px; font-weight: 800; letter-spacing: .4px;
}
.cbl-pyg-total span:last-child { font-family: monospace; font-size: 13px; color: #8b5cf6; }

/* Últimos gastos */
.cbl-gasto-row {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 7px 8px; border-radius: 9px; transition: background .15s;
}
.cbl-gasto-row:hover { background: rgba(var(--v-theme-on-surface), .035); }
.cbl-gasto-info { min-width: 0; }
.cbl-gasto-prov { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cbl-gasto-meta { font-size: 10px; color: rgba(var(--v-theme-on-surface), .45); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
.cbl-gasto-val { flex-shrink: 0; font-family: monospace; font-size: 12px; font-weight: 700; color: #06b6d4; }
</style>
