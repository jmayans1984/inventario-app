<template>
  <MainLayout>
    <div class="kx-container">

      <PageHeader
        title="Kardex por Período"
        description="Movimiento de inventario del día por Centro de Costo"
        :crumbs="['Almacén', 'Reportes', 'Kardex por Período']"
      />

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
              color="primary"
              variant="elevated"
              prepend-icon="mdi-magnify"
              :loading="loading"
              @click="generar"
            >
              Generar Kardex
            </v-btn>
            <v-btn
              v-if="filas.length > 0"
              color="error"
              variant="outlined"
              prepend-icon="mdi-file-pdf-box"
              class="ml-2"
              @click="exportarPDF"
            >
              Exportar PDF
            </v-btn>
          </div>

        </div>
      </div>

      <!-- MENSAJES -->
      <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-4" closable @click:close="errorMsg=''">{{ errorMsg }}</v-alert>

      <!-- REPORTE -->
      <div v-if="filas.length > 0" class="kx-reporte-card">

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
                <th class="th-cantidad">CANTIDAD</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="grupo in productosAgrupados" :key="grupo.key">
                <tr class="kx-grupo-row">
                  <td colspan="9">
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
                  <td class="td-cantidad">__________</td>
                </tr>
              </template>

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
import PageHeader from '../../components/common/PageHeader.vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { fechaInputLocal } from '../../utils/formatters'
import { alignReportCell, detailTableOptions, drawReportFooter, drawReportHeader } from '../../utils/pdfReportStyle'

const auth    = useAuthStore()
const empresa = computed(() => auth.empresa)

// ── Filtros ───────────────────────────────────────────────────
const fecha    = ref(fechaInputLocal())
const ccosto   = ref(null)
const errFecha  = ref('')
const errCcosto = ref('')

// ── Datos ─────────────────────────────────────────────────────
const ccostos       = ref([])
const filas         = ref([])
const totalEfectivo = ref(0)
const loading       = ref(false)
const generado      = ref(false)
const errorMsg      = ref('')

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
  return `${m}/${d}/${y}`
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
  if (isNaN(num)) return '0.00'
  return num.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
    totalEfectivo.value = parseFloat(res.data?.total_efectivo || 0)
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

// ── Exportar PDF ──────────────────────────────────────────────
function exportarPDF() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const ML = 10
  const empresaNombre = auth.empresaNombre || empresa.value || 'EMPRESA'
  const startY = drawReportHeader(doc, {
    title: 'KARDEX POR PERIODO',
    subtitle: `Centro de Costo: ${nombreCcosto.value || '-'} | Fecha: ${fechaFormateada.value}`,
    empresa: empresaNombre,
    usuario: auth.userName || auth.userNombre,
    moduleName: 'Modulo de almacen | Reportes',
    margin: ML,
  })

  const body = []
  for (const grupo of productosAgrupados.value) {
    body.push([{
      content: String(grupo.nombre || 'Sin Grupo').toUpperCase(),
      colSpan: 9,
      styles: {
        fontStyle: 'bold',
        fontSize: 6.5,
        textColor: [0, 0, 0],
        fillColor: false,
        halign: 'left',
        lineWidth: { top: 0.25, bottom: 0.18 },
        lineColor: [115, 115, 115],
        cellPadding: { top: 1.5, right: 1.8, bottom: 1.2, left: 1.8 },
      },
    }])

    for (const p of grupo.items) {
      body.push([
        p.codigo,
        p.nombre,
        p.und,
        formatNum(p.stock_anterior),
        p.entradas_dia > 0 ? formatNum(p.entradas_dia) : '-',
        p.salidas_dia > 0 ? formatNum(p.salidas_dia) : '-',
        p.ventas_dia > 0 ? formatNum(p.ventas_dia) : '-',
        formatNum(p.stock_final),
        '__________',
      ])
    }
  }

  autoTable(doc, {
    startY,
    head: [[
      'Cod',
      'Producto',
      'Und',
      'Stock Ant.',
      'Entradas',
      'Salidas',
      'Ventas',
      'Stock Final',
      'Cantidad',
    ]],
    body,
    ...detailTableOptions(ML),
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 13, halign: 'center' },
      3: { cellWidth: 20, halign: 'right' },
      4: { cellWidth: 17, halign: 'right' },
      5: { cellWidth: 17, halign: 'right' },
      6: { cellWidth: 17, halign: 'right' },
      7: { cellWidth: 20, halign: 'right' },
      8: { cellWidth: 25, halign: 'center' },
    },
    didParseCell: (data) => {
      alignReportCell(data, { 0: 'center', 1: 'left', 2: 'center', 3: 'right', 4: 'right', 5: 'right', 6: 'right', 7: 'right', 8: 'center' })
      if (data.section === 'body' && data.row.raw?.[0]?.colSpan === 9) {
        data.cell.styles.halign = 'left'
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fontSize = 6.5
        data.cell.styles.lineWidth = { top: 0.25, bottom: 0.18 }
        data.cell.styles.lineColor = [115, 115, 115]
      }
    },
    didDrawPage: (data) => drawReportFooter(doc, { pageNumber: data.pageNumber, margin: ML }),
  })

  window.open(URL.createObjectURL(doc.output('blob')), '_blank')
}
</script>

<style scoped>
.kx-container { padding: 24px; max-width: 1400px; margin: 0 auto; }

.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root    { font-size: 12px; font-weight: 700; color: var(--indigo); text-transform: uppercase; letter-spacing: .5px; }
.bc-sep     { color: rgba(var(--v-theme-on-surface),.3); }
.bc-cat     { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface),.8); font-weight: 500; }

.kx-header      { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
.kx-header-icon { width: 52px; height: 52px; border-radius: 10px; background: linear-gradient(135deg,var(--indigo),var(--indigo)); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 4px 14px rgba(6,182,212,.3); }
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
.kx-kpi--entrada { color: var(--success); }
.kx-kpi--salida  { color: var(--gold); }
.kx-kpi--venta   { color: var(--error); }

.kx-table-wrap { overflow-x: auto; }
.kx-table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
.kx-table thead th { position: sticky; top: 0; z-index: 2; background: rgb(var(--v-theme-surface)); padding: 10px 10px; text-align: left; font-size: 11px; font-weight: 700; color: rgba(var(--v-theme-on-surface),.5); text-transform: uppercase; letter-spacing: .5px; border-bottom: 2px solid rgba(var(--v-theme-on-surface),.1); white-space: nowrap; overflow: hidden; }
.th-nom     { width: 155px; }
.th-num     { text-align: right !important; }
.th-entrada { color: var(--success) !important; }
.th-salida  { color: var(--gold) !important; }
.th-venta   { color: var(--error) !important; }
.th-stock   { color: var(--indigo) !important; }

.kx-grupo-row td { padding: 8px 12px 3px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.45); background: rgba(var(--v-theme-on-surface),.02); text-align: left; }
.kx-prod-row td  { padding: 4px 10px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.04); }
.kx-prod-row:hover { background: rgba(var(--v-theme-on-surface),.02); }
.kx-total-row td { padding: 7px 10px; border-top: 2px solid rgba(var(--v-theme-on-surface),.1); background: rgba(var(--v-theme-on-surface),.03); font-size: 13px; }

.badge-cod { display:inline-block; padding:1px 6px; border-radius:4px; font-size:11px; font-weight:700; font-family:monospace; background:rgba(var(--v-theme-on-surface),.07); }
.badge-und { display:inline-block; padding:1px 6px; border-radius:4px; font-size:11px; background:rgba(8,145,178,.1); color:var(--indigo); font-weight:600; }
.td-nom { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.td-num { text-align: right !important; white-space: nowrap; }

.num-entrada { color: var(--success); font-weight: 600; }
.num-salida  { color: var(--gold); font-weight: 600; }
.num-venta   { color: var(--error); font-weight: 600; }
.num-stock   { color: var(--indigo); }
.num-neg     { color: var(--error); font-weight: 700; }
.num-cero    { color: rgba(var(--v-theme-on-surface),.25); }

.kx-empty { text-align:center; padding:60px 24px; color:rgba(var(--v-theme-on-surface),.4); display:flex; flex-direction:column; align-items:center; gap:12px; font-size:14px; }

.th-cantidad { text-align: center !important; color: rgba(var(--v-theme-on-surface),.4) !important; font-style: italic; min-width: 110px; }
.td-cantidad { text-align: center; color: rgba(var(--v-theme-on-surface),.25); font-size: 12px; white-space: nowrap; }
</style>
