<template>
  <MainLayout>
    <div class="kx-container">

      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">ALMACÉN</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Kardex por Período</span>
      </div>

      <!-- HEADER -->
      <div class="kx-header">
        <div class="kx-header-icon">
          <v-icon size="28" color="white">mdi-file-chart-outline</v-icon>
        </div>
        <div>
          <h2 class="kx-title">Kardex por Período</h2>
          <p class="kx-subtitle">Movimiento de inventario del día por Centro de Costo</p>
        </div>
      </div>

      <!-- FILTROS -->
      <div class="kx-form-card">
        <div class="kx-form-row">

          <div class="kx-field">
            <v-text-field
              v-model="fecha"
              label="Fecha *"
              type="date"
              variant="outlined"
              density="compact"
              hide-details="auto"
              :error-messages="errFecha"
            />
          </div>

          <div class="kx-field">
            <v-select
              v-model="ccosto"
              :items="ccostos"
              item-title="nombre"
              item-value="codigo"
              label="Centro de Costo *"
              variant="outlined"
              density="compact"
              hide-details="auto"
              :error-messages="errCcosto"
            />
          </div>

          <div class="kx-field kx-field--btn">
            <v-btn
              color="#0891b2"
              variant="elevated"
              prepend-icon="mdi-magnify"
              :loading="loading"
              @click="generar"
            >
              Generar Kardex
            </v-btn>
            <v-btn
              v-if="filas.length > 0"
              color="success"
              variant="outlined"
              prepend-icon="mdi-file-excel"
              class="ml-2"
              @click="exportarCSV"
            >
              Exportar
            </v-btn>
          </div>

        </div>
      </div>

      <!-- MENSAJES -->
      <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-4" closable @click:close="errorMsg=''">{{ errorMsg }}</v-alert>

      <!-- REPORTE -->
      <div v-if="filas.length > 0" class="kx-reporte-card">

        <!-- INFO DEL REPORTE -->
        <div class="kx-reporte-header">
          <div>
            <span class="kx-reporte-label">Centro de Costo:</span>
            <span class="kx-reporte-val">{{ nombreCcosto }}</span>
          </div>
          <div>
            <span class="kx-reporte-label">Fecha:</span>
            <span class="kx-reporte-val">{{ fechaFormateada }}</span>
          </div>
          <div>
            <span class="kx-reporte-label">Productos con movimiento:</span>
            <span class="kx-reporte-val">{{ filas.length }}</span>
          </div>
        </div>

        <!-- KPI TOTALES -->
        <div class="kx-kpis">
          <div class="kx-kpi">
            <span class="kx-kpi-lbl">Total Entradas</span>
            <span class="kx-kpi-val kx-kpi--entrada">+{{ formatNum(totalEntradas) }}</span>
          </div>
          <div class="kx-kpi">
            <span class="kx-kpi-lbl">Total Salidas</span>
            <span class="kx-kpi-val kx-kpi--salida">-{{ formatNum(totalSalidas) }}</span>
          </div>
          <div class="kx-kpi">
            <span class="kx-kpi-lbl">Total Ventas</span>
            <span class="kx-kpi-val kx-kpi--venta">-{{ formatNum(totalVentas) }}</span>
          </div>
        </div>

        <!-- TABLA -->
        <div class="kx-table-wrap">
          <table class="kx-table" id="kx-tabla">
            <thead>
              <tr>
                <th>CÓD</th>
                <th class="th-nom">PRODUCTO</th>
                <th>UND</th>
                <th class="th-num">STOCK ANTERIOR</th>
                <th class="th-num th-entrada">ENTRADAS</th>
                <th class="th-num th-salida">SALIDAS</th>
                <th class="th-num th-venta">VENTAS</th>
                <th class="th-num th-stock">STOCK FINAL</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="grupo in productosAgrupados" :key="grupo.key">
                <tr class="kx-grupo-row">
                  <td colspan="8">
                    <v-icon size="13" class="mr-1" style="opacity:.6">mdi-folder-outline</v-icon>
                    {{ grupo.nombre }}
                  </td>
                </tr>
                <tr v-for="p in grupo.items" :key="p.codigo" class="kx-prod-row">
                  <td><span class="badge-cod">{{ p.codigo }}</span></td>
                  <td class="td-nom">{{ p.nombre }}</td>
                  <td><span class="badge-und">{{ p.und }}</span></td>
                  <td class="td-num">
                    <span :class="p.stock_anterior < 0 ? 'num-neg' : ''">{{ formatNum(p.stock_anterior) }}</span>
                  </td>
                  <td class="td-num">
                    <span v-if="p.entradas_dia > 0" class="num-entrada">+{{ formatNum(p.entradas_dia) }}</span>
                    <span v-else class="num-cero">—</span>
                  </td>
                  <td class="td-num">
                    <span v-if="p.salidas_dia > 0" class="num-salida">{{ formatNum(p.salidas_dia) }}</span>
                    <span v-else class="num-cero">—</span>
                  </td>
                  <td class="td-num">
                    <span v-if="p.ventas_dia > 0" class="num-venta">{{ formatNum(p.ventas_dia) }}</span>
                    <span v-else class="num-cero">—</span>
                  </td>
                  <td class="td-num">
                    <strong :class="p.stock_final < 0 ? 'num-neg' : 'num-stock'">{{ formatNum(p.stock_final) }}</strong>
                  </td>
                </tr>
              </template>

              <!-- FILA TOTALES -->
              <tr class="kx-total-row">
                <td colspan="3"><strong>TOTALES</strong></td>
                <td class="td-num"><strong>{{ formatNum(totalStockAnterior) }}</strong></td>
                <td class="td-num num-entrada"><strong>+{{ formatNum(totalEntradas) }}</strong></td>
                <td class="td-num num-salida"><strong>{{ formatNum(totalSalidas) }}</strong></td>
                <td class="td-num num-venta"><strong>{{ formatNum(totalVentas) }}</strong></td>
                <td class="td-num num-stock"><strong>{{ formatNum(totalStockFinal) }}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      <!-- EMPTY -->
      <div v-else-if="!loading && generado" class="kx-empty">
        <v-icon size="48" color="rgba(var(--v-theme-on-surface),.2)">mdi-package-variant-closed</v-icon>
        <p>No hay movimientos para esta fecha y Centro de Costo</p>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'

const auth    = useAuthStore()
const empresa = computed(() => auth.empresa)

// ── Filtros ───────────────────────────────────────────────────
const fecha    = ref(new Date().toISOString().slice(0, 10))
const ccosto   = ref(null)
const errFecha  = ref('')
const errCcosto = ref('')

// ── Datos ─────────────────────────────────────────────────────
const ccostos = ref([])
const filas   = ref([])   // raw rows from backend (with stock_final computed)
const loading  = ref(false)
const generado = ref(false)
const errorMsg = ref('')

// ── Cargar CC ─────────────────────────────────────────────────
async function cargarCcostos() {
  try {
    const res = await api.get('/ccostos', { params: { empresa: empresa.value } })
    ccostos.value = res.data?.data || res.data?.ccostos || []
  } catch (e) { console.error('Error cargando ccostos:', e) }
}
cargarCcostos()

// ── Computed helpers ──────────────────────────────────────────
const nombreCcosto = computed(() => {
  const cc = ccostos.value.find(c => c.codigo === ccosto.value)
  return cc ? cc.nombre : ccosto.value
})

const fechaFormateada = computed(() => {
  if (!fecha.value) return ''
  const [y, m, d] = fecha.value.split('-')
  return `${d}/${m}/${y}`
})

// ── Agrupación ───────────────────────────────────────────────
const productosAgrupados = computed(() => {
  const mapa = new Map()
  for (const p of filas.value) {
    const key    = p.grupo_codigo || '__sin__'
    const nombre = p.grupo_nombre || 'Sin Grupo'
    if (!mapa.has(key)) mapa.set(key, { key, nombre, items: [] })
    mapa.get(key).items.push(p)
  }
  return Array.from(mapa.values())
})

// ── Totales ───────────────────────────────────────────────────
const totalStockAnterior = computed(() => filas.value.reduce((s, p) => s + parseFloat(p.stock_anterior), 0))
const totalEntradas      = computed(() => filas.value.reduce((s, p) => s + parseFloat(p.entradas_dia), 0))
const totalSalidas       = computed(() => filas.value.reduce((s, p) => s + parseFloat(p.salidas_dia), 0))
const totalVentas        = computed(() => filas.value.reduce((s, p) => s + parseFloat(p.ventas_dia), 0))
const totalStockFinal    = computed(() => filas.value.reduce((s, p) => s + parseFloat(p.stock_final), 0))

// ── Formato ───────────────────────────────────────────────────
function formatNum(n) {
  const num = parseFloat(n)
  if (isNaN(num)) return '0'
  return num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
}

// ── Generar ───────────────────────────────────────────────────
async function generar() {
  errFecha.value  = fecha.value  ? '' : 'Requerido'
  errCcosto.value = ccosto.value ? '' : 'Requerido'
  if (errFecha.value || errCcosto.value) return

  loading.value  = true
  errorMsg.value = ''
  filas.value    = []
  generado.value = false

  try {
    const res = await api.get('/almacen/kardex', {
      params: { empresa: empresa.value, ccosto: ccosto.value, fecha: fecha.value }
    })
    // Calcular stock_final en el cliente
    filas.value = (res.data?.data || []).map(p => ({
      ...p,
      stock_anterior: parseFloat(p.stock_anterior) || 0,
      entradas_dia:   parseFloat(p.entradas_dia)   || 0,
      salidas_dia:    parseFloat(p.salidas_dia)     || 0,
      ventas_dia:     parseFloat(p.ventas_dia)      || 0,
      stock_final:    parseFloat(p.stock_anterior) + parseFloat(p.entradas_dia)
                      - parseFloat(p.salidas_dia)  - parseFloat(p.ventas_dia),
    }))
    generado.value = true
  } catch (e) {
    errorMsg.value = e?.response?.data?.error || e.message || 'Error al generar el kardex'
  } finally {
    loading.value = false
  }
}

// ── Exportar CSV ──────────────────────────────────────────────
function exportarCSV() {
  const encabezado = ['Codigo', 'Producto', 'Und', 'Stock Anterior', 'Entradas', 'Salidas', 'Ventas', 'Stock Final']
  const filasSinGrupo = filas.value
  const lineas = [
    `Kardex - ${nombreCcosto.value} - ${fechaFormateada.value}`,
    encabezado.join(';'),
    ...filasSinGrupo.map(p =>
      [p.codigo, p.nombre, p.und, p.stock_anterior, p.entradas_dia, p.salidas_dia, p.ventas_dia, p.stock_final].join(';')
    ),
    ['', 'TOTALES', '', totalStockAnterior.value, totalEntradas.value, totalSalidas.value, totalVentas.value, totalStockFinal.value].join(';')
  ]
  const blob = new Blob(['﻿' + lineas.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `Kardex_${ccosto.value}_${fecha.value}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.kx-container { padding: 24px; max-width: 1400px; margin: 0 auto; }

.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root    { font-size: 12px; font-weight: 700; color: #06b6d4; text-transform: uppercase; letter-spacing: .5px; }
.bc-sep     { color: rgba(var(--v-theme-on-surface),.3); }
.bc-cat     { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface),.8); font-weight: 500; }

.kx-header      { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
.kx-header-icon { width: 52px; height: 52px; border-radius: 10px; background: linear-gradient(135deg,#06b6d4,#0891b2); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 4px 14px rgba(6,182,212,.3); }
.kx-title       { font-size: 20px; font-weight: 800; margin: 0; }
.kx-subtitle    { font-size: 13px; color: rgba(var(--v-theme-on-surface),.55); margin: 2px 0 0; }

.kx-form-card  { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 10px; padding: 16px 20px; margin-bottom: 16px; }
.kx-form-row   { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
.kx-field      { min-width: 180px; flex: 1; }
.kx-field--btn { flex: 0 0 auto; display: flex; align-items: center; padding-top: 2px; }

.kx-reporte-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 10px; overflow: hidden; }

.kx-reporte-header { display: flex; gap: 28px; flex-wrap: wrap; padding: 14px 20px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.07); font-size: 13px; }
.kx-reporte-label  { color: rgba(var(--v-theme-on-surface),.5); margin-right: 6px; }
.kx-reporte-val    { font-weight: 700; }

.kx-kpis { display: flex; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.07); }
.kx-kpi  { flex: 1; padding: 12px 20px; border-right: 1px solid rgba(var(--v-theme-on-surface),.07); }
.kx-kpi:last-child { border-right: none; }
.kx-kpi-lbl { display: block; font-size: 11px; color: rgba(var(--v-theme-on-surface),.5); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
.kx-kpi-val { display: block; font-size: 20px; font-weight: 800; }
.kx-kpi--entrada { color: #10b981; }
.kx-kpi--salida  { color: #f59e0b; }
.kx-kpi--venta   { color: #ef4444; }

.kx-table-wrap { overflow-x: auto; max-height: 65vh; overflow-y: auto; }
.kx-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.kx-table thead th { position: sticky; top: 0; z-index: 2; background: rgb(var(--v-theme-surface)); padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: rgba(var(--v-theme-on-surface),.5); text-transform: uppercase; letter-spacing: .5px; border-bottom: 2px solid rgba(var(--v-theme-on-surface),.1); white-space: nowrap; }
.th-nom     { width: 100%; }
.th-num     { text-align: right !important; }
.th-entrada { color: #10b981 !important; }
.th-salida  { color: #f59e0b !important; }
.th-venta   { color: #ef4444 !important; }
.th-stock   { color: #0891b2 !important; }

.kx-grupo-row td { padding: 8px 12px 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.45); background: rgba(var(--v-theme-on-surface),.02); }
.kx-prod-row td  { padding: 8px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.04); }
.kx-prod-row:hover { background: rgba(var(--v-theme-on-surface),.02); }
.kx-total-row td { padding: 10px 12px; border-top: 2px solid rgba(var(--v-theme-on-surface),.1); background: rgba(var(--v-theme-on-surface),.03); font-size: 13px; }

.badge-cod { display:inline-block; padding:1px 6px; border-radius:4px; font-size:11px; font-weight:700; font-family:monospace; background:rgba(var(--v-theme-on-surface),.07); }
.badge-und { display:inline-block; padding:1px 6px; border-radius:4px; font-size:11px; background:rgba(8,145,178,.1); color:#0891b2; font-weight:600; }
.td-nom { font-weight: 500; }
.td-num { text-align: right !important; white-space: nowrap; }

.num-entrada { color: #10b981; font-weight: 600; }
.num-salida  { color: #f59e0b; font-weight: 600; }
.num-venta   { color: #ef4444; font-weight: 600; }
.num-stock   { color: #0891b2; }
.num-neg     { color: #ef4444; font-weight: 700; }
.num-cero    { color: rgba(var(--v-theme-on-surface),.25); }

.kx-empty { text-align:center; padding:60px 24px; color:rgba(var(--v-theme-on-surface),.4); display:flex; flex-direction:column; align-items:center; gap:12px; font-size:14px; }
</style>
