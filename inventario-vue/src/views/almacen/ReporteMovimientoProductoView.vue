<template>
  <MainLayout>
    <div class="mp-container">

      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">ALMACÉN</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Movimiento por Producto</span>
      </div>

      <!-- HEADER -->
      <div class="mp-header">
        <div class="mp-header-icon">
          <v-icon size="28" color="white">mdi-swap-vertical-bold</v-icon>
        </div>
        <div>
          <h2 class="mp-title">Movimiento por Producto</h2>
          <p class="mp-subtitle">Detalle día a día de entradas, salidas y ventas por rango de fechas</p>
        </div>
      </div>

      <!-- FILTROS -->
      <div class="mp-form-card">
        <div class="mp-form-row">

          <div class="mp-field">
            <v-text-field
              v-model="fechaInicio"
              label="Fecha inicio *"
              type="date"
              variant="outlined"
              density="compact"
              hide-details="auto"
              :error-messages="errFechaInicio"
            />
          </div>

          <div class="mp-field">
            <v-text-field
              v-model="fechaFin"
              label="Fecha fin *"
              type="date"
              variant="outlined"
              density="compact"
              hide-details="auto"
              :error-messages="errFechaFin"
            />
          </div>

          <div class="mp-field">
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

          <div class="mp-field mp-field--prod">
            <v-autocomplete
              v-model="filtroProducto"
              :items="productosDisponibles"
              item-title="label"
              item-value="codigo"
              label="Productos (opcional)"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              multiple
              chips
              closable-chips
              placeholder="Todos los productos"
              no-data-text="Genere el reporte primero"
            />
          </div>

          <div class="mp-field mp-field--btn">
            <v-btn
              color="#0891b2"
              variant="elevated"
              prepend-icon="mdi-magnify"
              :loading="loading"
              @click="generar"
            >
              Generar
            </v-btn>
            <v-btn
              v-if="productosAgrupados.length > 0"
              color="error"
              variant="outlined"
              prepend-icon="mdi-file-pdf-box"
              class="ml-2"
              @click="exportarPDF"
            >
              PDF
            </v-btn>
          </div>

        </div>
      </div>

      <!-- MENSAJES -->
      <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-4" closable @click:close="errorMsg=''">{{ errorMsg }}</v-alert>

      <!-- REPORTE -->
      <div v-if="productosAgrupados.length > 0" class="mp-reporte-card">

        <!-- KPIs -->
        <div class="mp-kpis">
          <div class="mp-kpi">
            <span class="mp-kpi-lbl">Productos con movimiento</span>
            <span class="mp-kpi-val">{{ totalProductos }}</span>
          </div>
          <div class="mp-kpi">
            <span class="mp-kpi-lbl">Total entradas</span>
            <span class="mp-kpi-val mp-kpi--entrada">{{ fmtNum(totalEntradas) }}</span>
          </div>
          <div class="mp-kpi">
            <span class="mp-kpi-lbl">Total salidas</span>
            <span class="mp-kpi-val mp-kpi--salida">{{ fmtNum(totalSalidas) }}</span>
          </div>
          <div class="mp-kpi">
            <span class="mp-kpi-lbl">Total ventas</span>
            <span class="mp-kpi-val mp-kpi--venta">{{ fmtNum(totalVentas) }}</span>
          </div>
        </div>

        <!-- TABLA -->
        <div class="mp-table-wrap">
          <table class="mp-table">
            <thead>
              <tr>
                <th class="th-fecha">FECHA</th>
                <th class="th-tipo">TIPO</th>
                <th class="th-prod">PRODUCTO</th>
                <th class="th-und">UND</th>
                <th class="th-num th-ant">STOCK INICIAL</th>
                <th class="th-num th-ent">ENTRADAS</th>
                <th class="th-num th-sal">SALIDAS</th>
                <th class="th-num th-ven">VENTAS</th>
                <th class="th-num th-saldo">SALDO</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="grupo in productosAgrupados" :key="grupo.key">
                <!-- Fila de grupo -->
                <tr class="mp-grupo-row">
                  <td colspan="9">
                    <v-icon size="13" class="mr-1" style="opacity:.6">mdi-folder-outline</v-icon>
                    {{ grupo.nombre }}
                  </td>
                </tr>

                <!-- Por cada producto del grupo -->
                <template v-for="prod in grupo.productos" :key="prod.codigo">
                  <!-- Cabecera de producto -->
                  <tr class="mp-prod-header">
                    <td colspan="3" class="prod-header-nombre">
                      <span class="badge-cod">{{ prod.codigo }}</span>
                      <strong class="ml-2">{{ prod.nombre }}</strong>
                    </td>
                    <td class="ta-c"><span class="badge-und">{{ prod.und }}</span></td>
                    <td class="td-num">
                      <span class="num-ini">{{ fmtNum(prod.stockInicial) }}</span>
                    </td>
                    <td colspan="4" class="td-prod-span">
                      <span class="text-muted">{{ prod.dias.length }} movimiento(s)</span>
                    </td>
                  </tr>

                  <!-- Filas de días -->
                  <tr v-for="dia in prod.dias" :key="`${dia.fecha}-${dia.tipo}`" class="mp-dia-row">
                    <td class="td-fecha">{{ fmtFecha(dia.fecha) }}</td>
                    <td class="td-tipo"><span :class="['badge-tipo', tipoBadgeClass(dia.tipo)]">{{ dia.tipo }}</span></td>
                    <td></td>
                    <td></td>
                    <td class="td-num"><span class="num-ant">{{ fmtNum(dia.saldoAnterior) }}</span></td>
                    <td class="td-num">
                      <span v-if="dia.entradas > 0" class="num-entrada">+{{ fmtNum(dia.entradas) }}</span>
                      <span v-else class="num-cero">—</span>
                    </td>
                    <td class="td-num">
                      <span v-if="dia.salidas > 0" class="num-salida">{{ fmtNum(dia.salidas) }}</span>
                      <span v-else class="num-cero">—</span>
                    </td>
                    <td class="td-num">
                      <span v-if="dia.ventas > 0" class="num-venta">{{ fmtNum(dia.ventas) }}</span>
                      <span v-else class="num-cero">—</span>
                    </td>
                    <td class="td-num">
                      <strong :class="dia.saldoFinal < 0 ? 'num-neg' : 'num-saldo'">{{ fmtNum(dia.saldoFinal) }}</strong>
                    </td>
                  </tr>

                  <!-- Total del producto -->
                  <tr class="mp-prod-total">
                    <td colspan="4" class="ta-r prod-total-lbl">TOTAL {{ prod.nombre }}</td>
                    <td class="td-num"><span class="num-ini">{{ fmtNum(prod.stockInicial) }}</span></td>
                    <td class="td-num"><strong class="num-entrada">{{ fmtNum(prod.totalEntradas) }}</strong></td>
                    <td class="td-num"><strong class="num-salida">{{ fmtNum(prod.totalSalidas) }}</strong></td>
                    <td class="td-num"><strong class="num-venta">{{ fmtNum(prod.totalVentas) }}</strong></td>
                    <td class="td-num"><strong :class="prod.stockFinal < 0 ? 'num-neg' : 'num-saldo'">{{ fmtNum(prod.stockFinal) }}</strong></td>
                  </tr>
                </template>
              </template>
            </tbody>
          </table>
        </div>

      </div>

      <!-- EMPTY -->
      <div v-else-if="!loading && generado" class="mp-empty">
        <v-icon size="48" color="rgba(var(--v-theme-on-surface),.2)">mdi-swap-vertical</v-icon>
        <p>No hay movimientos para el período y Centro de Costo seleccionados</p>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const auth    = useAuthStore()
const empresa = computed(() => auth.empresa)

// ── Estado inicial con rango de este mes ──────────────────────────
const hoy = new Date()
const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10)
const hoyStr       = hoy.toISOString().slice(0, 10)

const fechaInicio = ref(primerDiaMes)
const fechaFin    = ref(hoyStr)
const ccosto      = ref(null)
const errFechaInicio = ref('')
const errFechaFin    = ref('')
const errCcosto      = ref('')

// ── Datos ─────────────────────────────────────────────────────────
const ccostos  = ref([])
const rawRows  = ref([])
const stockInicialMap = ref({})
const filtroProducto  = ref([])
const loading  = ref(false)
const generado = ref(false)
const errorMsg = ref('')

// ── Cargar centros de costo ───────────────────────────────────────
async function cargarCcostos() {
  try {
    const res = await api.get('/ccostos', { params: { empresa: empresa.value } })
    ccostos.value = res.data?.data || res.data?.ccostos || []
  } catch (e) { console.error('Error cargando ccostos:', e) }
}
cargarCcostos()

// ── Helpers de formato ────────────────────────────────────────────
function fmtNum(v) {
  const n = parseFloat(v) || 0
  return n.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function fmtFecha(f) {
  if (!f) return ''
  const [y, m, d] = f.split('-')
  return `${d}/${m}/${y}`
}

// ── Computed: nombre del ccosto ───────────────────────────────────
const nombreCcosto = computed(() => {
  const cc = ccostos.value.find(c => c.codigo === ccosto.value)
  return cc ? cc.nombre : ccosto.value || ''
})

// ── Computed: lista de productos únicos para el autocomplete ──────
const productosDisponibles = computed(() => {
  const seen = new Map()
  for (const r of rawRows.value) {
    if (!seen.has(r.codigo)) {
      seen.set(r.codigo, { codigo: r.codigo, label: r.nombre })
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label))
})

// ── Computed principal: agrupar por grupo → producto → días ───────
const productosAgrupados = computed(() => {
  if (!rawRows.value.length) return []

  // Aplicar filtro de productos si hay selección
  const rows = filtroProducto.value.length > 0
    ? rawRows.value.filter(r => filtroProducto.value.includes(r.codigo))
    : rawRows.value

  // Construir mapa: grupo → producto → días
  const grupoMap = new Map()

  for (const row of rows) {
    const gKey = row.grupo_codigo || '999'
    const gNom = row.grupo_nombre || 'Sin Grupo'
    if (!grupoMap.has(gKey)) grupoMap.set(gKey, { key: gKey, nombre: gNom, productos: new Map() })

    const grupo = grupoMap.get(gKey)
    if (!grupo.productos.has(row.codigo)) {
      grupo.productos.set(row.codigo, {
        codigo: row.codigo,
        nombre: row.nombre,
        und: row.und,
        stockInicial: parseFloat(stockInicialMap.value[row.codigo] ?? 0),
        dias: [],
      })
    }
    grupo.productos.get(row.codigo).dias.push({
      fecha:    row.fecha,
      tipo:     row.tipo || '',
      entradas: parseFloat(row.entradas) || 0,
      salidas:  parseFloat(row.salidas)  || 0,
      ventas:   parseFloat(row.ventas)   || 0,
    })
  }

  // Calcular saldos acumulados día a día y totales por producto
  const result = []
  for (const [, grupo] of grupoMap) {
    const productos = []
    for (const [, prod] of grupo.productos) {
      let saldo = prod.stockInicial
      for (const dia of prod.dias) {
        dia.saldoAnterior = saldo
        saldo = saldo + dia.entradas - dia.salidas - dia.ventas
        dia.saldoFinal = saldo
      }
      prod.stockFinal    = saldo
      prod.totalEntradas = prod.dias.reduce((s, d) => s + d.entradas, 0)
      prod.totalSalidas  = prod.dias.reduce((s, d) => s + d.salidas,  0)
      prod.totalVentas   = prod.dias.reduce((s, d) => s + d.ventas,   0)
      productos.push(prod)
    }
    result.push({ key: grupo.key, nombre: grupo.nombre, productos })
  }
  return result
})

// ── KPIs totales ──────────────────────────────────────────────────
const totalProductos = computed(() =>
  productosAgrupados.value.reduce((s, g) => s + g.productos.length, 0)
)
const totalEntradas = computed(() =>
  productosAgrupados.value.reduce((s, g) => s + g.productos.reduce((ss, p) => ss + p.totalEntradas, 0), 0)
)
const totalSalidas = computed(() =>
  productosAgrupados.value.reduce((s, g) => s + g.productos.reduce((ss, p) => ss + p.totalSalidas, 0), 0)
)
const totalVentas = computed(() =>
  productosAgrupados.value.reduce((s, g) => s + g.productos.reduce((ss, p) => ss + p.totalVentas, 0), 0)
)

// ── Generar ───────────────────────────────────────────────────────
async function generar() {
  errFechaInicio.value = fechaInicio.value ? '' : 'Requerido'
  errFechaFin.value    = fechaFin.value    ? '' : 'Requerido'
  errCcosto.value      = ccosto.value      ? '' : 'Requerido'
  if (errFechaInicio.value || errFechaFin.value || errCcosto.value) return

  loading.value  = true
  errorMsg.value = ''
  rawRows.value  = []
  stockInicialMap.value = {}
  generado.value = false

  try {
    const res = await api.get('/almacen/reporte-movimiento-producto', {
      params: {
        empresa:       empresa.value,
        ccosto:        ccosto.value,
        fecha_inicio:  fechaInicio.value,
        fecha_fin:     fechaFin.value,
      }
    })
    rawRows.value         = res.data?.data || []
    stockInicialMap.value = res.data?.stock_inicial_map || {}
    generado.value = true
  } catch (e) {
    errorMsg.value = e?.response?.data?.error || e.message || 'Error al generar el reporte'
  } finally {
    loading.value = false
  }
}

// ── Badge de tipo ─────────────────────────────────────────────────
function tipoBadgeClass(tipo) {
  const t = (tipo || '').toUpperCase()
  if (t.includes('COMPRA') || t.includes('ENTRADA')) return 'tipo-entrada'
  if (t.includes('VENTA'))   return 'tipo-venta'
  if (t.includes('SALIDA'))  return 'tipo-salida'
  if (t.includes('AJUSTE'))  return 'tipo-ajuste'
  if (t.includes('DEVOL'))   return 'tipo-devol'
  if (t.includes('TRASLADO')) return 'tipo-traslado'
  return 'tipo-otro'
}

// ── Exportar PDF ──────────────────────────────────────────────────
function exportarPDF() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const PW = doc.internal.pageSize.getWidth()   // 216
  const PH = doc.internal.pageSize.getHeight()  // 279
  const ML = 8, MR = 8
  const HEADER_H = 32

  // Fecha de impresión
  const now = new Date()
  const impStr = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`

  // Rango formateado
  const rangoStr = `${fmtFecha(fechaInicio.value)} — ${fmtFecha(fechaFin.value)}`

  // Nombres de productos filtrados (si aplica)
  const prodFiltradoNombre = filtroProducto.value.length > 0
    ? filtroProducto.value.map(c => productosDisponibles.value.find(p => p.codigo === c)?.label || c).join(', ')
    : null

  function drawHeader(pageNum, totalPages) {
    // Panel izquierdo oscuro (55px)
    doc.setFillColor(15, 30, 53)
    doc.rect(0, 0, 55, HEADER_H, 'F')
    // Panel derecho claro
    doc.setFillColor(248, 250, 252)
    doc.rect(55, 0, PW - 55, HEADER_H, 'F')
    // Línea separadora inferior cyan
    doc.setDrawColor(8, 145, 178)
    doc.setLineWidth(0.6)
    doc.line(0, HEADER_H, PW, HEADER_H)

    // Texto izquierdo
    doc.setTextColor(148, 163, 184)
    doc.setFontSize(5.5)
    doc.setFont('helvetica', 'normal')
    doc.text('REPORTE', ML, 9)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.text('MOVIMIENTO', ML, 16)
    doc.text('POR PRODUCTO', ML, 22)
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(56, 189, 248)
    doc.text('DÍA A DÍA', ML, 28)

    // Datos derecha — columna 1 (a partir de x=59)
    const rx = 59
    doc.setTextColor(100, 116, 139)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'bold')
    doc.text('CENTRO DE COSTO:', rx, 9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(15, 30, 53)
    doc.setFontSize(7.5)
    // truncar si es muy largo
    const ccNombre = doc.splitTextToSize(nombreCcosto.value, 75)[0]
    doc.text(ccNombre, rx, 15)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(100, 116, 139)
    doc.text('PERÍODO:', rx, 22)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(15, 30, 53)
    doc.setFontSize(7)
    doc.text(rangoStr, rx, 28)

    // Datos derecha — columna 2 (a partir de x=142)
    const rx2 = 142
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(100, 116, 139)
    doc.text('PRODUCTOS:', rx2, 9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(15, 30, 53)
    doc.setFontSize(7)
    doc.text(String(totalProductos.value), rx2 + doc.getTextWidth('PRODUCTOS:') + 1, 9)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(100, 116, 139)
    doc.text('ENTRADAS:', rx2, 17)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(16, 185, 129)
    doc.setFontSize(7)
    doc.text(fmtNum(totalEntradas.value), rx2 + doc.getTextWidth('ENTRADAS:') + 1, 17)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(100, 116, 139)
    doc.text('SALIDAS:', rx2, 24)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(245, 158, 11)
    doc.setFontSize(7)
    doc.text(fmtNum(totalSalidas.value), rx2 + doc.getTextWidth('SALIDAS:') + 1, 24)

    // Número de página
    doc.setFontSize(6.5)
    doc.setTextColor(148, 163, 184)
    doc.setFont('helvetica', 'normal')
    doc.text(`Pág. ${pageNum}${totalPages ? ' / ' + totalPages : ''}`, PW - MR - 16, 14)

    doc.setTextColor(0, 0, 0)
  }

  function drawFooter() {
    doc.setFontSize(6.5)
    doc.setTextColor(150)
    doc.setFont('helvetica', 'normal')
    doc.text(`Impreso: ${impStr}`, ML, PH - 5)
    if (prodFiltradoNombre) {
      doc.text(`Filtro: ${prodFiltradoNombre}`, ML + 40, PH - 5)
    }
    doc.setTextColor(0, 0, 0)
  }

  // ── Construir body de la tabla ────────────────────────────────
  const body = []

  for (const grupo of productosAgrupados.value) {
    // Fila de grupo
    body.push([{
      content: grupo.nombre.toUpperCase(),
      colSpan: 9,
      styles: {
        fontStyle: 'bold', fontSize: 6.5, textColor: [8, 100, 140],
        fillColor: [240, 249, 255], halign: 'left',
        cellPadding: { top: 1.5, bottom: 1.5, left: 4, right: 4 }
      }
    }])

    for (const prod of grupo.productos) {
      // Cabecera del producto
      body.push([
        { content: prod.codigo, styles: { fontStyle: 'bold', fontSize: 6.5, textColor: [15,30,53], halign: 'center', fillColor: [241,245,249] } },
        { content: '', styles: { fillColor: [241,245,249] } },
        { content: prod.nombre, colSpan: 2, styles: { fontStyle: 'bold', fontSize: 7.5, textColor: [15,30,53], fillColor: [241,245,249] } },
        { content: fmtNum(prod.stockInicial), styles: { fontStyle: 'bold', fontSize: 6.5, halign: 'right', textColor: [71,85,105], fillColor: [241,245,249] } },
        { content: '', colSpan: 4, styles: { fillColor: [241,245,249] } },
      ])

      // Días
      for (const dia of prod.dias) {
        body.push([
          { content: fmtFecha(dia.fecha), styles: { fontSize: 6.5, textColor: [100,116,139], halign: 'center' } },
          { content: dia.tipo || '', styles: { fontSize: 6, textColor: [71,85,105], halign: 'left' } },
          '',
          '',
          { content: fmtNum(dia.saldoAnterior), styles: { fontSize: 6.5, textColor: [148,163,184], halign: 'right' } },
          { content: dia.entradas > 0 ? fmtNum(dia.entradas) : '—', styles: { fontSize: 6.5, halign: 'right',
              textColor: dia.entradas > 0 ? [16,185,129] : [200,200,200] } },
          { content: dia.salidas  > 0 ? fmtNum(dia.salidas)  : '—', styles: { fontSize: 6.5, halign: 'right',
              textColor: dia.salidas  > 0 ? [245,158,11] : [200,200,200] } },
          { content: dia.ventas   > 0 ? fmtNum(dia.ventas)   : '—', styles: { fontSize: 6.5, halign: 'right',
              textColor: dia.ventas   > 0 ? [239,68,68]  : [200,200,200] } },
          { content: fmtNum(dia.saldoFinal), styles: { fontSize: 7, fontStyle: 'bold', halign: 'right',
              textColor: dia.saldoFinal < 0 ? [239,68,68] : [8,145,178] } },
        ])
      }

      // Total del producto
      body.push([
        { content: 'TOTAL', colSpan: 4, styles: { fontStyle: 'bold', fontSize: 6.5, textColor: [71,85,105],
            halign: 'right', fillColor: [241,245,249] } },
        { content: fmtNum(prod.stockInicial), styles: { fontStyle: 'bold', fontSize: 6.5, halign: 'right',
            textColor: [71,85,105], fillColor: [241,245,249] } },
        { content: fmtNum(prod.totalEntradas), styles: { fontStyle: 'bold', fontSize: 7, halign: 'right',
            textColor: [16,185,129], fillColor: [241,245,249] } },
        { content: fmtNum(prod.totalSalidas),  styles: { fontStyle: 'bold', fontSize: 7, halign: 'right',
            textColor: [245,158,11], fillColor: [241,245,249] } },
        { content: fmtNum(prod.totalVentas),   styles: { fontStyle: 'bold', fontSize: 7, halign: 'right',
            textColor: [239,68,68],  fillColor: [241,245,249] } },
        { content: fmtNum(prod.stockFinal), styles: { fontStyle: 'bold', fontSize: 7.5, halign: 'right',
            textColor: prod.stockFinal < 0 ? [239,68,68] : [8,145,178], fillColor: [241,245,249] } },
      ])
    }
  }

  // ── autoTable ─────────────────────────────────────────────────
  drawHeader(1, null)

  autoTable(doc, {
    startY: HEADER_H + 3,
    showHead: 'everyPage',
    head: [[
      { content: 'FECHA',      styles: { halign: 'center' } },
      { content: 'TIPO',       styles: { halign: 'left'   } },
      { content: 'PRODUCTO',   styles: { halign: 'left'   } },
      { content: 'UND',        styles: { halign: 'center' } },
      { content: 'ANT.',       styles: { halign: 'right'  } },
      { content: 'ENTRADAS',   styles: { halign: 'right'  } },
      { content: 'SALIDAS',    styles: { halign: 'right'  } },
      { content: 'VENTAS',     styles: { halign: 'right'  } },
      { content: 'SALDO',      styles: { halign: 'right'  } },
    ]],
    body,
    theme: 'plain',
    headStyles: {
      fillColor: [15, 30, 53],
      textColor: [203, 213, 225],
      fontSize: 6.5, fontStyle: 'bold',
      cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
    },
    bodyStyles: {
      fontSize: 6.5,
      cellPadding: { top: 1, bottom: 1, left: 3, right: 3 },
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center' },
      1: { cellWidth: 30, halign: 'left'   },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 17, halign: 'right'  },
      5: { cellWidth: 17, halign: 'right'  },
      6: { cellWidth: 17, halign: 'right'  },
      7: { cellWidth: 17, halign: 'right'  },
      8: { cellWidth: 20, halign: 'right'  },
    },
    margin: { left: ML, right: MR, bottom: 16, top: HEADER_H + 2 },
    didDrawPage: (data) => { drawHeader(data.pageNumber, null) },
  })

  // Actualizar números de página y footer
  const totalPgs = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPgs; i++) {
    doc.setPage(i)
    drawFooter()
    doc.setFontSize(6.5)
    doc.setTextColor(148, 163, 184)
    doc.setFont('helvetica', 'normal')
    doc.text(`Pág. ${i} / ${totalPgs}`, PW - MR - 16, 14)
    doc.setTextColor(0, 0, 0)
  }

  const blob = doc.output('blob')
  window.open(URL.createObjectURL(blob), '_blank')
}
</script>

<style scoped>
.mp-container { padding: 24px; max-width: 1400px; margin: 0 auto; }

.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root    { font-size: 12px; font-weight: 700; color: #06b6d4; text-transform: uppercase; letter-spacing: .5px; }
.bc-sep     { color: rgba(var(--v-theme-on-surface),.3); }
.bc-cat     { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface),.8); font-weight: 500; }

.mp-header      { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
.mp-header-icon { width: 52px; height: 52px; border-radius: 10px; background: linear-gradient(135deg,#06b6d4,#0891b2); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 4px 14px rgba(6,182,212,.3); }
.mp-title       { font-size: 20px; font-weight: 800; margin: 0; }
.mp-subtitle    { font-size: 13px; color: rgba(var(--v-theme-on-surface),.55); margin: 2px 0 0; }

.mp-form-card  { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 10px; padding: 16px 20px; margin-bottom: 16px; }
.mp-form-row   { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
.mp-field       { min-width: 150px; flex: 1; }
.mp-field--prod { min-width: 220px; flex: 1.5; }
.mp-field--btn  { flex: 0 0 auto; display: flex; align-items: center; padding-top: 2px; }

.mp-reporte-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 10px; overflow: hidden; }

/* KPIs */
.mp-kpis { display: flex; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.07); }
.mp-kpi  { flex: 1; padding: 12px 20px; border-right: 1px solid rgba(var(--v-theme-on-surface),.07); }
.mp-kpi:last-child { border-right: none; }
.mp-kpi-lbl { display: block; font-size: 11px; color: rgba(var(--v-theme-on-surface),.5); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
.mp-kpi-val { display: block; font-size: 22px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); }
.mp-kpi--entrada { color: #10b981; }
.mp-kpi--salida  { color: #f59e0b; }
.mp-kpi--venta   { color: #ef4444; }

/* Tabla */
.mp-table-wrap { overflow-x: auto; }
.mp-table { width: 100%; border-collapse: collapse; font-size: 13px; }

.mp-table thead th {
  position: sticky; top: 0; z-index: 2;
  background: rgb(15,30,53);
  color: rgba(203,213,225,1);
  padding: 9px 10px;
  text-align: left;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .5px;
  white-space: nowrap;
}
.th-fecha { width: 80px; text-align: center !important; }
.th-tipo  { width: 110px; }
.th-prod  { min-width: 140px; }
.th-und   { width: 52px; text-align: center !important; }
.th-num   { text-align: right !important; width: 80px; }
.th-ant   { color: #94a3b8 !important; }
.th-ent   { color: #10b981 !important; }
.th-sal   { color: #f59e0b !important; }
.th-ven   { color: #ef4444 !important; }
.th-saldo { color: #38bdf8 !important; }

/* Filas de grupo */
.mp-grupo-row td {
  padding: 8px 12px 3px;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px;
  color: rgba(8,100,140,1);
  background: rgba(240,249,255,.7);
  text-align: left;
}

/* Cabecera de producto */
.mp-prod-header td {
  padding: 6px 10px;
  background: rgba(var(--v-theme-on-surface),.03);
  border-top: 1px solid rgba(var(--v-theme-on-surface),.08);
  font-size: 12px;
}
.prod-header-nombre { font-size: 13px !important; }

/* Filas de día */
.mp-dia-row td {
  padding: 3px 10px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),.03);
  font-size: 12px;
}
.mp-dia-row:hover { background: rgba(var(--v-theme-on-surface),.02); }
.td-fecha { text-align: center; font-size: 11px; font-family: monospace; color: rgba(var(--v-theme-on-surface),.6); }
.td-tipo  { }

/* Total del producto */
.mp-prod-total td {
  padding: 5px 10px;
  border-top: 1px solid rgba(var(--v-theme-on-surface),.12);
  border-bottom: 2px solid rgba(var(--v-theme-on-surface),.1);
  background: rgba(var(--v-theme-on-surface),.025);
  font-size: 12px;
}
.prod-total-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.4); }

/* Número general */
.td-num { text-align: right !important; white-space: nowrap; }
.ta-c   { text-align: center !important; }
.ta-r   { text-align: right !important; }

/* Colores de números */
.num-ini     { color: rgba(var(--v-theme-on-surface),.45); }
.num-ant     { color: rgba(var(--v-theme-on-surface),.4); font-size: 11px; }
.num-entrada { color: #10b981; }
.num-salida  { color: #f59e0b; }
.num-venta   { color: #ef4444; }
.num-saldo   { color: #0891b2; }
.num-neg     { color: #ef4444; }
.num-cero    { color: rgba(var(--v-theme-on-surface),.2); }
.text-muted  { color: rgba(var(--v-theme-on-surface),.35); font-size: 11px; }
.td-prod-span { font-size: 11px; }

/* Badges */
.badge-cod { display:inline-block; padding:1px 6px; border-radius:4px; font-size:11px; font-weight:700; font-family:monospace; background:rgba(var(--v-theme-on-surface),.07); }
.badge-und { display:inline-block; padding:1px 6px; border-radius:4px; font-size:11px; background:rgba(8,145,178,.1); color:#0891b2; font-weight:600; }
.badge-tipo { display:inline-block; padding:1px 7px; border-radius:4px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.3px; white-space:nowrap; }
.tipo-entrada  { background:rgba(16,185,129,.12);  color:#10b981; }
.tipo-venta    { background:rgba(239,68,68,.12);   color:#ef4444; }
.tipo-salida   { background:rgba(245,158,11,.12);  color:#f59e0b; }
.tipo-ajuste   { background:rgba(59,130,246,.12);  color:#3b82f6; }
.tipo-devol    { background:rgba(168,85,247,.12);  color:#a855f7; }
.tipo-traslado { background:rgba(20,184,166,.12);  color:#14b8a6; }
.tipo-otro     { background:rgba(var(--v-theme-on-surface),.06); color:rgba(var(--v-theme-on-surface),.5); }

/* Empty */
.mp-empty { text-align:center; padding:60px 24px; color:rgba(var(--v-theme-on-surface),.4); display:flex; flex-direction:column; align-items:center; gap:12px; font-size:14px; }
</style>
