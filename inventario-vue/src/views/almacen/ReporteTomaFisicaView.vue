<template>
  <MainLayout>
    <div class="rc-container">

      <PageHeader
        title="Faltantes y Sobrantes (Toma Física)"
        description="Sumatoria por producto de las diferencias registradas en tomas físicas dentro del período"
        :crumbs="['Almacén', 'Reportes', 'Faltantes y Sobrantes']"
      />

      <!-- FILTROS -->
      <div class="rc-form-card">
        <div class="rc-form-row">

          <div class="rc-field">
            <v-text-field
              v-model="fechaIni"
              label="Fecha Desde *"
              type="date"
              variant="outlined"
              density="compact"
              hide-details="auto"
              :error-messages="errFechaIni"
            />
          </div>

          <div class="rc-field">
            <v-text-field
              v-model="fechaFin"
              label="Fecha Hasta *"
              type="date"
              variant="outlined"
              density="compact"
              hide-details="auto"
              :error-messages="errFechaFin"
            />
          </div>

          <div class="rc-field" style="min-width:260px">
            <v-select
              v-model="ccostosSeleccionados"
              :items="ccostos"
              item-title="nombre"
              item-value="codigo"
              label="Centro de Costo *"
              variant="outlined"
              density="compact"
              hide-details="auto"
              :error-messages="errCcosto"
              multiple
              chips
              closable-chips
              :menu-props="{ maxHeight: 320 }"
            >
              <template #prepend-item>
                <v-list-item title="Seleccionar todos" @click="toggleTodosCcostos">
                  <template #prepend>
                    <v-checkbox-btn
                      :model-value="todosSeleccionados"
                      :indeterminate="algunoSeleccionado && !todosSeleccionados"
                      color="primary"
                    />
                  </template>
                </v-list-item>
                <v-divider class="mb-1" />
              </template>
              <template #item="{ item, props }">
                <v-list-item v-bind="props" :title="item.title">
                  <template #prepend>
                    <v-checkbox-btn
                      :model-value="ccostosSeleccionados.includes(item.value)"
                      color="primary"
                    />
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </div>

          <div class="rc-field rc-field--check">
            <v-checkbox
              v-model="incluirCostos"
              label="Incluir costos"
              color="primary"
              density="compact"
              hide-details
            />
          </div>

          <div class="rc-field rc-field--btn">
            <v-btn
              color="primary"
              variant="elevated"
              prepend-icon="mdi-magnify"
              :loading="loading"
              @click="generar"
            >
              Generar
            </v-btn>
            <v-btn
              v-if="filas.length > 0"
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
      <div v-if="filas.length > 0" class="rc-reporte-card">

        <!-- KPIs (5 Nuevos) -->
        <div class="rc-kpis-new">
          <!-- KPI 1: Ventas del mes -->
          <div class="rc-kpi-new">
            <div class="kpi-icon">
              <v-icon size="16" color="white">mdi-trending-up</v-icon>
            </div>
            <div>
              <div class="kpi-lbl">Ventas del Período</div>
              <div class="kpi-val">{{ formatMoney(kpiVentasTotal) }}</div>
            </div>
          </div>

          <!-- KPI 2: Pérdida Esperada -->
          <div class="rc-kpi-new">
            <div class="kpi-icon">
              <v-icon size="16" color="white">mdi-percent</v-icon>
            </div>
            <div>
              <div class="kpi-lbl">Pérdida Esperada</div>
              <div class="kpi-val">{{ toleranciaPct.toFixed(2) }}%</div>
              <div class="kpi-sub">{{ formatMoney(kpiPerdidaEsperadaDinero) }}</div>
            </div>
          </div>

          <!-- KPI 3: Sobrante / Faltante -->
          <div class="rc-kpi-new">
            <div class="kpi-icon" :style="{ backgroundColor: totalValorizado >= 0 ? '#10b981' : '#ef4444' }">
              <v-icon size="16" color="white">{{ totalValorizado >= 0 ? 'mdi-plus-circle' : 'mdi-minus-circle' }}</v-icon>
            </div>
            <div>
              <div class="kpi-lbl">{{ totalValorizado >= 0 ? 'Sobrante' : 'Faltante' }}</div>
              <div class="kpi-val" :style="{ color: totalValorizado >= 0 ? '#10b981' : '#ef4444' }">{{ formatMoney(totalValorizado) }}</div>
            </div>
          </div>

          <!-- KPI 4: % sobre Ventas -->
          <div class="rc-kpi-new">
            <div class="kpi-icon">
              <v-icon size="16" color="white">mdi-chart-pie</v-icon>
            </div>
            <div>
              <div class="kpi-lbl">% de Ventas</div>
              <div class="kpi-val">{{ formatNum(kpiPorcentajeVentas) }}%</div>
            </div>
          </div>

          <!-- KPI 5: Nivel de Pérdida -->
          <div class="rc-kpi-new">
            <div class="kpi-icon" :style="{ backgroundColor: colorNivelPerdida }">
              <v-icon size="16" color="white">{{ kpiNivelPerdida === 'EXCELENTE' ? 'mdi-check-circle' : (kpiNivelPerdida === 'BUENO' ? 'mdi-alert-circle' : 'mdi-close-circle') }}</v-icon>
            </div>
            <div>
              <div class="kpi-lbl">Nivel de Pérdida</div>
              <div class="kpi-val" :style="{ color: colorNivelPerdida }">{{ kpiNivelPerdida }}</div>
            </div>
          </div>
        </div>

        <!-- TABLA -->
        <div class="rc-table-wrap">
          <table class="rc-table">
            <thead>
              <tr>
                <th>CÓD</th>
                <th class="th-nom">PRODUCTO</th>
                <th class="th-desc">DESCRIPCIÓN</th>
                <th>UND</th>
                <th class="th-num">VARIACIÓN</th>
                <th v-if="incluirCostos" class="th-num">COSTO UNIT.</th>
                <th v-if="incluirCostos" class="th-num">VALOR</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="grupo in productosAgrupados" :key="grupo.key">
                <tr class="rc-grupo-row">
                  <td :colspan="incluirCostos ? 7 : 5">
                    <v-icon size="13" class="mr-1" style="opacity:.6">mdi-folder-outline</v-icon>
                    {{ grupo.nombre }}
                  </td>
                </tr>
                <tr v-for="p in grupo.items" :key="p.codigo" class="rc-prod-row">
                  <td><span class="badge-cod">{{ p.codigo }}</span></td>
                  <td class="td-nom">{{ p.nombre }}</td>
                  <td class="td-desc">{{ p.descripcion }}</td>
                  <td><span class="badge-und">{{ p.und }}</span></td>
                  <td class="td-num">
                    <strong :class="netoClass(p)">{{ formatNum(p.total_sobrante - p.total_faltante) }}</strong>
                  </td>
                  <td v-if="incluirCostos" class="td-num td-costo">{{ formatMoney(p.precio_costo) }}</td>
                  <td v-if="incluirCostos" class="td-num">
                    <strong :class="netoClass(p)">{{ formatMoney(valorNeto(p)) }}</strong>
                  </td>
                </tr>
              </template>

              <!-- TOTAL -->
              <tr class="rc-total-row">
                <td colspan="4"><strong>TOTALES</strong></td>
                <td class="td-num"><strong :class="totalVariacion < 0 ? 'num-faltante' : (totalVariacion > 0 ? 'num-sobrante' : '')">{{ formatNum(totalVariacion) }}</strong></td>
                <td v-if="incluirCostos"></td>
                <td v-if="incluirCostos" class="td-num"><strong :class="totalValorizado < 0 ? 'num-faltante' : (totalValorizado > 0 ? 'num-sobrante' : '')">{{ formatMoney(totalValorizado) }}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      <!-- EMPTY -->
      <div v-else-if="!loading && generado" class="rc-empty">
        <v-icon size="48" color="rgba(var(--v-theme-on-surface),.2)">mdi-clipboard-check-outline</v-icon>
        <p>No hay tomas físicas con diferencias para este período y Centro de Costo</p>
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

// ── Filtros ───────────────────────────────────────────────────────
const hoy = fechaInputLocal()
const primerDiaMes = fechaInputLocal(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

const fechaIni              = ref(primerDiaMes)
const fechaFin              = ref(hoy)
const ccostosSeleccionados  = ref([])
const incluirCostos         = ref(false)
const errFechaIni = ref('')
const errFechaFin = ref('')
const errCcosto   = ref('')

// ── Datos ─────────────────────────────────────────────────────────
const ccostos  = ref([])
const filas           = ref([])
const ventasTotal     = ref(0)
const toleranciaPct   = ref(2.00)
const loading  = ref(false)
const generado = ref(false)
const errorMsg = ref('')

// ── Cargar CC ─────────────────────────────────────────────────────
async function cargarCcostos() {
  try {
    const res = await api.get('/ccostos', { params: { empresa: empresa.value } })
    ccostos.value = res.data?.data || res.data?.ccostos || []
  } catch (e) { console.error('Error cargando ccostos:', e) }
}
cargarCcostos()

// ── Helpers selección múltiple ────────────────────────────────────
const todosSeleccionados = computed(() => ccostosSeleccionados.value.length === ccostos.value.length)
const algunoSeleccionado = computed(() => ccostosSeleccionados.value.length > 0)

function toggleTodosCcostos() {
  if (todosSeleccionados.value) {
    ccostosSeleccionados.value = []
  } else {
    ccostosSeleccionados.value = ccostos.value.map(c => c.codigo)
  }
}

const nombresCcostos = computed(() => {
  if (!ccostosSeleccionados.value.length) return ''
  if (ccostosSeleccionados.value.length === ccostos.value.length) return 'Todos los centros'
  return ccostosSeleccionados.value
    .map(cod => ccostos.value.find(c => c.codigo === cod)?.nombre || cod)
    .join(', ')
})

function fmtFecha(str) {
  if (!str) return ''
  const [y, m, d] = str.split('-')
  return `${m}/${d}/${y}`
}

function formatNum(n) {
  const num = parseFloat(n)
  if (isNaN(num)) return '0.00'
  return num.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatMoney(n) {
  const num = parseFloat(n)
  if (isNaN(num)) return '$0.00'
  const signo = num < 0 ? '-' : ''
  return signo + '$' + Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function valorNeto(p) {
  return (parseFloat(p.total_sobrante) - parseFloat(p.total_faltante)) * (parseFloat(p.precio_costo) || 0)
}

function netoClass(p) {
  const neto = parseFloat(p.total_sobrante) - parseFloat(p.total_faltante)
  if (neto > 0) return 'num-sobrante'
  if (neto < 0) return 'num-faltante'
  return ''
}

// ── Agrupación ────────────────────────────────────────────────────
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

// ── Totales (antiguos) ────────────────────────────────────────────
const totalVariacion  = computed(() => filas.value.reduce((s, p) => s + (parseFloat(p.total_sobrante) - parseFloat(p.total_faltante)), 0))
const totalValorizado = computed(() => filas.value.reduce((s, p) => s + valorNeto(p), 0))

// ── 5 KPIs nuevos ─────────────────────────────────────────────────
const kpiVentasTotal = computed(() => ventasTotal.value)

const kpiPerdidaEsperadaDinero = computed(() =>
  ventasTotal.value * (toleranciaPct.value / 100)
)

const kpiFaltanteTotal = computed(() => {
  // Suma del valor de faltantes y sobrantes (el totalValorizado es el neto)
  return Math.abs(totalValorizado.value)
})

const kpiPorcentajeVentas = computed(() => {
  if (ventasTotal.value <= 0) return 0
  return (kpiFaltanteTotal.value / ventasTotal.value * 100)
})

const kpiNivelPerdida = computed(() => {
  const pct = kpiPorcentajeVentas.value
  const tolerance = toleranciaPct.value
  const mitad = tolerance / 2

  if (pct < mitad) return 'EXCELENTE'
  if (pct <= tolerance) return 'BUENO'
  return 'MALO'
})

const colorNivelPerdida = computed(() => {
  switch (kpiNivelPerdida.value) {
    case 'EXCELENTE': return '#10b981'
    case 'BUENO': return '#f59e0b'
    case 'MALO': return '#ef4444'
    default: return '#64748b'
  }
})

// ── Generar ───────────────────────────────────────────────────────
async function generar() {
  errFechaIni.value = fechaIni.value                    ? '' : 'Requerido'
  errFechaFin.value = fechaFin.value                    ? '' : 'Requerido'
  errCcosto.value   = ccostosSeleccionados.value.length ? '' : 'Seleccione al menos uno'
  if (errFechaIni.value || errFechaFin.value || errCcosto.value) return

  loading.value  = true
  errorMsg.value = ''
  filas.value    = []
  generado.value = false

  try {
    const res = await api.get('/almacen/reporte-toma-fisica', {
      params: {
        empresa:   empresa.value,
        ccostos:   ccostosSeleccionados.value.join(','),
        fecha_ini: fechaIni.value,
        fecha_fin: fechaFin.value,
      }
    })
    filas.value      = res.data?.data || []
    ventasTotal.value = parseFloat(res.data?.ventas_ccosto || 0)
    toleranciaPct.value = parseFloat(res.data?.tolerancia_perdida || 2.00)
    generado.value   = true
  } catch (e) {
    errorMsg.value = e?.response?.data?.error || e.message || 'Error al generar el reporte'
  } finally {
    loading.value = false
  }
}

// ── Exportar PDF ──────────────────────────────────────────────────
function exportarPDF() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const ML = 10
  const conCosto = incluirCostos.value
  const numCols = conCosto ? 7 : 5
  const startY = drawReportHeader(doc, {
    title: 'FALTANTES Y SOBRANTES',
    subtitle: `Centro de Costo: ${nombresCcostos.value || '-'} | Periodo: ${fmtFecha(fechaIni.value)} - ${fmtFecha(fechaFin.value)}`,
    empresa: auth.empresaNombre || empresa.value || 'EMPRESA',
    usuario: auth.userName || auth.userNombre,
    moduleName: 'Modulo de almacen | Reportes',
    margin: ML,
  })

  // ── Bloque de KPIs ───────────────────────────────────────────────
  const pageW = doc.internal.pageSize.getWidth()
  const kpis = [
    {
      label: 'Ventas del Período',
      value: formatMoney(kpiVentasTotal.value),
      sub: null,
    },
    {
      label: 'Pérdida Esperada',
      value: `${toleranciaPct.value.toFixed(2)}%`,
      sub: formatMoney(kpiPerdidaEsperadaDinero.value),
    },
    {
      label: totalValorizado.value >= 0 ? 'Sobrante' : 'Faltante',
      value: formatMoney(totalValorizado.value),
      sub: null,
      color: totalValorizado.value >= 0 ? [16, 185, 129] : [239, 68, 68],
    },
    {
      label: '% sobre Ventas',
      value: `${kpiPorcentajeVentas.value.toFixed(2)}%`,
      sub: null,
    },
    {
      label: 'Nivel de Pérdida',
      value: kpiNivelPerdida.value,
      sub: null,
      color: kpiNivelPerdida.value === 'EXCELENTE' ? [16, 185, 129]
           : kpiNivelPerdida.value === 'BUENO'     ? [245, 158, 11]
           : [239, 68, 68],
    },
  ]

  const kpiBoxW = (pageW - ML * 2 - 4 * 3) / 5
  let kx = ML
  const ky = startY + 2
  const kpiH = 16

  kpis.forEach(kpi => {
    // fondo
    doc.setFillColor(247, 248, 250)
    doc.roundedRect(kx, ky, kpiBoxW, kpiH, 1.5, 1.5, 'F')
    // label
    doc.setFontSize(6)
    doc.setTextColor(120, 120, 130)
    doc.setFont('helvetica', 'normal')
    doc.text(kpi.label.toUpperCase(), kx + kpiBoxW / 2, ky + 4.5, { align: 'center' })
    // valor principal
    const col = kpi.color || [30, 30, 40]
    doc.setTextColor(...col)
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.text(kpi.value, kx + kpiBoxW / 2, ky + 10, { align: 'center' })
    // sub
    if (kpi.sub) {
      doc.setFontSize(6)
      doc.setTextColor(100, 116, 139)
      doc.setFont('helvetica', 'normal')
      doc.text(kpi.sub, kx + kpiBoxW / 2, ky + 14, { align: 'center' })
    }
    kx += kpiBoxW + 3
  })

  const kpiBlockEnd = ky + kpiH + 4

  const body = []
  for (const grupo of productosAgrupados.value) {
    body.push([{
      content: String(grupo.nombre || 'Sin Grupo').toUpperCase(),
      colSpan: numCols,
      styles: {
        fontStyle: 'bold', fontSize: 6.5, textColor: [0, 0, 0], fillColor: false,
        halign: 'left', lineWidth: { top: 0.25, bottom: 0.18 }, lineColor: [115, 115, 115],
        cellPadding: { top: 1.5, right: 1.8, bottom: 1.2, left: 1.8 },
      },
    }])
    for (const p of grupo.items) {
      const variacion = parseFloat(p.total_sobrante) - parseFloat(p.total_faltante)
      const fila = [p.codigo, p.nombre, p.descripcion || '-', p.und, formatNum(variacion)]
      if (conCosto) {
        fila.push(formatMoney(p.precio_costo))
        fila.push(formatMoney(valorNeto(p)))
      }
      body.push(fila)
    }
  }

  const totalRow = [
    { content: 'TOTALES', colSpan: 4, styles: { fontStyle: 'bold', halign: 'left' } },
    { content: formatNum(totalVariacion.value), styles: { fontStyle: 'bold', halign: 'right' } },
  ]
  if (conCosto) {
    totalRow.push('')
    totalRow.push({ content: formatMoney(totalValorizado.value), styles: { fontStyle: 'bold', halign: 'right' } })
  }

  autoTable(doc, {
    startY: kpiBlockEnd,
    head: [conCosto
      ? ['Cod', 'Producto', 'Descripcion', 'Und', 'Variacion', 'Costo Unit.', 'Valor']
      : ['Cod', 'Producto', 'Descripcion', 'Und', 'Variacion']
    ],
    body,
    foot: [totalRow],
    ...detailTableOptions(ML),
    columnStyles: conCosto ? {
      0: { cellWidth: 14, halign: 'center' },
      1: { cellWidth: 48 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 13, halign: 'center' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 24, halign: 'right' },
      6: { cellWidth: 26, halign: 'right' },
    } : {
      0: { cellWidth: 14, halign: 'center' },
      1: { cellWidth: 58 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 24, halign: 'right' },
    },
    didParseCell: (data) => {
      const alignments = conCosto
        ? { 0: 'center', 1: 'left', 2: 'left', 3: 'center', 4: 'right', 5: 'right', 6: 'right' }
        : { 0: 'center', 1: 'left', 2: 'left', 3: 'center', 4: 'right' }
      alignReportCell(data, alignments)
      if (data.section === 'body' && data.row.raw?.[0]?.colSpan === numCols) {
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
.rc-container { padding: 24px; max-width: 1400px; margin: 0 auto; }

.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root    { font-size: 12px; font-weight: 700; color: var(--indigo); text-transform: uppercase; letter-spacing: .5px; }
.bc-sep     { color: rgba(var(--v-theme-on-surface),.3); }
.bc-cat     { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface),.8); font-weight: 500; }

.rc-header      { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
.rc-header-icon { width: 52px; height: 52px; border-radius: 10px; background: linear-gradient(135deg,var(--indigo),var(--indigo)); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 4px 14px rgba(6,182,212,.3); }
.rc-title       { font-size: 20px; font-weight: 800; margin: 0; }
.rc-subtitle    { font-size: 13px; color: rgba(var(--v-theme-on-surface),.55); margin: 2px 0 0; }

.rc-form-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 10px; padding: 16px 20px; margin-bottom: 16px; }
.rc-form-row  { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
.rc-field     { min-width: 160px; flex: 1; }
.rc-field--btn { flex: 0 0 auto; display: flex; align-items: center; padding-top: 2px; }
.rc-field--check { flex: 0 0 auto; min-width: 0; display: flex; align-items: center; }

.rc-reporte-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 10px; overflow: hidden; }

/* KPIs */
.rc-kpis         { display: flex; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.07); }
.rc-kpi          { flex: 1; display: flex; align-items: center; padding: 12px 20px; border-right: 1px solid rgba(var(--v-theme-on-surface),.07); }
.rc-kpi:last-child { border-right: none; }
.rc-kpi--periodo { flex: 2; }
.rc-kpi-val      { font-size: 18px; font-weight: 800; line-height: 1.2; }
.rc-kpi-lbl      { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.4); margin-top: 2px; }

/* KPIs Nuevos (5 Métricas) */
.rc-kpis-new { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; padding-bottom: 16px; }
.rc-kpi-new { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: 10px; background: rgba(var(--v-theme-on-surface),.03); border: 1px solid rgba(var(--v-theme-on-surface),.08); }
.kpi-icon { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #06b6d4, #0891b2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.kpi-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: rgba(var(--v-theme-on-surface),.45); }
.kpi-val { font-size: 18px; font-weight: 800; margin-top: 2px; }
.kpi-sub { font-size: 11px; color: rgba(var(--v-theme-on-surface),.5); margin-top: 2px; }

@media (max-width: 1400px) {
  .rc-kpis-new { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .rc-kpis-new { grid-template-columns: repeat(2, 1fr); }
}

/* Tabla */
.rc-table-wrap { overflow-x: auto; }
.rc-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.rc-table thead th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.45); background: rgba(var(--v-theme-on-surface),.03); border-bottom: 2px solid rgba(var(--v-theme-on-surface),.1); white-space: nowrap; }
.th-nom { min-width: 200px; }
.th-desc { min-width: 160px; }
.td-desc { color: rgba(var(--v-theme-on-surface),.55); font-size: 12px; }
.th-num { text-align: right !important; }

.rc-grupo-row td { padding: 8px 12px 3px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(8,100,140,1); background: rgba(240,249,255,.7); }
.rc-prod-row td  { padding: 5px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.04); }
.rc-prod-row:hover { background: rgba(var(--v-theme-on-surface),.02); }
.rc-total-row td { padding: 8px 12px; border-top: 2px solid rgba(var(--v-theme-on-surface),.1); background: rgba(var(--v-theme-on-surface),.03); font-size: 13px; }

.badge-cod { display:inline-block; padding:1px 6px; border-radius:4px; font-size:11px; font-weight:700; font-family:monospace; background:rgba(var(--v-theme-on-surface),.07); }
.badge-und { display:inline-block; padding:1px 6px; border-radius:4px; font-size:11px; background:rgba(8,145,178,.1); color:var(--indigo); font-weight:600; }
.badge-mov { display:inline-block; padding:1px 8px; border-radius:10px; font-size:11px; background:rgba(var(--v-theme-on-surface),.07); font-weight:600; }

.td-nom       { font-weight: 500; }
.td-num       { text-align: right !important; white-space: nowrap; }
.td-costo     { color: rgba(var(--v-theme-on-surface),.55); font-size: 12px; }
.num-faltante { color: var(--gold); font-weight: 700; }
.num-sobrante { color: var(--success); font-weight: 700; }

.rc-empty { text-align:center; padding:60px 24px; color:rgba(var(--v-theme-on-surface),.4); display:flex; flex-direction:column; align-items:center; gap:12px; font-size:14px; }
</style>
