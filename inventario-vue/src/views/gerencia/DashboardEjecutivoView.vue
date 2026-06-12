<template>
  <MainLayout>
    <div class="dash-container">

      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">GERENCIA</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Dashboard Ejecutivo</span>
      </div>

      <!-- HEADER + FILTROS -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <v-icon size="24" color="white">mdi-view-dashboard-outline</v-icon>
          </div>
          <div>
            <h1 class="page-title">DASHBOARD EJECUTIVO</h1>
            <p class="page-sub">Resumen financiero y operativo del negocio</p>
          </div>
        </div>
        <v-btn color="#06b6d4" variant="flat" prepend-icon="mdi-refresh" :loading="loading" @click="cargar">
          Actualizar
        </v-btn>
      </div>

      <!-- FILTRO PERÍODO -->
      <div class="filtro-card">
        <div class="filtro-quick">
          <button v-for="q in quickFilters" :key="q.label"
            class="quick-btn" :class="{ active: quickActivo === q.label }"
            @click="aplicarQuick(q)">
            {{ q.label }}
          </button>
        </div>
        <div class="filtro-sep"></div>
        <div class="filtro-dates">
          <div class="date-field">
            <label>Desde</label>
            <input v-model="fechaInicio" type="date" class="date-input" @change="quickActivo=''" />
          </div>
          <div class="date-field">
            <label>Hasta</label>
            <input v-model="fechaFin" type="date" class="date-input" @change="quickActivo=''" />
          </div>
          <v-btn color="#06b6d4" variant="flat" size="small" @click="cargar">Aplicar</v-btn>
        </div>
      </div>

      <div v-if="loading" class="loading-full">
        <v-progress-circular indeterminate color="#06b6d4" size="48" />
        <p>Cargando datos...</p>
      </div>

      <template v-else-if="data">

        <!-- ── ROW 1: KPI CARDS ── -->
        <div class="kpi-row">
          <div class="kpi-card kpi-cyan">
            <div class="kpi-icon-wrap"><v-icon size="22" color="white">mdi-cash-multiple</v-icon></div>
            <div class="kpi-body">
              <div class="kpi-val">{{ fmtMonto(data.facturacion.total_facturado) }}</div>
              <div class="kpi-lbl">Total Facturado</div>
              <div class="kpi-sub">{{ data.facturacion.count_total }} facturas</div>
            </div>
          </div>
          <div class="kpi-card kpi-green">
            <div class="kpi-icon-wrap"><v-icon size="22" color="white">mdi-check-circle-outline</v-icon></div>
            <div class="kpi-body">
              <div class="kpi-val">{{ fmtMonto(data.facturacion.total_cobrado) }}</div>
              <div class="kpi-lbl">Total Cobrado</div>
              <div class="kpi-sub">{{ tasaCobro }}% de cobro</div>
            </div>
          </div>
          <div class="kpi-card kpi-orange">
            <div class="kpi-icon-wrap"><v-icon size="22" color="white">mdi-clock-alert-outline</v-icon></div>
            <div class="kpi-body">
              <div class="kpi-val">{{ fmtMonto(data.facturacion.total_por_cobrar) }}</div>
              <div class="kpi-lbl">Por Cobrar</div>
              <div class="kpi-sub">{{ data.facturacion.count_pendiente }} pendientes</div>
            </div>
          </div>
          <div class="kpi-card kpi-purple">
            <div class="kpi-icon-wrap"><v-icon size="22" color="white">mdi-domain</v-icon></div>
            <div class="kpi-body">
              <div class="kpi-val">{{ data.facturacion.clientes_activos }}</div>
              <div class="kpi-lbl">Clientes Activos</div>
              <div class="kpi-sub">con facturas en el período</div>
            </div>
          </div>
        </div>

        <!-- ── ROW 2: ESTADOS ── -->
        <div class="two-col">

          <!-- Facturas por estado -->
          <div class="panel">
            <div class="panel-title">
              <v-icon size="16" color="#06b6d4" class="mr-1">mdi-receipt-text-outline</v-icon>
              Facturas por Estado
            </div>
            <div class="estado-list">
              <div class="estado-row">
                <span class="estado-dot" style="background:#f59e0b"></span>
                <span class="estado-name">Pendientes</span>
                <div class="estado-bar-wrap">
                  <div class="estado-bar" style="background:#f59e0b"
                    :style="{ width: pct(data.facturacion.count_pendiente, data.facturacion.count_total) + '%' }"></div>
                </div>
                <span class="estado-val">{{ data.facturacion.count_pendiente }}</span>
              </div>
              <div class="estado-row">
                <span class="estado-dot" style="background:#3b82f6"></span>
                <span class="estado-name">Por Verificar</span>
                <div class="estado-bar-wrap">
                  <div class="estado-bar" style="background:#3b82f6"
                    :style="{ width: pct(data.facturacion.count_por_verificar, data.facturacion.count_total) + '%' }"></div>
                </div>
                <span class="estado-val">{{ data.facturacion.count_por_verificar }}</span>
              </div>
              <div class="estado-row">
                <span class="estado-dot" style="background:#22c55e"></span>
                <span class="estado-name">Pagadas</span>
                <div class="estado-bar-wrap">
                  <div class="estado-bar" style="background:#22c55e"
                    :style="{ width: pct(data.facturacion.count_pagada, data.facturacion.count_total) + '%' }"></div>
                </div>
                <span class="estado-val">{{ data.facturacion.count_pagada }}</span>
              </div>
            </div>
            <!-- Barra de cobro -->
            <div class="cobro-section">
              <div class="cobro-labels">
                <span>Cobrado {{ tasaCobro }}%</span>
                <span>Por cobrar {{ 100 - tasaCobro }}%</span>
              </div>
              <div class="cobro-bar-wrap">
                <div class="cobro-bar-fill" :style="{ width: tasaCobro + '%' }"></div>
              </div>
            </div>
          </div>

          <!-- Órdenes por estado -->
          <div class="panel">
            <div class="panel-title">
              <v-icon size="16" color="#06b6d4" class="mr-1">mdi-clipboard-list-outline</v-icon>
              Órdenes de Compra por Estado
            </div>
            <div class="estado-list" v-if="ordenesTotales > 0">
              <div v-for="oc in ordenesMap" :key="oc.estado" class="estado-row">
                <span class="estado-dot" :style="{ background: oc.color }"></span>
                <span class="estado-name">{{ oc.estado }}</span>
                <div class="estado-bar-wrap">
                  <div class="estado-bar" :style="{ background: oc.color, width: pct(oc.count, ordenesTotales) + '%' }"></div>
                </div>
                <span class="estado-val">{{ oc.count }}</span>
              </div>
              <div class="estado-row resumen-row">
                <span class="estado-dot" style="background:#06b6d4"></span>
                <span class="estado-name fw-bold">Valor Total</span>
                <div class="estado-bar-wrap"></div>
                <span class="estado-val fw-bold cyan-txt">{{ fmtMonto(ordenesValorTotal) }}</span>
              </div>
            </div>
            <div v-else class="empty-panel">Sin órdenes en el período</div>
          </div>
        </div>

        <!-- ── ROW 3: TENDENCIA + TOP CLIENTES ── -->
        <div class="two-col">

          <!-- Tendencia 6 meses -->
          <div class="panel">
            <div class="panel-title">
              <v-icon size="16" color="#06b6d4" class="mr-1">mdi-chart-bar</v-icon>
              Facturación — Últimos 6 Meses
            </div>
            <div v-if="data.tendencia_facturacion.length === 0" class="empty-panel">Sin datos de tendencia</div>
            <div v-else class="bar-chart">
              <div v-for="m in tendenciaCompleta" :key="m.mes" class="bar-col">
                <div class="bar-val-top">{{ m.valor_facturas > 0 ? fmtMontoK(m.valor_facturas) : '' }}</div>
                <div class="bar-outer">
                  <div class="bar-fill-fact" :style="{ height: barH(m.valor_facturas, maxTendFact) + '%' }"></div>
                  <div class="bar-fill-cob"  :style="{ height: barH(m.valor_cobrado, maxTendFact) + '%' }"></div>
                </div>
                <div class="bar-mes">{{ fmtMes(m.mes) }}</div>
              </div>
            </div>
            <div class="chart-legend">
              <span class="leg-item"><span class="leg-dot" style="background:#06b6d4"></span>Facturado</span>
              <span class="leg-item"><span class="leg-dot" style="background:#22c55e"></span>Cobrado</span>
            </div>
          </div>

          <!-- Top clientes -->
          <div class="panel">
            <div class="panel-title">
              <v-icon size="16" color="#06b6d4" class="mr-1">mdi-trophy-outline</v-icon>
              Top Clientes por Facturación
            </div>
            <div v-if="data.top_clientes.length === 0" class="empty-panel">Sin datos en el período</div>
            <div v-else class="top-list">
              <div v-for="(c, i) in data.top_clientes" :key="i" class="top-row">
                <span class="top-rank">{{ i + 1 }}</span>
                <div class="top-info">
                  <span class="top-name">{{ c.cliente_nombre }}</span>
                  <div class="top-bar-wrap">
                    <div class="top-bar" :style="{ width: pct(c.total_facturado, data.top_clientes[0].total_facturado) + '%' }"></div>
                  </div>
                </div>
                <div class="top-montos">
                  <span class="top-total">{{ fmtMonto(c.total_facturado) }}</span>
                  <span class="top-cobrado">{{ c.facturas_count }} fact.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── ROW 4: GASTOS Y MOVIMIENTOS ── -->
        <div class="three-col">
          <div class="panel">
            <div class="panel-title">
              <v-icon size="16" color="#ef4444" class="mr-1">mdi-receipt-text-outline</v-icon>
              Gastos del Período
            </div>
            <div class="fin-big">{{ fmtMonto(data.gastos.total_gastos) }}</div>
            <div class="fin-sub">{{ data.gastos.count_gastos }} registros de gasto</div>
          </div>
          <div class="panel">
            <div class="panel-title">
              <v-icon size="16" color="#22c55e" class="mr-1">mdi-bank-transfer-in</v-icon>
              Ingresos Bancarios
            </div>
            <div class="fin-big" style="color:#22c55e">{{ fmtMonto(data.movimientos.total_ingresos) }}</div>
            <div class="fin-sub">Entradas registradas en MOVIBAN</div>
          </div>
          <div class="panel">
            <div class="panel-title">
              <v-icon size="16" :color="saldoNeto >= 0 ? '#06b6d4' : '#ef4444'" class="mr-1">mdi-scale-balance</v-icon>
              Saldo Neto
            </div>
            <div class="fin-big" :style="{ color: saldoNeto >= 0 ? '#06b6d4' : '#ef4444' }">
              {{ fmtMonto(saldoNeto) }}
            </div>
            <div class="fin-sub">Ingresos − Egresos del período</div>
          </div>
        </div>

      </template>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fechaInputLocal } from '../../utils/formatters'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { fechaInputLocal } from '../../utils/formatters'
import api from '../../services/api'
import { fechaInputLocal } from '../../utils/formatters'
import { useAuthStore } from '../../stores/auth'
import { fechaInputLocal } from '../../utils/formatters'

const authStore = useAuthStore()
const empresa   = computed(() => authStore.empresaCodigo || authStore.empresa || localStorage.getItem('empresaActual'))

// ── Período ───────────────────────────────────────────────────────
const anio = new Date().getFullYear()
const hoy  = fechaInputLocal()
const fechaInicio = ref(`${anio}-01-01`)
const fechaFin    = ref(hoy)
const quickActivo = ref('Este Año')

const quickFilters = [
  { label: 'Este Mes',      fi: () => `${anio}-${String(new Date().getMonth()+1).padStart(2,'0')}-01`, ff: () => hoy },
  { label: 'Este Trimestre', fi: () => { const m = new Date().getMonth(); const q = Math.floor(m/3)*3; return `${anio}-${String(q+1).padStart(2,'0')}-01` }, ff: () => hoy },
  { label: 'Este Año',      fi: () => `${anio}-01-01`, ff: () => hoy },
  { label: 'Año Anterior',  fi: () => `${anio-1}-01-01`, ff: () => `${anio-1}-12-31` },
]

function aplicarQuick(q) {
  fechaInicio.value = q.fi()
  fechaFin.value    = q.ff()
  quickActivo.value = q.label
  cargar()
}

// ── Datos ─────────────────────────────────────────────────────────
const data    = ref(null)
const loading = ref(false)

async function cargar() {
  loading.value = true
  try {
    const r = await api.get('/gerencia/dashboard', {
      params: { empresa: empresa.value, fechaInicio: fechaInicio.value, fechaFin: fechaFin.value }
    })
    data.value = r.data
  } catch (e) { console.error(e) } finally { loading.value = false }
}

// ── Computeds ─────────────────────────────────────────────────────
const tasaCobro = computed(() => {
  if (!data.value) return 0
  const fact = +data.value.facturacion.total_facturado
  const cob  = +data.value.facturacion.total_cobrado
  return fact > 0 ? Math.round(cob / fact * 100) : 0
})

const saldoNeto = computed(() => {
  if (!data.value) return 0
  return +data.value.movimientos.total_ingresos - +data.value.movimientos.total_egresos
})

const ordenesMap = computed(() => {
  if (!data.value) return []
  const map = { PENDIENTE: { color: '#f59e0b', count: 0 }, ENTREGADA: { color: '#3b82f6', count: 0 }, FACTURADA: { color: '#22c55e', count: 0 } }
  data.value.ordenes.forEach(o => { if (map[o.estado]) map[o.estado].count = +o.count })
  return Object.entries(map).map(([estado, v]) => ({ estado, ...v }))
})

const ordenesTotales = computed(() => ordenesMap.value.reduce((s, o) => s + o.count, 0))
const ordenesValorTotal = computed(() => {
  if (!data.value) return 0
  return data.value.ordenes.reduce((s, o) => s + +o.valor, 0)
})

const tendenciaCompleta = computed(() => {
  if (!data.value) return []
  const meses = generarUltimosMeses(6)
  return meses.map(m => {
    const f = data.value.tendencia_facturacion.find(x => x.mes === m) || {}
    return { mes: m, valor_facturas: +( f.valor_facturas || 0), valor_cobrado: +(f.valor_cobrado || 0) }
  })
})

const maxTendFact = computed(() => Math.max(...tendenciaCompleta.value.map(m => m.valor_facturas), 1))

// ── Helpers ───────────────────────────────────────────────────────
function generarUltimosMeses(n) {
  const result = []
  const d = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(d.getFullYear(), d.getMonth() - i, 1)
    result.push(`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`)
  }
  return result
}

function fmtMes(m) {
  if (!m) return ''
  const [y, mo] = m.split('-')
  const nombres = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return nombres[parseInt(mo) - 1] + ' ' + String(y).slice(2)
}

function fmtMonto(v) {
  const n = parseFloat(v) || 0
  return '$' + n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtMontoK(v) {
  const n = parseFloat(v) || 0
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return '$' + (n / 1_000).toFixed(0) + 'K'
  return '$' + n.toFixed(0)
}

function pct(part, total) {
  const p = parseFloat(part) || 0
  const t = parseFloat(total) || 1
  return Math.max(2, Math.round(p / t * 100))
}

function barH(val, max) {
  const v = parseFloat(val) || 0
  const m = parseFloat(max) || 1
  return Math.max(2, Math.round(v / m * 100))
}

onMounted(() => {
  quickActivo.value = 'Este Año'
  cargar()
})
</script>

<style scoped>
.dash-container { padding: 24px; max-width: 1300px; margin: 0 auto; }

/* Breadcrumb */
.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.45); }
.bc-root { color: #06b6d4; }
.bc-sep  { color: rgba(var(--v-theme-on-surface),.25) !important; }
.bc-current { color: rgba(var(--v-theme-on-surface),.7); }

/* Header */
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.header-left { display: flex; align-items: center; gap: 14px; }
.header-icon { width: 46px; height: 46px; border-radius: 12px; background: linear-gradient(135deg,#06b6d4,#0891b2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.page-title { font-size: 17px; font-weight: 800; letter-spacing: .5px; margin: 0; }
.page-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }

/* Filtro */
.filtro-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 20px; }
.filtro-quick { display: flex; gap: 6px; flex-wrap: wrap; }
.quick-btn { padding: 5px 14px; border-radius: 20px; border: 1px solid rgba(var(--v-theme-on-surface),.12); background: transparent; cursor: pointer; font-size: 12px; font-weight: 600; color: rgba(var(--v-theme-on-surface),.6); transition: all .15s; }
.quick-btn:hover { background: rgba(var(--v-theme-on-surface),.04); }
.quick-btn.active { background: #06b6d4; border-color: #06b6d4; color: #fff; }
.filtro-sep { width: 1px; height: 32px; background: rgba(var(--v-theme-on-surface),.1); }
.filtro-dates { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.date-field { display: flex; flex-direction: column; gap: 2px; }
.date-field label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.45); }
.date-input { padding: 5px 8px; border: 1px solid rgba(var(--v-theme-on-surface),.15); border-radius: 7px; font-size: 12px; background: rgba(var(--v-theme-on-surface),.03); color: rgb(var(--v-theme-on-surface)); outline: none; }
.date-input:focus { border-color: #06b6d4; }

/* Loading */
.loading-full { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px; color: rgba(var(--v-theme-on-surface),.4); font-size: 13px; }

/* KPI Row */
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
.kpi-card { border-radius: 14px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; color: white; }
.kpi-cyan   { background: linear-gradient(135deg,#06b6d4,#0891b2); }
.kpi-green  { background: linear-gradient(135deg,#22c55e,#16a34a); }
.kpi-orange { background: linear-gradient(135deg,#f59e0b,#d97706); }
.kpi-purple { background: linear-gradient(135deg,#8b5cf6,#7c3aed); }
.kpi-icon-wrap { width: 44px; height: 44px; background: rgba(255,255,255,.2); border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.kpi-val { font-size: 18px; font-weight: 800; line-height: 1.1; }
.kpi-lbl { font-size: 11px; font-weight: 600; opacity: .85; margin-top: 2px; }
.kpi-sub { font-size: 10px; opacity: .7; margin-top: 1px; }

/* Two / Three col */
.two-col   { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
.three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 18px; }

/* Panel */
.panel { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 14px; padding: 18px 20px; }
.panel-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.55); margin-bottom: 14px; display: flex; align-items: center; }
.empty-panel { text-align: center; padding: 24px; color: rgba(var(--v-theme-on-surface),.3); font-size: 12px; }

/* Estado bars */
.estado-list { display: flex; flex-direction: column; gap: 10px; }
.estado-row { display: flex; align-items: center; gap: 10px; font-size: 12px; }
.estado-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.estado-name { width: 90px; color: rgba(var(--v-theme-on-surface),.7); font-weight: 500; flex-shrink: 0; }
.estado-bar-wrap { flex: 1; height: 8px; background: rgba(var(--v-theme-on-surface),.07); border-radius: 4px; overflow: hidden; }
.estado-bar { height: 100%; border-radius: 4px; transition: width .4s; }
.estado-val { width: 36px; text-align: right; font-weight: 700; color: rgb(var(--v-theme-on-surface)); flex-shrink: 0; }
.resumen-row { margin-top: 6px; padding-top: 10px; border-top: 1px solid rgba(var(--v-theme-on-surface),.07); }
.fw-bold { font-weight: 700 !important; }
.cyan-txt { color: #06b6d4; font-size: 13px; }

/* Cobro bar */
.cobro-section { margin-top: 16px; }
.cobro-labels { display: flex; justify-content: space-between; font-size: 10px; font-weight: 600; color: rgba(var(--v-theme-on-surface),.5); margin-bottom: 5px; }
.cobro-bar-wrap { height: 12px; background: rgba(239,68,68,.15); border-radius: 6px; overflow: hidden; }
.cobro-bar-fill { height: 100%; background: linear-gradient(90deg,#22c55e,#16a34a); border-radius: 6px; transition: width .5s; }

/* Bar chart */
.bar-chart { display: flex; align-items: flex-end; gap: 8px; height: 140px; padding: 0 4px; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; }
.bar-val-top { font-size: 9px; font-weight: 600; color: rgba(var(--v-theme-on-surface),.5); height: 14px; white-space: nowrap; }
.bar-outer { flex: 1; width: 100%; display: flex; align-items: flex-end; gap: 2px; position: relative; }
.bar-fill-fact { flex: 1; background: #06b6d4; border-radius: 4px 4px 0 0; transition: height .4s; min-height: 2px; }
.bar-fill-cob  { flex: 1; background: #22c55e; border-radius: 4px 4px 0 0; transition: height .4s; min-height: 2px; }
.bar-mes { font-size: 9px; color: rgba(var(--v-theme-on-surface),.5); font-weight: 600; text-align: center; white-space: nowrap; }
.chart-legend { display: flex; gap: 14px; margin-top: 10px; justify-content: center; }
.leg-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: rgba(var(--v-theme-on-surface),.6); }
.leg-dot { width: 10px; height: 10px; border-radius: 3px; }

/* Top clientes */
.top-list { display: flex; flex-direction: column; gap: 10px; }
.top-row { display: flex; align-items: center; gap: 10px; }
.top-rank { width: 22px; height: 22px; border-radius: 50%; background: rgba(6,182,212,.12); color: #0891b2; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.top-info { flex: 1; min-width: 0; }
.top-name { font-size: 12px; font-weight: 600; color: rgb(var(--v-theme-on-surface)); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
.top-bar-wrap { height: 5px; background: rgba(var(--v-theme-on-surface),.07); border-radius: 3px; overflow: hidden; }
.top-bar { height: 100%; background: linear-gradient(90deg,#06b6d4,#0891b2); border-radius: 3px; transition: width .4s; }
.top-montos { text-align: right; flex-shrink: 0; }
.top-total { display: block; font-size: 12px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }
.top-cobrado { font-size: 10px; color: rgba(var(--v-theme-on-surface),.45); }

/* Financiero */
.fin-big { font-size: 26px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); margin: 10px 0 4px; }
.fin-sub { font-size: 11px; color: rgba(var(--v-theme-on-surface),.45); }

@media (max-width: 1100px) { .kpi-row { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 800px)  { .two-col { grid-template-columns: 1fr; } .three-col { grid-template-columns: 1fr; } }
@media (max-width: 600px)  { .kpi-row { grid-template-columns: 1fr; } }
</style>
