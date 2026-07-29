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

        <!-- KPIs -->
        <div class="rc-kpis">
          <div class="rc-kpi">
            <v-icon size="18" color="primary" class="mr-2">mdi-package-variant</v-icon>
            <div>
              <div class="rc-kpi-val">{{ filas.length }}</div>
              <div class="rc-kpi-lbl">Productos</div>
            </div>
          </div>
          <div class="rc-kpi">
            <v-icon size="18" :color="totalVariacion < 0 ? '#f59e0b' : '#10b981'" class="mr-2">{{ totalVariacion < 0 ? 'mdi-arrow-down-bold' : 'mdi-arrow-up-bold' }}</v-icon>
            <div>
              <div class="rc-kpi-val" :class="totalVariacion < 0 ? 'num-faltante' : (totalVariacion > 0 ? 'num-sobrante' : '')">{{ formatNum(totalVariacion) }}</div>
              <div class="rc-kpi-lbl">Variación Total</div>
            </div>
          </div>
          <div v-if="incluirCostos" class="rc-kpi">
            <v-icon size="18" :color="totalValorizado < 0 ? '#f59e0b' : '#10b981'" class="mr-2">mdi-cash-multiple</v-icon>
            <div>
              <div class="rc-kpi-val" :class="totalValorizado < 0 ? 'num-faltante' : (totalValorizado > 0 ? 'num-sobrante' : '')">{{ formatMoney(totalValorizado) }}</div>
              <div class="rc-kpi-lbl">Valor Variación</div>
            </div>
          </div>
          <div class="rc-kpi rc-kpi--periodo">
            <v-icon size="18" color="#64748b" class="mr-2">mdi-calendar-range</v-icon>
            <div>
              <div class="rc-kpi-val" style="font-size:13px">{{ fmtFecha(fechaIni) }} → {{ fmtFecha(fechaFin) }}</div>
              <div class="rc-kpi-lbl">{{ nombresCcostos }}</div>
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
const filas    = ref([])
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

// ── Totales ───────────────────────────────────────────────────────
const totalVariacion  = computed(() => filas.value.reduce((s, p) => s + (parseFloat(p.total_sobrante) - parseFloat(p.total_faltante)), 0))
const totalValorizado = computed(() => filas.value.reduce((s, p) => s + valorNeto(p), 0))

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
    filas.value    = res.data?.data || []
    generado.value = true
  } catch (e) {
    errorMsg.value = e?.response?.data?.error || e.message || 'Error al generar el reporte'
  } finally {
    loading.value = false
  }
}

// ── Exportar PDF ──────────────────────────────────────────────────
function exportarPDF() {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const PW   = doc.internal.pageSize.getWidth()
  const PH   = doc.internal.pageSize.getHeight()
  const ML   = 8, MR = 8
  const HEADER_H = 30

  const hoyDate = new Date()
  const mm  = String(hoyDate.getMonth()+1).padStart(2,'0')
  const dd  = String(hoyDate.getDate()).padStart(2,'0')
  const yyyy = hoyDate.getFullYear()
  const hoyStr = `${mm}/${dd}/${yyyy}`

  function drawHeader(pageNum, totalPages) {
    doc.setFillColor(26, 26, 46)
    doc.rect(0, 0, 55, HEADER_H, 'F')
    doc.setFillColor(248, 250, 252)
    doc.rect(55, 0, PW - 55, HEADER_H, 'F')
    doc.setDrawColor(8, 145, 178)
    doc.setLineWidth(0.5)
    doc.line(0, HEADER_H, PW, HEADER_H)

    // Texto izquierdo
    doc.setTextColor(148, 163, 184)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.text('REPORTE', ML, 8)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('FALTANTES Y SOBRANTES', ML, 15)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(103, 232, 249)
    doc.text('TOMA FÍSICA', ML, 21)

    // Datos derecha
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(100, 116, 139)
    doc.text('CENTRO DE COSTO:', 59, 8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(26, 26, 46)
    doc.setFontSize(7.5)
    doc.text(nombresCcostos.value, 59, 14)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(100, 116, 139)
    doc.text('PERÍODO:', 130, 8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(26, 26, 46)
    doc.setFontSize(7.5)
    doc.text(`${fmtFecha(fechaIni.value)}  →  ${fmtFecha(fechaFin.value)}`, 130, 14)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(100, 116, 139)
    doc.text('VARIACIÓN:', 59, 21)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(26, 26, 46)
    doc.text(formatNum(totalVariacion.value), 59 + doc.getTextWidth('VARIACIÓN:') + 2, 21)

    if (incluirCostos.value) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(100, 116, 139)
      doc.text('VALOR:', 130, 21)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(26, 26, 46)
      doc.setFontSize(7.5)
      doc.text(formatMoney(totalValorizado.value), 130 + doc.getTextWidth('VALOR:') + 3, 21)
    }

    if (totalPages) {
      doc.setFontSize(7)
      doc.setTextColor(148, 163, 184)
      doc.text(`Pág. ${pageNum} / ${totalPages}`, PW - MR - 18, 14)
    }
    doc.setTextColor(0, 0, 0)
  }

  function drawFooter() {
    doc.setFontSize(6.5)
    doc.setTextColor(150)
    doc.text(`Impreso: ${hoyStr}`, ML, PH - 4)
    doc.setTextColor(0, 0, 0)
  }

  drawHeader(1, null)

  const CP = { top: 1.2, bottom: 1.2, left: 3, right: 3 }
  const conCosto = incluirCostos.value
  const numCols  = conCosto ? 7 : 5
  const body = []

  for (const grupo of productosAgrupados.value) {
    body.push([{
      content: grupo.nombre.toUpperCase(),
      colSpan: numCols,
      styles: {
        fontStyle: 'bold', fontSize: 7, textColor: [8, 100, 140],
        fillColor: [240, 249, 255], halign: 'left',
        cellPadding: { top: 1.2, bottom: 1.2, left: 4, right: 4 }
      }
    }])
    for (const p of grupo.items) {
      const variacion = parseFloat(p.total_sobrante) - parseFloat(p.total_faltante)
      const color = variacion < 0 ? [245,158,11] : (variacion > 0 ? [16,185,129] : [0,0,0])
      const fila = [
        p.codigo,
        p.nombre,
        p.descripcion || '',
        p.und,
        { content: formatNum(variacion), styles: { textColor: color } },
      ]
      if (conCosto) {
        fila.push({ content: formatMoney(p.precio_costo), styles: { textColor: [100,116,139] } })
        fila.push({ content: formatMoney(valorNeto(p)),   styles: { textColor: color } })
      }
      body.push(fila)
    }
  }

  // Fila total
  const totalRow = [
    { content: 'TOTALES', colSpan: 4, styles: { fontStyle: 'bold', fillColor: [26,26,46], textColor: [255,255,255], halign: 'left', cellPadding: CP } },
    { content: formatNum(totalVariacion.value), styles: { fontStyle: 'bold', fillColor: [26,26,46], textColor: [255,255,255], halign: 'right', cellPadding: CP } },
  ]
  if (conCosto) {
    totalRow.push({ content: '', styles: { fillColor: [26,26,46], cellPadding: CP } })
    totalRow.push({ content: formatMoney(totalValorizado.value), styles: { fontStyle: 'bold', fillColor: [26,26,46], textColor: [255,255,255], halign: 'right', cellPadding: CP } })
  }
  body.push(totalRow)

  autoTable(doc, {
    startY: HEADER_H + 3,
    showHead: 'everyPage',
    head: [conCosto ? [
      { content: 'CÓD',          styles: { halign: 'center' } },
      { content: 'PRODUCTO' },
      { content: 'DESCRIPCIÓN' },
      { content: 'UNIDAD',       styles: { halign: 'center' } },
      { content: 'VARIACIÓN',    styles: { halign: 'right' } },
      { content: 'COSTO UNIT.',  styles: { halign: 'right' } },
      { content: 'VALOR',        styles: { halign: 'right' } },
    ] : [
      { content: 'CÓD',          styles: { halign: 'center' } },
      { content: 'PRODUCTO' },
      { content: 'DESCRIPCIÓN' },
      { content: 'UNIDAD',       styles: { halign: 'center' } },
      { content: 'VARIACIÓN',    styles: { halign: 'right' } },
    ]],
    body,
    theme: 'plain',
    headStyles: {
      fillColor: [26, 26, 46],
      textColor: [203, 213, 225],
      fontSize: 7, fontStyle: 'bold',
      cellPadding: { top: 1.5, bottom: 1.5, left: 3, right: 3 },
    },
    bodyStyles: { fontSize: 7, cellPadding: CP },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: conCosto ? {
      0: { cellWidth: 14,   halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 'auto', textColor: [80, 80, 80] },
      3: { cellWidth: 14,   halign: 'center' },
      4: { cellWidth: 20,   halign: 'right' },
      5: { cellWidth: 22,   halign: 'right' },
      6: { cellWidth: 24,   halign: 'right' },
    } : {
      0: { cellWidth: 14,   halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 'auto', textColor: [80, 80, 80] },
      3: { cellWidth: 16,   halign: 'center' },
      4: { cellWidth: 24,   halign: 'right' },
    },
    margin: { left: ML, right: MR, bottom: 16, top: HEADER_H + 2 },
    didDrawPage: (data) => { drawHeader(data.pageNumber, null) },
  })

  const totalPgs = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPgs; i++) {
    doc.setPage(i)
    drawFooter()
    doc.setFontSize(7)
    doc.setTextColor(148, 163, 184)
    doc.text(`Pág. ${i} / ${totalPgs}`, PW - MR - 18, 14)
    doc.setTextColor(0, 0, 0)
  }

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
