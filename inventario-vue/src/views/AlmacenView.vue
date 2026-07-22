<template>
  <MainLayout>
    <div class="mod-container">

      <!-- ═══════════ HERO CON KPIs EN VIVO ═══════════ -->
      <div class="alm-hero">
        <div class="alm-hero-glow"></div>
        <div class="alm-hero-top">
          <div class="alm-hero-left">
            <div class="alm-hero-icon"><v-icon size="30" color="white">mdi-warehouse</v-icon></div>
            <div>
              <div class="alm-hero-title">ALMACÉN</div>
              <div class="alm-hero-sub">Control de inventario, stock, toma física y órdenes de compra</div>
            </div>
          </div>
          <div class="alm-hero-fecha">
            <v-icon size="13" color="rgba(255,255,255,.55)">mdi-calendar-outline</v-icon>
            {{ fechaHoy }}
          </div>
        </div>

        <!-- KPIs -->
        <div class="alm-kpi-row">
          <div class="alm-kpi" @click="go('/almacen/reportes/kardex-consolidado')">
            <div class="alm-kpi-icon"><v-icon size="18" color="#6ee7b7">mdi-package-variant-closed</v-icon></div>
            <div>
              <div class="alm-kpi-val">
                <span v-if="!kpisLoading">{{ kpis.conStock }}</span>
                <span v-else class="alm-kpi-skel"></span>
              </div>
              <div class="alm-kpi-lbl">Productos con stock</div>
            </div>
          </div>
          <div class="alm-kpi alm-kpi-danger" @click="go('/almacen/reportes/prediccion-agotamiento')">
            <div class="alm-kpi-icon"><v-icon size="18" color="#fca5a5">mdi-alert-circle-outline</v-icon></div>
            <div>
              <div class="alm-kpi-val">
                <span v-if="!kpisLoading">{{ kpis.enPeligro }}</span>
                <span v-else class="alm-kpi-skel"></span>
              </div>
              <div class="alm-kpi-lbl">Se agotan en &lt; 7 días</div>
            </div>
          </div>
          <div class="alm-kpi alm-kpi-warn" @click="go('/almacen/reportes/prediccion-agotamiento')">
            <div class="alm-kpi-icon"><v-icon size="18" color="#fcd34d">mdi-alert-outline</v-icon></div>
            <div>
              <div class="alm-kpi-val">
                <span v-if="!kpisLoading">{{ kpis.enAlerta }}</span>
                <span v-else class="alm-kpi-skel"></span>
              </div>
              <div class="alm-kpi-lbl">En alerta (7-14 días)</div>
            </div>
          </div>
          <div class="alm-kpi" @click="go('/almacen/procesos/gestion-inventario')">
            <div class="alm-kpi-icon"><v-icon size="18" color="#7dd3fc">mdi-swap-vertical-bold</v-icon></div>
            <div>
              <div class="alm-kpi-val">
                <span v-if="!movsLoading">{{ movimientos.length }}</span>
                <span v-else class="alm-kpi-skel"></span>
              </div>
              <div class="alm-kpi-lbl">Movimientos (7 días)</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════ CUERPO: NAVEGACIÓN + PANELES ═══════════ -->
      <div class="alm-body">

        <!-- ── Columna izquierda: navegación ── -->
        <div class="alm-nav">
          <div v-for="sec in secciones" :key="sec.label" class="alm-sec">
            <div class="alm-sec-label">
              <v-icon size="13" :color="sec.color">{{ sec.icon }}</v-icon>
              {{ sec.label }}
            </div>
            <div class="alm-grid">
              <div
                v-for="item in sec.items"
                :key="item.path"
                class="alm-card"
                :style="{ '--ac': sec.color }"
                @click="go(item.path)"
              >
                <div class="alm-card-icon" :style="{ background: sec.iconBg }">
                  <v-icon size="20" color="white">{{ item.icon }}</v-icon>
                </div>
                <div class="alm-card-body">
                  <div class="alm-card-title">{{ item.title }}</div>
                  <div class="alm-card-desc">{{ item.desc }}</div>
                </div>
                <v-icon size="15" :color="sec.color" class="alm-card-arrow">mdi-arrow-right</v-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Columna derecha: paneles en vivo ── -->
        <div class="alm-side">

          <!-- Próximos a agotarse -->
          <div class="alm-panel">
            <div class="alm-panel-header">
              <div class="alm-panel-title">
                <v-icon size="14" color="#ef4444">mdi-fire</v-icon>
                PRÓXIMOS A AGOTARSE
              </div>
              <button class="alm-panel-link" @click="go('/almacen/reportes/prediccion-agotamiento')">Ver todo</button>
            </div>
            <div v-if="kpisLoading" class="alm-panel-loading">
              <v-progress-circular indeterminate size="20" width="2" color="#10b981" />
            </div>
            <template v-else>
              <div v-if="criticos.length === 0" class="alm-panel-empty">
                <v-icon size="22" color="#10b981">mdi-check-circle-outline</v-icon>
                <span>Sin productos en riesgo</span>
              </div>
              <div
                v-for="p in criticos"
                :key="p.codigo"
                class="alm-crit-row"
                @click="go('/almacen/reportes/prediccion-agotamiento')"
              >
                <div class="alm-crit-info">
                  <div class="alm-crit-nombre">{{ p.nombre }}</div>
                  <div class="alm-crit-meta">Stock: {{ parseFloat(p.stock_actual).toFixed(1) }} {{ p.und }}</div>
                </div>
                <span :class="`alm-crit-badge alm-crit-${p.alerta.toLowerCase()}`">
                  {{ p.dias_restantes }}d
                </span>
              </div>
            </template>
          </div>

          <!-- Actividad reciente -->
          <div class="alm-panel">
            <div class="alm-panel-header">
              <div class="alm-panel-title">
                <v-icon size="14" color="#06b6d4">mdi-history</v-icon>
                ACTIVIDAD RECIENTE
              </div>
              <button class="alm-panel-link" @click="go('/almacen/procesos/gestion-inventario')">Ir a gestión</button>
            </div>
            <div v-if="movsLoading" class="alm-panel-loading">
              <v-progress-circular indeterminate size="20" width="2" color="#06b6d4" />
            </div>
            <template v-else>
              <div v-if="movimientos.length === 0" class="alm-panel-empty">
                <v-icon size="22" color="rgba(var(--v-theme-on-surface),.3)">mdi-sleep</v-icon>
                <span>Sin movimientos esta semana</span>
              </div>
              <div v-for="(m, i) in movimientos.slice(0, 6)" :key="i" class="alm-mov-row">
                <span :class="`alm-mov-tipo alm-mov-${(m.tipo_fe || '').toLowerCase()}`">{{ m.tipo_fe }}</span>
                <div class="alm-mov-info">
                  <div class="alm-mov-cc">{{ m.ccosto_nombre || m.ccosto }}</div>
                  <div class="alm-mov-meta">{{ fmtFechaCorta(m.fecha) }} · {{ (m.productos || []).length }} producto{{ (m.productos || []).length !== 1 ? 's' : '' }}</div>
                </div>
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
    color: '#10b981',
    iconBg: 'linear-gradient(135deg,#10b981,#047857)',
    items: [
      { path: '/almacen/configuracion/productos',           icon: 'mdi-package-variant',          title: 'Productos',                      desc: 'Catálogo de productos del inventario' },
      { path: '/almacen/configuracion/control-inventario',  icon: 'mdi-tune-vertical',            title: 'Control de Inventario',          desc: 'Parámetros y niveles de stock mínimo' },
      { path: '/almacen/configuracion/impresion-barcodes',  icon: 'mdi-barcode',                  title: 'Códigos de Barras',              desc: 'Etiquetas con nombre y código' },
      { path: '/almacen/configuracion/grupo-productos',     icon: 'mdi-folder-multiple-outline',  title: 'Grupo de Productos',             desc: 'Categorías para organizar el catálogo' },
    ],
  },
  {
    label: 'PROCESOS',
    icon: 'mdi-lightning-bolt-outline',
    color: '#0ea5e9',
    iconBg: 'linear-gradient(135deg,#0ea5e9,#0369a1)',
    items: [
      { path: '/almacen/procesos/gestion-inventario', icon: 'mdi-clipboard-list-outline', title: 'Gestión de Inventario', desc: 'Entradas, salidas y ajustes de stock' },
      { path: '/almacen/procesos/toma-fisica',        icon: 'mdi-barcode-scan',           title: 'Toma Física',           desc: 'Conteo físico de inventario y ajustes' },
      { path: '/almacen/procesos/valoracion',         icon: 'mdi-currency-usd',           title: 'Valoración',            desc: 'Valor del inventario por costo promedio' },
      { path: '/almacen/procesos/ordenes-compra',     icon: 'mdi-cart-outline',           title: 'Órdenes de Compra',     desc: 'Gestiona órdenes a proveedores' },
    ],
  },
  {
    label: 'REPORTES',
    icon: 'mdi-chart-box-outline',
    color: '#8b5cf6',
    iconBg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
    items: [
      { path: '/almacen/reportes/kardex',                 icon: 'mdi-file-chart-outline',  title: 'Kardex',                  desc: 'Movimientos históricos por producto' },
      { path: '/almacen/reportes/consumos',               icon: 'mdi-chart-bar',           title: 'Reporte de Consumos',     desc: 'Consumo de productos por período' },
      { path: '/almacen/reportes/consumo-insumos',        icon: 'mdi-package-down',        title: 'Consumo de Insumos',      desc: 'Traslados desde bodega maestra' },
      { path: '/almacen/reportes/movimiento-producto',    icon: 'mdi-swap-vertical-bold',  title: 'Movimiento por Producto', desc: 'Detalle día a día por rango y CC' },
      { path: '/almacen/reportes/kardex-consolidado',     icon: 'mdi-table-multiple',      title: 'Kardex Consolidado',      desc: 'Stock actual por centro de costos' },
      { path: '/almacen/reportes/prediccion-agotamiento', icon: 'mdi-chart-box-outline',   title: 'Predicción Agotamiento',  desc: 'Cuándo se acabará el stock' },
      { path: '/almacen/reportes/valoracion-mensual',     icon: 'mdi-calculator-variant',  title: 'Valoración Mensual',      desc: 'Consumo de MP y juego de inventarios' },
    ],
  },
]

// ─── KPIs + productos críticos (desde predicción de agotamiento) ──
const kpisLoading = ref(true)
const kpis = ref({ conStock: 0, enPeligro: 0, enAlerta: 0 })
const criticos = ref([])

async function cargarKpis() {
  if (!empresa.value) { kpisLoading.value = false; return }
  try {
    const res = await fetch(`${API_BASE}/almacen/prediccion-agotamiento?empresa=${empresa.value}&dias=30`)
    const json = await res.json()
    if (json.success === false) return
    const data = json.data || []
    kpis.value = {
      conStock:  data.length,
      enPeligro: data.filter(d => d.alerta === 'PELIGRO').length,
      enAlerta:  data.filter(d => d.alerta === 'ALERTA').length,
    }
    criticos.value = data.filter(d => d.dias_restantes !== null).slice(0, 6)
  } catch (e) {
    console.error('cargarKpis:', e)
  } finally {
    kpisLoading.value = false
  }
}

// ─── Movimientos recientes (últimos 7 días) ──────────────────
const movsLoading = ref(true)
const movimientos = ref([])

async function cargarMovimientos() {
  if (!empresa.value) { movsLoading.value = false; return }
  try {
    const res = await fetch(`${API_BASE}/almacen/movimientos-recientes?empresa=${empresa.value}&dias=7`)
    const json = await res.json()
    if (json.success) movimientos.value = json.data || []
  } catch (e) {
    console.error('cargarMovimientos:', e)
  } finally {
    movsLoading.value = false
  }
}

function fmtFechaCorta(f) {
  if (!f) return ''
  const d = new Date(String(f).substring(0, 10) + 'T12:00:00')
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

onMounted(() => {
  cargarKpis()
  cargarMovimientos()
})
</script>

<style scoped>
.mod-container { padding: 24px; max-width: 1280px; margin: 0 auto; }

/* ═══ HERO ═══ */
.alm-hero {
  position: relative; overflow: hidden;
  border-radius: 18px; padding: 26px 28px 22px;
  background: linear-gradient(135deg, #064e3b 0%, #047857 55%, #059669 100%);
  margin-bottom: 24px;
  box-shadow: 0 10px 30px rgba(4, 120, 87, .25);
}
.alm-hero-glow {
  position: absolute; top: -60px; right: -40px;
  width: 260px; height: 260px; border-radius: 50%;
  background: radial-gradient(circle, rgba(110,231,183,.25), transparent 70%);
  pointer-events: none;
}
.alm-hero-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
.alm-hero-left { display: flex; align-items: center; gap: 16px; }
.alm-hero-icon {
  width: 56px; height: 56px; border-radius: 15px;
  background: rgba(255,255,255,.14); backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,.18);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.alm-hero-title { font-size: 24px; font-weight: 900; color: white; letter-spacing: 1px; }
.alm-hero-sub { font-size: 13px; color: rgba(255,255,255,.65); margin-top: 3px; }
.alm-hero-fecha {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: rgba(255,255,255,.6); font-weight: 500;
  background: rgba(255,255,255,.08); padding: 6px 12px; border-radius: 20px;
}

/* KPIs dentro del hero */
.alm-kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; position: relative; }
.alm-kpi {
  display: flex; align-items: center; gap: 12px;
  background: rgba(255,255,255,.09); backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 12px; padding: 12px 14px;
  cursor: pointer; transition: all .18s;
}
.alm-kpi:hover { background: rgba(255,255,255,.16); transform: translateY(-2px); }
.alm-kpi-danger { border-color: rgba(252,165,165,.35); }
.alm-kpi-warn { border-color: rgba(252,211,77,.3); }
.alm-kpi-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: rgba(255,255,255,.1);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.alm-kpi-val { font-size: 20px; font-weight: 800; color: white; line-height: 1.1; }
.alm-kpi-lbl { font-size: 10px; font-weight: 600; color: rgba(255,255,255,.6); text-transform: uppercase; letter-spacing: .4px; margin-top: 1px; }
.alm-kpi-skel { display: inline-block; width: 28px; height: 18px; border-radius: 4px; background: rgba(255,255,255,.2); animation: almPulse 1.2s ease-in-out infinite; }
@keyframes almPulse { 0%,100% { opacity: .4 } 50% { opacity: .9 } }

/* ═══ CUERPO ═══ */
.alm-body { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start; }
@media (max-width: 1000px) { .alm-body { grid-template-columns: 1fr; } }

/* Navegación */
.alm-sec { margin-bottom: 22px; }
.alm-sec-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .45);
  margin-bottom: 10px;
}
.alm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; }
.alm-card {
  display: flex; align-items: center; gap: 13px;
  padding: 14px 15px; border-radius: 13px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), .07);
  cursor: pointer; transition: all .18s;
}
.alm-card:hover {
  border-color: var(--ac);
  box-shadow: 0 6px 18px rgba(0,0,0,.07);
  transform: translateY(-2px);
}
.alm-card-icon {
  width: 40px; height: 40px; border-radius: 11px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  box-shadow: 0 3px 8px rgba(0,0,0,.15);
}
.alm-card-body { flex: 1; min-width: 0; }
.alm-card-title { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
.alm-card-desc { font-size: 11px; color: rgba(var(--v-theme-on-surface), .5); line-height: 1.35; }
.alm-card-arrow { flex-shrink: 0; opacity: 0; transform: translateX(-4px); transition: all .18s; }
.alm-card:hover .alm-card-arrow { opacity: 1; transform: translateX(0); }

/* ═══ Paneles laterales ═══ */
.alm-side { display: flex; flex-direction: column; gap: 16px; }
.alm-panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), .07);
  border-radius: 14px; padding: 16px;
}
.alm-panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.alm-panel-title { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; letter-spacing: .8px; color: rgba(var(--v-theme-on-surface), .6); }
.alm-panel-link {
  border: none; background: transparent; cursor: pointer;
  font-size: 11px; font-weight: 700; color: #10b981;
  padding: 2px 6px; border-radius: 6px; transition: background .15s;
}
.alm-panel-link:hover { background: rgba(16,185,129,.08); }
.alm-panel-loading { display: flex; justify-content: center; padding: 20px; }
.alm-panel-empty {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 18px 0; font-size: 12px; color: rgba(var(--v-theme-on-surface), .45);
}

/* Filas: próximos a agotarse */
.alm-crit-row {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 8px 10px; border-radius: 9px; cursor: pointer; transition: background .15s;
}
.alm-crit-row:hover { background: rgba(var(--v-theme-on-surface), .04); }
.alm-crit-info { min-width: 0; }
.alm-crit-nombre { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.alm-crit-meta { font-size: 10px; color: rgba(var(--v-theme-on-surface), .45); margin-top: 1px; }
.alm-crit-badge { flex-shrink: 0; padding: 3px 9px; border-radius: 12px; font-size: 11px; font-weight: 800; }
.alm-crit-peligro { background: rgba(239,68,68,.12); color: #ef4444; }
.alm-crit-alerta { background: rgba(245,158,11,.14); color: #d97706; }
.alm-crit-ok { background: rgba(16,185,129,.12); color: #059669; }

/* Filas: actividad reciente */
.alm-mov-row { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: 9px; }
.alm-mov-tipo {
  flex-shrink: 0; width: 74px; text-align: center;
  padding: 3px 0; border-radius: 6px;
  font-size: 9px; font-weight: 800; letter-spacing: .4px;
}
.alm-mov-entrada  { background: rgba(16,185,129,.12); color: #059669; }
.alm-mov-salida   { background: rgba(239,68,68,.1);  color: #ef4444; }
.alm-mov-baja     { background: rgba(245,158,11,.14); color: #d97706; }
.alm-mov-traslado { background: rgba(14,165,233,.12); color: #0284c7; }
.alm-mov-info { min-width: 0; }
.alm-mov-cc { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.alm-mov-meta { font-size: 10px; color: rgba(var(--v-theme-on-surface), .45); }
</style>
