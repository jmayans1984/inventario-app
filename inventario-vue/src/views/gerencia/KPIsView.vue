<template>
  <MainLayout>
    <div class="kpi-container">

      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">GERENCIA</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">KPIs</span>
      </div>

      <!-- HEADER -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <v-icon size="24" color="white">mdi-gauge</v-icon>
          </div>
          <div>
            <h1 class="page-title">INDICADORES CLAVE DE DESEMPEÑO</h1>
            <p class="page-sub">Métricas globales del negocio — datos históricos completos</p>
          </div>
        </div>
        <v-btn color="#06b6d4" variant="flat" prepend-icon="mdi-refresh" :loading="loading" @click="cargar">
          Actualizar
        </v-btn>
      </div>

      <div v-if="loading" class="loading-full">
        <v-progress-circular indeterminate color="#06b6d4" size="48" />
        <p>Calculando indicadores...</p>
      </div>

      <template v-else-if="data">

        <!-- ── ROW 1: KPIs PRINCIPALES ── -->
        <div class="kpi-main-row">

          <!-- Tasa de Cobro -->
          <div class="kpi-big-card">
            <div class="kpi-big-header" style="border-color:#22c55e">
              <v-icon size="28" color="#22c55e">mdi-percent</v-icon>
              <span class="kpi-big-title">Tasa de Cobro</span>
            </div>
            <div class="kpi-big-num" :style="{ color: data.kpis.tasa_cobro >= 70 ? '#22c55e' : data.kpis.tasa_cobro >= 40 ? '#f59e0b' : '#ef4444' }">
              {{ data.kpis.tasa_cobro }}%
            </div>
            <div class="gauge-wrap">
              <div class="gauge-bar">
                <div class="gauge-fill" :style="{ width: data.kpis.tasa_cobro + '%', background: data.kpis.tasa_cobro >= 70 ? '#22c55e' : data.kpis.tasa_cobro >= 40 ? '#f59e0b' : '#ef4444' }"></div>
              </div>
            </div>
            <div class="kpi-big-detail">
              <span>Cobrado: <strong>{{ fmtMonto(data.kpis.total_cobrado) }}</strong></span>
              <span>Facturado: <strong>{{ fmtMonto(data.kpis.total_facturado) }}</strong></span>
            </div>
          </div>

          <!-- Tasa de Facturación -->
          <div class="kpi-big-card">
            <div class="kpi-big-header" style="border-color:#06b6d4">
              <v-icon size="28" color="#06b6d4">mdi-receipt-text-check-outline</v-icon>
              <span class="kpi-big-title">Órdenes Facturadas</span>
            </div>
            <div class="kpi-big-num" :style="{ color: data.kpis.tasa_facturacion >= 70 ? '#06b6d4' : data.kpis.tasa_facturacion >= 40 ? '#f59e0b' : '#ef4444' }">
              {{ data.kpis.tasa_facturacion }}%
            </div>
            <div class="gauge-wrap">
              <div class="gauge-bar">
                <div class="gauge-fill" :style="{ width: data.kpis.tasa_facturacion + '%', background: '#06b6d4' }"></div>
              </div>
            </div>
            <div class="kpi-big-detail">
              <span>Facturadas: <strong>{{ data.kpis.ordenes_facturadas }}</strong></span>
              <span>Total órdenes: <strong>{{ data.kpis.total_ordenes }}</strong></span>
            </div>
          </div>

          <!-- Ticket Promedio -->
          <div class="kpi-big-card">
            <div class="kpi-big-header" style="border-color:#8b5cf6">
              <v-icon size="28" color="#8b5cf6">mdi-tag-outline</v-icon>
              <span class="kpi-big-title">Ticket Promedio</span>
            </div>
            <div class="kpi-big-num" style="color:#8b5cf6; font-size: 20px;">
              {{ fmtMonto(data.kpis.ticket_promedio) }}
            </div>
            <div class="kpi-big-detail mt-top">
              <span>Por factura</span>
              <span>{{ data.kpis.total_facturas }} facturas totales</span>
            </div>
          </div>

          <!-- Por Cobrar -->
          <div class="kpi-big-card">
            <div class="kpi-big-header" style="border-color:#f59e0b">
              <v-icon size="28" color="#f59e0b">mdi-clock-alert-outline</v-icon>
              <span class="kpi-big-title">Cartera Pendiente</span>
            </div>
            <div class="kpi-big-num" style="color:#f59e0b; font-size: 20px;">
              {{ fmtMonto(data.kpis.total_por_cobrar) }}
            </div>
            <div class="kpi-big-detail mt-top">
              <span>Clientes activos: <strong>{{ data.kpis.clientes_activos }}</strong></span>
              <span>Órdenes pendientes: <strong>{{ data.kpis.ordenes_pendientes }}</strong></span>
            </div>
          </div>

        </div>

        <!-- ── ROW 2: ÓRDENES RESUMEN ── -->
        <div class="ordenes-resumen">
          <div class="ord-stat" v-for="s in ordenesStats" :key="s.label">
            <div class="ord-stat-icon" :style="{ background: s.bg }">
              <v-icon size="18" :color="s.color">{{ s.icon }}</v-icon>
            </div>
            <div class="ord-stat-body">
              <div class="ord-stat-val" :style="{ color: s.color }">{{ s.val }}</div>
              <div class="ord-stat-lbl">{{ s.label }}</div>
            </div>
          </div>
        </div>

        <!-- ── ROW 3: TOP PRODUCTOS + CLIENTES ── -->
        <div class="two-col">

          <!-- Top Productos -->
          <div class="panel">
            <div class="panel-title">
              <v-icon size="16" color="#06b6d4" class="mr-1">mdi-package-variant-closed</v-icon>
              Top 10 Productos más Pedidos
            </div>
            <div v-if="data.top_productos.length === 0" class="empty-panel">Sin datos de productos</div>
            <div v-else class="rank-list">
              <div v-for="(p, i) in data.top_productos" :key="i" class="rank-row">
                <div class="rank-num" :class="i < 3 ? 'rank-top' : ''">{{ i + 1 }}</div>
                <div class="rank-info">
                  <div class="rank-name">{{ p.producto_nombre }}</div>
                  <div class="rank-meta">
                    <span class="rank-grupo">{{ p.grupo }}</span>
                    <span class="rank-cant">{{ fmtCant(p.total_cant) }} und</span>
                  </div>
                  <div class="rank-bar-wrap">
                    <div class="rank-bar" :style="{ width: pct(p.total_valor, data.top_productos[0].total_valor) + '%' }"></div>
                  </div>
                </div>
                <div class="rank-valor">{{ fmtMonto(p.total_valor) }}</div>
              </div>
            </div>
          </div>

          <!-- Clientes por Volumen -->
          <div class="panel">
            <div class="panel-title">
              <v-icon size="16" color="#06b6d4" class="mr-1">mdi-domain</v-icon>
              Clientes por Volumen de Negocio
            </div>
            <div v-if="data.clientes_volumen.length === 0" class="empty-panel">Sin datos de clientes</div>
            <div v-else class="rank-list">
              <div v-for="(c, i) in data.clientes_volumen" :key="i" class="rank-row">
                <div class="rank-num" :class="i < 3 ? 'rank-top' : ''">{{ i + 1 }}</div>
                <div class="rank-info">
                  <div class="rank-name">{{ c.cliente_nombre }}</div>
                  <div class="rank-meta">
                    <span class="chip-fact">{{ c.facturadas }} fact.</span>
                    <span class="chip-pend" v-if="+c.pendientes > 0">{{ c.pendientes }} pend.</span>
                    <span class="rank-cant">{{ c.total_ordenes }} órdenes</span>
                  </div>
                  <div class="rank-bar-wrap">
                    <div class="rank-bar" style="background:#8b5cf6"
                      :style="{ width: pct(c.valor_total, data.clientes_volumen[0].valor_total) + '%' }"></div>
                  </div>
                </div>
                <div class="rank-valor">{{ fmtMonto(c.valor_total) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── ROW 4: GASTOS POR CUENTA ── -->
        <div class="panel" v-if="data.gastos_cuenta.length > 0">
          <div class="panel-title">
            <v-icon size="16" color="#ef4444" class="mr-1">mdi-receipt-text-outline</v-icon>
            Gastos por Cuenta Contable
          </div>
          <div class="gasto-grid">
            <div v-for="(g, i) in data.gastos_cuenta" :key="i" class="gasto-item">
              <div class="gasto-header">
                <span class="gasto-cuenta">{{ g.cuenta }}</span>
                <span class="gasto-count">{{ g.count_gastos }} registros</span>
              </div>
              <div class="gasto-nombre">{{ g.cuenta_nombre }}</div>
              <div class="gasto-bar-wrap">
                <div class="gasto-bar"
                  :style="{ width: pct(g.total_gastado, data.gastos_cuenta[0].total_gastado) + '%' }"></div>
              </div>
              <div class="gasto-total">{{ fmtMonto(g.total_gastado) }}</div>
            </div>
          </div>
        </div>

      </template>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const empresa   = computed(() => authStore.empresaCodigo || authStore.empresa || localStorage.getItem('empresaActual'))

const data    = ref(null)
const loading = ref(false)

async function cargar() {
  loading.value = true
  try {
    const r = await api.get('/gerencia/kpis', { params: { empresa: empresa.value } })
    data.value = r.data
  } catch (e) { console.error(e) } finally { loading.value = false }
}

const ordenesStats = computed(() => {
  if (!data.value) return []
  const k = data.value.kpis
  return [
    { label: 'Total Órdenes',    val: k.total_ordenes,      icon: 'mdi-clipboard-list-outline',    color: '#06b6d4', bg: 'rgba(6,182,212,.12)' },
    { label: 'Pendientes',        val: k.ordenes_pendientes,  icon: 'mdi-clock-outline',              color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
    { label: 'Entregadas',        val: k.ordenes_entregadas,  icon: 'mdi-truck-check-outline',        color: '#3b82f6', bg: 'rgba(59,130,246,.12)' },
    { label: 'Facturadas',        val: k.ordenes_facturadas,  icon: 'mdi-receipt-text-check-outline', color: '#22c55e', bg: 'rgba(34,197,94,.12)' },
    { label: 'Valor Total Órdenes', val: fmtMontoK(k.valor_ordenes), icon: 'mdi-cash-multiple', color: '#8b5cf6', bg: 'rgba(139,92,246,.12)' },
  ]
})

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

function fmtCant(v) {
  return parseFloat(v || 0).toLocaleString('es-CO', { maximumFractionDigits: 1 })
}

function pct(part, total) {
  const p = parseFloat(part) || 0
  const t = parseFloat(total) || 1
  return Math.max(2, Math.round(p / t * 100))
}

onMounted(cargar)
</script>

<style scoped>
.kpi-container { padding: 24px; max-width: 1300px; margin: 0 auto; }

/* Breadcrumb */
.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.45); }
.bc-root { color: #06b6d4; }
.bc-sep  { color: rgba(var(--v-theme-on-surface),.25) !important; }
.bc-current { color: rgba(var(--v-theme-on-surface),.7); }

/* Header */
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
.header-left { display: flex; align-items: center; gap: 14px; }
.header-icon { width: 46px; height: 46px; border-radius: 12px; background: linear-gradient(135deg,#06b6d4,#0891b2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.page-title { font-size: 17px; font-weight: 800; letter-spacing: .5px; margin: 0; }
.page-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }

/* Loading */
.loading-full { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px; color: rgba(var(--v-theme-on-surface),.4); font-size: 13px; }

/* KPI Big Row */
.kpi-main-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
.kpi-big-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 14px; padding: 20px 18px; }
.kpi-big-header { display: flex; align-items: center; gap: 10px; border-bottom: 2px solid; padding-bottom: 12px; margin-bottom: 14px; }
.kpi-big-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: rgba(var(--v-theme-on-surface),.6); }
.kpi-big-num { font-size: 32px; font-weight: 900; line-height: 1; margin-bottom: 12px; }
.gauge-wrap { margin-bottom: 14px; }
.gauge-bar { height: 10px; background: rgba(var(--v-theme-on-surface),.08); border-radius: 5px; overflow: hidden; }
.gauge-fill { height: 100%; border-radius: 5px; transition: width .5s; }
.kpi-big-detail { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: rgba(var(--v-theme-on-surface),.55); }
.kpi-big-detail strong { color: rgb(var(--v-theme-on-surface)); }
.mt-top { margin-top: 26px; }

/* Órdenes resumen */
.ordenes-resumen { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 18px; }
.ord-stat { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 12px; padding: 14px 16px; display: flex; align-items: center; gap: 12px; }
.ord-stat-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ord-stat-val { font-size: 20px; font-weight: 800; line-height: 1.1; }
.ord-stat-lbl { font-size: 10px; color: rgba(var(--v-theme-on-surface),.5); font-weight: 500; margin-top: 2px; }

/* Two col */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }

/* Panel */
.panel { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 14px; padding: 18px 20px; margin-bottom: 18px; }
.panel-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.55); margin-bottom: 16px; display: flex; align-items: center; }
.empty-panel { text-align: center; padding: 24px; color: rgba(var(--v-theme-on-surface),.3); font-size: 12px; }

/* Rank list */
.rank-list { display: flex; flex-direction: column; gap: 10px; }
.rank-row { display: flex; align-items: center; gap: 10px; }
.rank-num { width: 24px; height: 24px; border-radius: 6px; background: rgba(var(--v-theme-on-surface),.06); color: rgba(var(--v-theme-on-surface),.5); font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.rank-top { background: rgba(6,182,212,.15); color: #0891b2; }
.rank-info { flex: 1; min-width: 0; }
.rank-name { font-size: 12px; font-weight: 600; color: rgb(var(--v-theme-on-surface)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px; }
.rank-meta { display: flex; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; }
.rank-grupo { font-size: 10px; color: rgba(var(--v-theme-on-surface),.4); }
.rank-cant { font-size: 10px; color: rgba(var(--v-theme-on-surface),.5); font-weight: 600; }
.rank-bar-wrap { height: 4px; background: rgba(var(--v-theme-on-surface),.07); border-radius: 2px; overflow: hidden; }
.rank-bar { height: 100%; background: linear-gradient(90deg,#06b6d4,#0891b2); border-radius: 2px; transition: width .4s; }
.rank-valor { font-size: 12px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); text-align: right; flex-shrink: 0; min-width: 90px; }
.chip-fact { font-size: 10px; background: rgba(34,197,94,.12); color: #16a34a; padding: 1px 6px; border-radius: 8px; font-weight: 600; }
.chip-pend { font-size: 10px; background: rgba(245,158,11,.12); color: #b45309; padding: 1px 6px; border-radius: 8px; font-weight: 600; }

/* Gastos por cuenta */
.gasto-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.gasto-item { background: rgba(var(--v-theme-on-surface),.03); border: 1px solid rgba(var(--v-theme-on-surface),.07); border-radius: 10px; padding: 12px 14px; }
.gasto-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.gasto-cuenta { font-size: 10px; font-weight: 700; font-family: monospace; color: #06b6d4; background: rgba(6,182,212,.1); padding: 1px 6px; border-radius: 4px; }
.gasto-count { font-size: 10px; color: rgba(var(--v-theme-on-surface),.4); }
.gasto-nombre { font-size: 12px; font-weight: 600; color: rgb(var(--v-theme-on-surface)); margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gasto-bar-wrap { height: 6px; background: rgba(var(--v-theme-on-surface),.08); border-radius: 3px; overflow: hidden; margin-bottom: 6px; }
.gasto-bar { height: 100%; background: linear-gradient(90deg,#ef4444,#dc2626); border-radius: 3px; transition: width .4s; }
.gasto-total { font-size: 13px; font-weight: 700; color: #ef4444; }

@media (max-width: 1100px) { .kpi-main-row { grid-template-columns: repeat(2,1fr); } .ordenes-resumen { grid-template-columns: repeat(3,1fr); } }
@media (max-width: 800px)  { .two-col { grid-template-columns: 1fr; } .ordenes-resumen { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 600px)  { .kpi-main-row { grid-template-columns: 1fr; } .ordenes-resumen { grid-template-columns: 1fr; } }
</style>
