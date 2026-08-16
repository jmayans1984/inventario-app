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
            <div class="alm-kpi-icon"><v-icon size="18" color="var(--success)">mdi-package-variant-closed</v-icon></div>
            <div>
              <div class="alm-kpi-val">
                <span v-if="!kpisLoading">{{ kpis.conStock }}</span>
                <span v-else class="alm-kpi-skel"></span>
              </div>
              <div class="alm-kpi-lbl">Productos con stock</div>
            </div>
          </div>
          <div class="alm-kpi alm-kpi-danger" @click="go('/almacen/reportes/prediccion-agotamiento')">
            <div class="alm-kpi-icon"><v-icon size="18" color="var(--error)">mdi-alert-circle-outline</v-icon></div>
            <div>
              <div class="alm-kpi-val">
                <span v-if="!kpisLoading">{{ kpis.enPeligro }}</span>
                <span v-else class="alm-kpi-skel"></span>
              </div>
              <div class="alm-kpi-lbl">Se agotan en &lt; 7 días</div>
            </div>
          </div>
          <div class="alm-kpi alm-kpi-warn" @click="go('/almacen/reportes/prediccion-agotamiento')">
            <div class="alm-kpi-icon"><v-icon size="18" color="var(--warning)">mdi-alert-outline</v-icon></div>
            <div>
              <div class="alm-kpi-val">
                <span v-if="!kpisLoading">{{ kpis.enAlerta }}</span>
                <span v-else class="alm-kpi-skel"></span>
              </div>
              <div class="alm-kpi-lbl">En alerta (7-14 días)</div>
            </div>
          </div>
          <div class="alm-kpi" @click="go('/almacen/procesos/despachos')">
            <div class="alm-kpi-icon"><v-icon size="18" color="var(--indigo)">mdi-truck-outline</v-icon></div>
            <div>
              <div class="alm-kpi-val">
                <span v-if="!despachosLoading">{{ allDespachos.length }}</span>
                <span v-else class="alm-kpi-skel"></span>
              </div>
              <div class="alm-kpi-lbl">Despachos totales</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════ CUERPO: NAVEGACIÓN + PANELES ═══════════ -->
      <div class="alm-body">

        <!-- ── Columna izquierda: navegación ── -->
        <div class="alm-nav">
          <div class="mod-nav-top">
            <button class="mod-personalizar" @click="dialogAbierto = true">
              <v-icon size="14">mdi-tune-variant</v-icon>
              Personalizar accesos
            </button>
          </div>
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

          <!-- Resumen de Despachos -->
          <div class="alm-panel">
            <div class="alm-panel-header">
              <div class="alm-panel-title">
                <v-icon size="14" color="var(--gold)">mdi-truck-outline</v-icon>
                DESPACHOS HOY
              </div>
              <button class="alm-panel-link" @click="go('/almacen/procesos/despachos')">Ver todos</button>
            </div>
            <div v-if="despachosLoading" class="alm-panel-loading">
              <v-progress-circular indeterminate size="20" width="2" color="var(--gold)" />
            </div>
            <template v-else>
              <div class="alm-despachos-kpi">
                <div class="dkpi" :style="{ borderLeft: '3px solid var(--info)' }">
                  <div class="dkpi-val">{{ despachosProgramados }}</div>
                  <div class="dkpi-lbl">Programados</div>
                </div>
                <div class="dkpi" :style="{ borderLeft: '3px solid var(--gold)' }">
                  <div class="dkpi-val">{{ despachosProcesando }}</div>
                  <div class="dkpi-lbl">Procesando</div>
                </div>
                <div class="dkpi" :style="{ borderLeft: '3px solid var(--success)' }">
                  <div class="dkpi-val">{{ despachosEntregados }}</div>
                  <div class="dkpi-lbl">Entregados</div>
                </div>
              </div>
              <div v-if="proximosDespachos.length > 0" class="alm-proximos">
                <div class="alm-prox-title">Próximos despachos</div>
                <div v-for="d in proximosDespachos.slice(0, 4)" :key="d.id" class="alm-prox-item">
                  <div class="alm-prox-badge" :style="{ background: estadoColor(d.estado) }">
                    {{ estadoLabel(d.estado) || 'Pendiente' }}
                  </div>
                  <div class="alm-prox-info">
                    <div class="alm-prox-cc">{{ d.cc_destino_nombre || 'Destino' }}</div>
                    <div class="alm-prox-fecha">{{ fmtFechaCorta(d.fecha) }}</div>
                  </div>
                  <div class="alm-prox-unidades">{{ d.total_unidades }} un</div>
                </div>
              </div>
              <div v-else class="alm-panel-empty">
                <v-icon size="20" color="rgba(var(--v-theme-on-surface),.3)">mdi-truck-check</v-icon>
                <span style="font-size: 11px;">Sin despachos pendientes</span>
              </div>
            </template>
          </div>

          <!-- Próximos a agotarse -->
          <div class="alm-panel">
            <div class="alm-panel-header">
              <div class="alm-panel-title">
                <v-icon size="14" color="var(--error)">mdi-fire</v-icon>
                PRÓXIMOS A AGOTARSE
              </div>
              <button class="alm-panel-link" @click="go('/almacen/reportes/prediccion-agotamiento')">Ver todo</button>
            </div>
            <div v-if="kpisLoading" class="alm-panel-loading">
              <v-progress-circular indeterminate size="20" width="2" color="var(--success)" />
            </div>
            <template v-else>
              <div v-if="criticos.length === 0" class="alm-panel-empty">
                <v-icon size="22" color="var(--success)">mdi-check-circle-outline</v-icon>
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

        </div>
      </div>

      <PersonalizarAtajosDialog
        v-model="dialogAbierto"
        :secciones="seccionesTodas"
        @guardar="guardar"
        @restablecer="restablecer"
      />
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../components/layouts/MainLayout.vue'
import PersonalizarAtajosDialog from '../components/common/PersonalizarAtajosDialog.vue'
import { useAtajosModulo } from '../composables/useAtajosModulo'
import { useAuthStore } from '../stores/auth'
import { API_BASE } from '../utils/constants'

const router = useRouter()
const go = (path) => router.push(path)

const auth = useAuthStore()
const empresa = computed(() => auth.empresa)
const tipoEmpresa = computed(() => auth.empresaTipo)

// ─── Fecha de hoy formateada ─────────────────────────────────
const fechaHoy = computed(() => {
  const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  const s = new Date().toLocaleDateString('es-CO', opts)
  return s.charAt(0).toUpperCase() + s.slice(1)
})

// ─── Navegación base ────────────────────
const seccionesBase = [
  {
    label: 'CONFIGURACIÓN',
    icon: 'mdi-cog-outline',
    color: 'var(--success)',
    iconBg: 'linear-gradient(135deg,var(--success),var(--success))',
    items: [
      { path: '/almacen/configuracion/productos',           icon: 'mdi-package-variant',          title: 'Productos',                      desc: 'Catálogo de productos del inventario' },
      { path: '/almacen/configuracion/control-inventario',  icon: 'mdi-tune-vertical',            title: 'Control de Inventario',          desc: 'Parámetros y niveles de stock mínimo' },
      { path: '/almacen/configuracion/impresion-barcodes',  icon: 'mdi-barcode',                  title: 'Códigos de Barras',              desc: 'Etiquetas con nombre y código' },
      { path: '/almacen/configuracion/grupo-productos',     icon: 'mdi-folder-multiple-outline',  title: 'Grupo de Productos',             desc: 'Categorías para organizar el catálogo' },
      { path: '/almacen/configuracion/ubicaciones',         icon: 'mdi-map-marker-outline',       title: 'Ubicaciones de Almacén',         desc: 'Distribución y localización de zonas' },
      { path: '/almacen/configuracion/precios',             icon: 'mdi-tag-multiple-outline',     title: 'Precios de Productos',           desc: 'Gestión de costos y precios' },
      { path: '/almacen/configuracion/mapeo-receta-producto', icon: 'mdi-link-variant',           title: 'Mapeo Subproductos-Inventario',  desc: 'Asocia subproductos con su código de inventario' },
      { path: '/almacen/configuracion/presentaciones-compra', icon: 'mdi-package-variant-closed', title: 'Presentaciones de Compra',       desc: 'Cómo viene empacado cada producto o artículo' },
    ],
  },
  {
    label: 'PROCESOS',
    icon: 'mdi-lightning-bolt-outline',
    color: 'var(--info)',
    iconBg: 'linear-gradient(135deg,var(--info),var(--info))',
    items: [
      { path: '/almacen/procesos/gestion-inventario',  icon: 'mdi-clipboard-list-outline', title: 'Gestión de Inventario',  desc: 'Entradas, salidas y ajustes de stock' },
      { path: '/almacen/procesos/toma-fisica',         icon: 'mdi-barcode-scan',           title: 'Toma Física',            desc: 'Conteo físico de inventario y ajustes' },
      { path: '/almacen/procesos/valoracion',          icon: 'mdi-currency-usd',           title: 'Valoración',             desc: 'Valor del inventario por costo promedio' },
      { path: '/almacen/procesos/ordenes-compra',      icon: 'mdi-cart-outline',           title: 'Órdenes de Compra',      desc: 'Gestiona órdenes a proveedores', requiredTipo: 'CLIENTE' },
      { path: '/almacen/procesos/despachos',           icon: 'mdi-truck-outline',          title: 'Despachos de Bodega',    desc: 'Envíos desde almacén central' },
      { path: '/almacen/procesos/ordenes-produccion',  icon: 'mdi-factory',                title: 'Órdenes de Producción',  desc: 'Gestión de órdenes de fabricación' },
    ],
  },
  {
    label: 'REPORTES',
    icon: 'mdi-chart-box-outline',
    color: 'var(--indigo)',
    iconBg: 'linear-gradient(135deg,var(--indigo),var(--indigo))',
    items: [
      { path: '/almacen/reportes/kardex',                 icon: 'mdi-file-chart-outline',  title: 'Kardex',                  desc: 'Movimientos históricos por producto' },
      { path: '/almacen/reportes/consumos',               icon: 'mdi-chart-bar',           title: 'Reporte de Consumos',     desc: 'Consumo de productos por período' },
      { path: '/almacen/reportes/consumo-insumos',        icon: 'mdi-package-down',        title: 'Consumo de Productos',      desc: 'Traslados desde bodega maestra' },
      { path: '/almacen/reportes/movimiento-producto',    icon: 'mdi-swap-vertical-bold',  title: 'Movimiento por Producto', desc: 'Detalle día a día por rango y CC' },
      { path: '/almacen/reportes/kardex-consolidado',     icon: 'mdi-table-multiple',      title: 'Kardex Consolidado',      desc: 'Stock actual por centro de costos' },
      { path: '/almacen/reportes/prediccion-agotamiento', icon: 'mdi-chart-box-outline',   title: 'Predicción Agotamiento',  desc: 'Cuándo se acabará el stock' },
      { path: '/almacen/reportes/valoracion-mensual',     icon: 'mdi-calculator-variant',  title: 'Valoración Mensual',      desc: 'Consumo de MP y juego de inventarios' },
      { path: '/almacen/reportes/toma-fisica',            icon: 'mdi-clipboard-check',     title: 'Reporte Toma Física',     desc: 'Resultados y ajustes de tomas' },
      { path: '/almacen/reportes/entradas-almacen',       icon: 'mdi-archive-outline',     title: 'Entradas de Almacén',     desc: 'Recepción de productos comprados' },
    ],
  },
]

const seccionesDisponibles = computed(() => {
  return seccionesBase.map(sec => ({
    ...sec,
    items: sec.items.filter(item => {
      if (!item.requiredTipo) return true
      return (item.requiredTipo || '').toUpperCase() === (tipoEmpresa.value || '').toUpperCase()
    })
  }))
})

const { secciones, seccionesTodas, dialogAbierto, guardar, restablecer } =
  useAtajosModulo('almacen', seccionesDisponibles)

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

// ─── Despachos de Bodega ────────────────────
const despachosLoading = ref(true)
const allDespachos = ref([])

// Fecha local (no UTC) en formato YYYY-MM-DD, para evitar desfases de zona horaria
function fechaLocalHoy() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function soloFecha(f) {
  if (!f) return ''
  return String(f).substring(0, 10)
}

const despachosDeHoy = computed(() => {
  const hoy = fechaLocalHoy()
  return (allDespachos.value || []).filter(d => soloFecha(d.fecha) === hoy)
})
// Estados reales de ordenes_despacho: PENDIENTE, EN_PICKING, EN_PACKING, COMPLETADO, CANCELADO
const despachosProgramados = computed(() => despachosDeHoy.value.filter(d => (d.estado || '').toUpperCase() === 'PENDIENTE').length)
const despachosProcesando = computed(() => despachosDeHoy.value.filter(d => ['EN_PICKING', 'EN_PACKING'].includes((d.estado || '').toUpperCase())).length)
const despachosEntregados = computed(() => despachosDeHoy.value.filter(d => (d.estado || '').toUpperCase() === 'COMPLETADO').length)
const proximosDespachos = computed(() => {
  const hoy = fechaLocalHoy()
  return (allDespachos.value || [])
    .filter(d => soloFecha(d.fecha) > hoy)
    .sort((a, b) => soloFecha(a.fecha).localeCompare(soloFecha(b.fecha)))
})

async function cargarDespachos() {
  if (!empresa.value) { despachosLoading.value = false; return }
  try {
    const res = await fetch(`${API_BASE}/almacen/despachos?empresa=${empresa.value}`)
    const json = await res.json()
    allDespachos.value = json.data || []
  } catch (e) {
    console.error('cargarDespachos:', e)
    allDespachos.value = []
  } finally {
    despachosLoading.value = false
  }
}

function estadoColor(estado) {
  const colores = { PENDIENTE: 'var(--gold)', EN_PICKING: 'var(--info)', EN_PACKING: 'var(--indigo)', COMPLETADO: 'var(--success)', CANCELADO: 'var(--ink-400)' }
  return colores[(estado || '').toUpperCase()] || 'var(--ink-400)'
}

function estadoLabel(estado) {
  const labels = { PENDIENTE: 'Pendiente', EN_PICKING: 'En Picking', EN_PACKING: 'En Packing', COMPLETADO: 'Completado', CANCELADO: 'Cancelado' }
  return labels[(estado || '').toUpperCase()] || estado
}

function fmtFechaCorta(f) {
  if (!f) return ''
  const d = new Date(String(f).substring(0, 10) + 'T12:00:00')
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

onMounted(() => {
  cargarKpis()
  cargarDespachos()
})
</script>

<style scoped>
.mod-container { padding: 24px; max-width: 1280px; margin: 0 auto; }

/* ═══ HERO ═══ */
.alm-hero {
  position: relative; overflow: hidden;
  border-radius: 18px; padding: 26px 28px 22px;
  background: linear-gradient(130deg, var(--sidebar-bg) 0%, #241d13 55%, #1c1710 100%);
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
  font-size: 11px; font-weight: 700; color: var(--success);
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
.alm-crit-peligro { background: rgba(239,68,68,.12); color: var(--error); }
.alm-crit-alerta { background: rgba(245,158,11,.14); color: var(--gold-strong); }
.alm-crit-ok { background: rgba(16,185,129,.12); color: var(--success); }

/* Filas: actividad reciente */
.alm-mov-row { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: 9px; }
.alm-mov-tipo {
  flex-shrink: 0; width: 74px; text-align: center;
  padding: 3px 0; border-radius: 6px;
  font-size: 9px; font-weight: 800; letter-spacing: .4px;
}
.alm-mov-entrada  { background: rgba(16,185,129,.12); color: var(--success); }
.alm-mov-salida   { background: rgba(239,68,68,.1);  color: var(--error); }
.alm-mov-baja     { background: rgba(245,158,11,.14); color: var(--gold-strong); }
.alm-mov-traslado { background: rgba(14,165,233,.12); color: var(--info); }
.alm-mov-info { min-width: 0; }
.alm-mov-cc { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.alm-mov-meta { font-size: 10px; color: rgba(var(--v-theme-on-surface), .45); }

/* Resumen de Despachos */
.alm-despachos-kpi { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 14px; }
.dkpi {
  padding: 10px; border-radius: 9px;
  background: rgba(var(--v-theme-on-surface), .03);
  border-left-width: 3px; border-left-style: solid;
}
.dkpi-val { font-size: 20px; font-weight: 800; line-height: 1; margin-bottom: 4px; }
.dkpi-lbl { font-size: 10px; color: rgba(var(--v-theme-on-surface), .5); font-weight: 600; text-transform: uppercase; letter-spacing: .3px; }

.alm-proximos { margin-top: 12px; }
.alm-prox-title { font-size: 10px; font-weight: 800; color: rgba(var(--v-theme-on-surface), .6); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 8px; }
.alm-prox-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 9px;
  background: rgba(var(--v-theme-on-surface), .03);
  transition: background .15s;
}
.alm-prox-item:hover { background: rgba(var(--v-theme-on-surface), .06); }
.alm-prox-badge {
  flex-shrink: 0; padding: 3px 8px; border-radius: 6px;
  font-size: 9px; font-weight: 800; color: white;
  text-transform: uppercase; letter-spacing: .3px;
}
.alm-prox-info { flex: 1; min-width: 0; }
.alm-prox-cc { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.alm-prox-fecha { font-size: 10px; color: rgba(var(--v-theme-on-surface), .5); margin-top: 1px; }
.alm-prox-unidades { flex-shrink: 0; font-size: 11px; font-weight: 700; color: rgba(var(--v-theme-on-surface), .7); }
</style>
