<template>
  <MainLayout>
    <div class="mod-container">

      <!-- ═══════════ HERO CON KPIs EN VIVO ═══════════ -->
      <div class="tes-hero">
        <div class="tes-hero-glow"></div>
        <div class="tes-hero-top">
          <div class="tes-hero-left">
            <div class="tes-hero-icon"><v-icon size="30" color="white">mdi-bank-transfer</v-icon></div>
            <div>
              <div class="tes-hero-title">TESORERÍA</div>
              <div class="tes-hero-sub">Movimientos bancarios, conciliación, ventas y facturas</div>
            </div>
          </div>
          <div class="tes-hero-fecha">
            <v-icon size="13" color="rgba(255,255,255,.55)">mdi-calendar-outline</v-icon>
            {{ fechaHoy }}
          </div>
        </div>

        <!-- KPIs -->
        <div class="tes-kpi-row">
          <div class="tes-kpi" @click="go('/tesoreria/procesos/movimientos-bancarios')">
            <div class="tes-kpi-icon"><v-icon size="18" color="var(--info)">mdi-bank-outline</v-icon></div>
            <div>
              <div class="tes-kpi-val">
                <span v-if="!saldosLoading">{{ fmt(saldoBancos) }}</span>
                <span v-else class="tes-kpi-skel"></span>
              </div>
              <div class="tes-kpi-lbl">Saldo en bancos</div>
            </div>
          </div>
          <div class="tes-kpi tes-kpi-danger" @click="go('/tesoreria/procesos/movimientos-bancarios')">
            <div class="tes-kpi-icon"><v-icon size="18" color="var(--error)">mdi-credit-card-outline</v-icon></div>
            <div>
              <div class="tes-kpi-val">
                <span v-if="!saldosLoading">{{ fmt(deudaTarjetas) }}</span>
                <span v-else class="tes-kpi-skel"></span>
              </div>
              <div class="tes-kpi-lbl">Deuda tarjetas</div>
            </div>
          </div>
          <div class="tes-kpi" @click="go('/tesoreria/reportes/ventas-periodo')">
            <div class="tes-kpi-icon"><v-icon size="18" color="var(--success)">mdi-cash-register</v-icon></div>
            <div>
              <div class="tes-kpi-val">
                <span v-if="!ventasLoading">{{ fmt(ventasMes.ventas_netas) }}</span>
                <span v-else class="tes-kpi-skel"></span>
              </div>
              <div class="tes-kpi-lbl">Ventas netas del mes</div>
            </div>
          </div>
          <div class="tes-kpi tes-kpi-warn" @click="go('/tesoreria/reportes/ventas-periodo')">
            <div class="tes-kpi-icon"><v-icon size="18" color="var(--gold)">mdi-percent-outline</v-icon></div>
            <div>
              <div class="tes-kpi-val">
                <span v-if="!ventasLoading">{{ fmt(ventasMes.comisiones) }}</span>
                <span v-else class="tes-kpi-skel"></span>
              </div>
              <div class="tes-kpi-lbl">Comisiones del mes</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════ CUERPO: NAVEGACIÓN + PANELES ═══════════ -->
      <div class="tes-body">

        <!-- ── Columna izquierda: navegación ── -->
        <div class="tes-nav">
          <div v-for="sec in secciones" :key="sec.label" class="tes-sec">
            <div class="tes-sec-label">
              <v-icon size="13" :color="sec.color">{{ sec.icon }}</v-icon>
              {{ sec.label }}
            </div>
            <div class="tes-grid">
              <div
                v-for="item in sec.items"
                :key="item.path"
                class="tes-card"
                :style="{ '--ac': sec.color }"
                @click="go(item.path)"
              >
                <div class="tes-card-icon" :style="{ background: sec.iconBg }">
                  <v-icon size="20" color="white">{{ item.icon }}</v-icon>
                </div>
                <div class="tes-card-body">
                  <div class="tes-card-title">{{ item.title }}</div>
                  <div class="tes-card-desc">{{ item.desc }}</div>
                </div>
                <v-icon size="15" :color="sec.color" class="tes-card-arrow">mdi-arrow-right</v-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Columna derecha: paneles en vivo ── -->
        <div class="tes-side">

          <!-- Saldos de cuentas bancarias -->
          <div class="tes-panel">
            <div class="tes-panel-header">
              <div class="tes-panel-title">
                <v-icon size="14" color="var(--indigo)">mdi-bank-outline</v-icon>
                CUENTAS BANCARIAS
              </div>
              <button class="tes-panel-link" @click="go('/tesoreria/procesos/movimientos-bancarios')">Ver movimientos</button>
            </div>
            <div v-if="saldosLoading" class="tes-panel-loading">
              <v-progress-circular indeterminate size="20" width="2" color="var(--indigo)" />
            </div>
            <template v-else>
              <div v-if="cuentasBanco.length === 0 && cuentasTarjeta.length === 0" class="tes-panel-empty">
                <v-icon size="22" color="rgba(var(--v-theme-on-surface),.3)">mdi-bank-off-outline</v-icon>
                <span>Sin cuentas bancarias activas</span>
              </div>

              <!-- Cuentas regulares -->
              <template v-if="cuentasBanco.length">
                <div v-for="c in cuentasBanco" :key="c.codigo" class="tes-cta-row">
                  <div class="tes-cta-info">
                    <div class="tes-cta-nombre">{{ c.nombre_cta }}</div>
                    <div class="tes-cta-meta">{{ c.nombre_banco }}<template v-if="c.tipo_cuenta"> · {{ c.tipo_cuenta }}</template></div>
                  </div>
                  <span class="tes-cta-saldo" :class="{ 'tes-neg': c.saldo < 0 }">{{ fmt(c.saldo) }}</span>
                </div>
                <div class="tes-cta-total">
                  <span>SUBTOTAL BANCOS</span>
                  <span :class="{ 'tes-neg': saldoBancos < 0 }">{{ fmt(saldoBancos) }}</span>
                </div>
              </template>

              <!-- Tarjetas de crédito -->
              <template v-if="cuentasTarjeta.length">
                <div class="tes-tarjetas-header">
                  <v-icon size="13" color="var(--error)">mdi-credit-card-outline</v-icon>
                  TARJETAS DE CRÉDITO
                </div>
                <div v-for="c in cuentasTarjeta" :key="c.codigo" class="tes-cta-row">
                  <div class="tes-cta-info">
                    <div class="tes-cta-nombre">{{ c.nombre_cta }}</div>
                    <div class="tes-cta-meta">{{ c.nombre_banco }}</div>
                  </div>
                  <span class="tes-cta-saldo tes-neg">{{ fmt(c.saldo) }}</span>
                </div>
                <div class="tes-cta-total tes-cta-total-deuda">
                  <span>DEUDA TARJETAS</span>
                  <span class="tes-neg">{{ fmt(deudaTarjetas) }}</span>
                </div>
              </template>

              <!-- Posición neta -->
              <div v-if="saldos.length" class="tes-cta-neta">
                <span>POSICIÓN NETA</span>
                <span :class="posicionNeta >= 0 ? 'tes-pos' : 'tes-neg'">{{ fmt(posicionNeta) }}</span>
              </div>
            </template>
          </div>

          <!-- Ventas del mes -->
          <div class="tes-panel">
            <div class="tes-panel-header">
              <div class="tes-panel-title">
                <v-icon size="14" color="var(--success)">mdi-cash-register</v-icon>
                VENTAS DE {{ mesActual }}
              </div>
              <button class="tes-panel-link" @click="go('/tesoreria/reportes/ventas-periodo')">Ver reporte</button>
            </div>
            <div v-if="ventasLoading" class="tes-panel-loading">
              <v-progress-circular indeterminate size="20" width="2" color="var(--success)" />
            </div>
            <template v-else>
              <div class="tes-vta-row">
                <span class="tes-vta-lbl">Ventas Brutas</span>
                <span class="tes-vta-val tes-pos">{{ fmt(ventasMes.ventas_brutas) }}</span>
              </div>
              <div class="tes-vta-row">
                <span class="tes-vta-lbl">Devoluciones</span>
                <span class="tes-vta-val tes-neg">{{ fmt(ventasMes.devoluciones) }}</span>
              </div>
              <div class="tes-vta-row">
                <span class="tes-vta-lbl">Descuentos</span>
                <span class="tes-vta-val tes-neg">{{ fmt(ventasMes.descuentos) }}</span>
              </div>
              <div class="tes-vta-row tes-vta-destacada">
                <span class="tes-vta-lbl">Ventas Netas</span>
                <span class="tes-vta-val tes-pos">{{ fmt(ventasMes.ventas_netas) }}</span>
              </div>
              <div class="tes-vta-sep"></div>
              <div class="tes-vta-row">
                <span class="tes-vta-lbl">Impuestos</span>
                <span class="tes-vta-val">{{ fmt(ventasMes.impuestos) }}</span>
              </div>
              <div class="tes-vta-row">
                <span class="tes-vta-lbl">Propinas</span>
                <span class="tes-vta-val">{{ fmt(ventasMes.propinas) }}</span>
              </div>
              <div class="tes-vta-row">
                <span class="tes-vta-lbl">Comisiones</span>
                <span class="tes-vta-val tes-neg">{{ fmt(ventasMes.comisiones) }}</span>
              </div>
              <div class="tes-vta-sep"></div>
              <div class="tes-vta-row">
                <span class="tes-vta-lbl"><v-icon size="12" color="var(--indigo)" class="mr-1">mdi-credit-card-outline</v-icon>Tarjetas</span>
                <span class="tes-vta-val">{{ fmt(ventasMes.tarjetas) }}</span>
              </div>
              <div class="tes-vta-row">
                <span class="tes-vta-lbl"><v-icon size="12" color="var(--success)" class="mr-1">mdi-cash</v-icon>Efectivo</span>
                <span class="tes-vta-val">{{ fmt(ventasMes.efectivo) }}</span>
              </div>
              <div class="tes-vta-row">
                <span class="tes-vta-lbl"><v-icon size="12" color="var(--indigo)" class="mr-1">mdi-bank-transfer-out</v-icon>Otros</span>
                <span class="tes-vta-val">{{ fmt(ventasMes.otros) }}</span>
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
const tipoEmpresa = computed(() => auth.empresaTipo)

// ─── Fecha / mes actual ──────────────────────────────────────
const fechaHoy = computed(() => {
  const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  const s = new Date().toLocaleDateString('es-CO', opts)
  return s.charAt(0).toUpperCase() + s.slice(1)
})

const mesActual = computed(() => {
  return new Date().toLocaleDateString('es-CO', { month: 'long' }).toUpperCase()
})

// ─── Formato moneda ──────────────────────────────────────────
function fmt(val) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(parseFloat(val || 0))
}

// ─── Navegación con filtrado por tipo de empresa ──────────────
const seccionesBase = [
  {
    label: 'CONFIGURACIÓN',
    icon: 'mdi-cog-outline',
    color: 'var(--indigo)',
    iconBg: 'var(--indigo)',
    items: [
      { path: '/tesoreria/configuracion/cuentas-bancarias', icon: 'mdi-bank-outline', title: 'Cuentas Bancarias', desc: 'Gestiona las cuentas bancarias de la empresa' },
    ],
  },
  {
    label: 'PROCESOS',
    icon: 'mdi-lightning-bolt-outline',
    color: 'var(--gold)',
    iconBg: 'var(--gold)',
    items: [
      { path: '/tesoreria/procesos/movimientos-bancarios', icon: 'mdi-swap-horizontal',       title: 'Movimientos Bancarios', desc: 'Registro de ingresos y egresos bancarios' },
      { path: '/tesoreria/procesos/conciliacion-cuentas',  icon: 'mdi-check-all',             title: 'Conciliación Bancaria', desc: 'Concilia movimientos con extractos' },
      { path: '/tesoreria/procesos/importar-ventas',       icon: 'mdi-file-import-outline',   title: 'Importar Ventas',       desc: 'Importa ventas desde archivos CSV' },
      { path: '/tesoreria/procesos/importar-ventas-v2',    icon: 'mdi-file-import-outline',   title: 'Importar Ventas V 2.0', desc: 'Importación alternativa de ventas desde CSV' },
      { path: '/tesoreria/procesos/facturas-compra',       icon: 'mdi-file-document-outline', title: 'Facturas de Compra',    desc: 'Facturas recibidas de proveedores', requiredTipo: 'CLIENTE' },
      { path: '/tesoreria/procesos/facturas-venta',        icon: 'mdi-file-send-outline',     title: 'Facturas de Venta',     desc: 'Facturas emitidas a clientes', requiredTipo: 'PROVEEDOR' },
    ],
  },
  {
    label: 'REPORTES',
    icon: 'mdi-chart-box-outline',
    color: 'var(--success)',
    iconBg: 'var(--success)',
    items: [
      { path: '/tesoreria/reportes/conciliacion-bancaria',    icon: 'mdi-file-chart-outline',       title: 'Reporte Conciliación',  desc: 'Estado de conciliación por cuenta' },
      { path: '/tesoreria/reportes/movimiento-cuentas',       icon: 'mdi-chart-timeline-variant',   title: 'Movimiento de Cuentas', desc: 'Historial por cuenta y período' },
      { path: '/tesoreria/reportes/ventas-periodo',           icon: 'mdi-calendar-month-outline',   title: 'Ventas por Período',    desc: 'Resumen de ventas por período' },
      { path: '/tesoreria/reportes/ventas-productos-periodo', icon: 'mdi-package-variant-closed',   title: 'Ventas por Producto',   desc: 'Ranking de productos más vendidos' },
    ],
  },
]

const secciones = computed(() => {
  return seccionesBase.map(sec => ({
    ...sec,
    items: sec.items.filter(item => !item.requiredTipo || item.requiredTipo === tipoEmpresa.value)
  }))
})

// ─── Saldos de cuentas bancarias activas ─────────────────────
const saldosLoading = ref(true)
const saldos = ref([])
const cuentasBanco = computed(() => saldos.value.filter(c => (c.tipo_cuenta || '').toUpperCase() !== 'TARJETA'))
const cuentasTarjeta = computed(() => saldos.value.filter(c => (c.tipo_cuenta || '').toUpperCase() === 'TARJETA'))
const saldoBancos = computed(() => cuentasBanco.value.reduce((s, c) => s + c.saldo, 0))
const deudaTarjetas = computed(() => cuentasTarjeta.value.reduce((s, c) => s + c.saldo, 0))
const posicionNeta = computed(() => saldoBancos.value + deudaTarjetas.value)

async function cargarSaldos() {
  if (!empresa.value) { saldosLoading.value = false; return }
  try {
    const res = await fetch(`${API_BASE}/tesoreria/saldos-cuentas?empresa=${empresa.value}`)
    const json = await res.json()
    if (json.success) saldos.value = json.data || []
  } catch (e) {
    console.error('cargarSaldos:', e)
  } finally {
    saldosLoading.value = false
  }
}

// ─── Ventas del mes (consolidado toda la empresa) ────────────
const ventasLoading = ref(true)
const ventasMes = ref({
  ventas_brutas: 0, devoluciones: 0, descuentos: 0, ventas_netas: 0,
  impuestos: 0, propinas: 0, comisiones: 0, tarjetas: 0, efectivo: 0, otros: 0,
})

async function cargarVentasMes() {
  if (!empresa.value) { ventasLoading.value = false; return }
  try {
    const hoy = new Date()
    const y = hoy.getFullYear()
    const m = String(hoy.getMonth() + 1).padStart(2, '0')
    const fechaInicio = `${y}-${m}-01`
    const fechaFin = `${y}-${m}-${String(hoy.getDate()).padStart(2, '0')}`
    const res = await fetch(`${API_BASE}/tesoreria/ventas-periodo?empresa=${empresa.value}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`)
    const json = await res.json()
    if (json.success && json.totals) ventasMes.value = json.totals
  } catch (e) {
    console.error('cargarVentasMes:', e)
  } finally {
    ventasLoading.value = false
  }
}

onMounted(() => {
  cargarSaldos()
  cargarVentasMes()
})
</script>

<style scoped>
.mod-container { padding: 24px; max-width: 1280px; margin: 0 auto; }

/* ═══ HERO ═══ */
.tes-hero {
  position: relative; overflow: hidden;
  border-radius: 18px; padding: 26px 28px 22px;
  background: linear-gradient(130deg, var(--sidebar-bg) 0%, #241d13 55%, #1c1710 100%);
  margin-bottom: 24px;
  box-shadow: var(--shadow-lg);
}
.tes-hero-glow {
  position: absolute; top: -60px; right: -40px;
  width: 260px; height: 260px; border-radius: 50%;
  background: radial-gradient(circle, rgba(240,168,60,.18), transparent 70%);
  pointer-events: none;
}
.tes-hero-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
.tes-hero-left { display: flex; align-items: center; gap: 16px; }
.tes-hero-icon {
  width: 56px; height: 56px; border-radius: 15px;
  background: rgba(255,255,255,.14); backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,.18);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.tes-hero-title { font-size: 24px; font-weight: 900; color: white; letter-spacing: 1px; }
.tes-hero-sub { font-size: 13px; color: rgba(255,255,255,.65); margin-top: 3px; }
.tes-hero-fecha {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: rgba(255,255,255,.6); font-weight: 500;
  background: rgba(255,255,255,.08); padding: 6px 12px; border-radius: 20px;
}

/* KPIs dentro del hero */
.tes-kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; position: relative; }
.tes-kpi {
  display: flex; align-items: center; gap: 12px;
  background: rgba(255,255,255,.09); backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 12px; padding: 12px 14px;
  cursor: pointer; transition: background-color 180ms var(--ease-out), transform 180ms var(--ease-out);
}
.tes-kpi:hover { background: rgba(255,255,255,.16); transform: translateY(-2px); }
.tes-kpi-warn { border-color: rgba(252,211,77,.3); }
.tes-kpi-danger { border-color: rgba(252,165,165,.3); }
.tes-kpi-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: rgba(255,255,255,.1);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.tes-kpi-val { font-size: 17px; font-weight: 800; color: white; line-height: 1.1; white-space: nowrap; }
.tes-kpi-lbl { font-size: 10px; font-weight: 600; color: rgba(255,255,255,.6); text-transform: uppercase; letter-spacing: .4px; margin-top: 1px; }
.tes-kpi-skel { display: inline-block; width: 60px; height: 16px; border-radius: 4px; background: rgba(255,255,255,.2); animation: tesPulse 1.2s ease-in-out infinite; }
@keyframes tesPulse { 0%,100% { opacity: .4 } 50% { opacity: .9 } }

/* ═══ CUERPO ═══ */
.tes-body { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start; }
@media (max-width: 1000px) { .tes-body { grid-template-columns: 1fr; } }

/* Navegación */
.tes-sec { margin-bottom: 22px; }
.tes-sec-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .45);
  margin-bottom: 10px;
}
.tes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; }
.tes-card {
  display: flex; align-items: center; gap: 13px;
  padding: 14px 15px; border-radius: 13px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), .07);
  cursor: pointer; transition: border-color 180ms var(--ease-out), box-shadow 180ms var(--ease-out), transform 180ms var(--ease-out);
}
.tes-card:hover {
  border-color: var(--ac);
  box-shadow: 0 6px 18px rgba(0,0,0,.07);
  transform: translateY(-2px);
}
.tes-card-icon {
  width: 40px; height: 40px; border-radius: 11px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  box-shadow: 0 3px 8px rgba(0,0,0,.15);
}
.tes-card-body { flex: 1; min-width: 0; }
.tes-card-title { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
.tes-card-desc { font-size: 11px; color: rgba(var(--v-theme-on-surface), .5); line-height: 1.35; }
.tes-card-arrow { flex-shrink: 0; opacity: 0; transform: translateX(-4px); transition: opacity 180ms var(--ease-out), transform 180ms var(--ease-out); }
.tes-card:hover .tes-card-arrow { opacity: 1; transform: translateX(0); }

/* ═══ Paneles laterales ═══ */
.tes-side { display: flex; flex-direction: column; gap: 16px; }
.tes-panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), .07);
  border-radius: 14px; padding: 16px;
}
.tes-panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.tes-panel-title { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; letter-spacing: .8px; color: rgba(var(--v-theme-on-surface), .6); }
.tes-panel-link {
  border: none; background: transparent; cursor: pointer;
  font-size: 11px; font-weight: 700; color: var(--indigo);
  padding: 2px 6px; border-radius: 6px; transition: background-color 150ms var(--ease-out);
}
.tes-panel-link:hover { background: var(--indigo-wash); }
.tes-panel-loading { display: flex; justify-content: center; padding: 20px; }
.tes-panel-empty {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 18px 0; font-size: 12px; color: rgba(var(--v-theme-on-surface), .45);
}

/* Filas: saldos de cuentas */
.tes-cta-row {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 8px 10px; border-radius: 9px; transition: background .15s;
}
.tes-cta-row:hover { background: rgba(var(--v-theme-on-surface), .04); }
.tes-cta-info { min-width: 0; }
.tes-cta-nombre { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tes-cta-meta { font-size: 10px; color: rgba(var(--v-theme-on-surface), .45); margin-top: 1px; }
.tes-cta-saldo { flex-shrink: 0; font-variant-numeric: tabular-nums; font-size: 12px; font-weight: 700; color: var(--success); }
.tes-cta-total {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 8px; padding: 10px 10px 2px;
  border-top: 2px solid rgba(var(--v-theme-on-surface), .08);
  font-size: 11px; font-weight: 800; letter-spacing: .4px;
}
.tes-cta-total span:last-child { font-variant-numeric: tabular-nums; font-size: 13px; color: var(--success); }
.tes-neg { color: var(--error) !important; }
.tes-pos { color: var(--success); }

/* Separador tarjetas de crédito */
.tes-tarjetas-header {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px; font-weight: 800; letter-spacing: .8px;
  color: rgba(var(--v-theme-on-surface), .5);
  margin-top: 14px; padding: 8px 10px 4px;
  border-top: 1px dashed rgba(var(--v-theme-on-surface), .1);
}
.tes-cta-total-deuda span:last-child { color: var(--error) !important; }
.tes-cta-neta {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 10px; padding: 10px 10px 2px;
  border-top: 2px solid rgba(var(--v-theme-on-surface), .12);
  font-size: 12px; font-weight: 900; letter-spacing: .4px;
}
.tes-cta-neta span:last-child { font-variant-numeric: tabular-nums; font-size: 14px; }

/* Filas: ventas del mes */
.tes-vta-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 10px; border-radius: 8px; transition: background-color 150ms var(--ease-out);
}
.tes-vta-row:hover { background: rgba(var(--v-theme-on-surface), .03); }
.tes-vta-lbl { display: flex; align-items: center; font-size: 12px; color: rgba(var(--v-theme-on-surface), .65); }
.tes-vta-val { font-variant-numeric: tabular-nums; font-size: 12px; font-weight: 700; }
.tes-vta-destacada { background: rgba(16,185,129,.06); }
.tes-vta-destacada .tes-vta-lbl { font-weight: 700; color: rgb(var(--v-theme-on-surface)); }
.tes-vta-destacada .tes-vta-val { font-size: 13px; }
.tes-vta-sep { height: 1px; background: rgba(var(--v-theme-on-surface), .07); margin: 6px 4px; }
</style>
