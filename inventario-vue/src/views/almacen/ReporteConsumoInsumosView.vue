<template>
  <MainLayout>
    <div class="ci-container">

      <PageHeader
        title="Consumo de Productos"
        description="Traslados desde Bodega Maestra en un período"
        :crumbs="['Almacén', 'Reportes', 'Consumo de Productos']"
      />

      <!-- FILTROS -->
      <div class="ci-form-card">
        <div class="ci-form-row">

          <div class="ci-field">
            <CampoFecha
              v-model="fechaIni"
              label="Fecha Desde *"
              variant="outlined"
              density="compact"
              hide-details="auto"
              :error-messages="errFechaIni"
            />
          </div>

          <div class="ci-field">
            <CampoFecha
              v-model="fechaFin"
              label="Fecha Hasta *"
              variant="outlined"
              density="compact"
              hide-details="auto"
              :error-messages="errFechaFin"
            />
          </div>

          <div class="ci-field ci-field--btn">
            <v-btn
              color="var(--gold)"
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
      <div v-if="filas.length > 0" class="ci-reporte-card">

        <!-- KPIs -->
        <div class="ci-kpis">
          <div class="ci-kpi">
            <v-icon size="18" color="var(--gold)" class="mr-2">mdi-package-variant</v-icon>
            <div>
              <div class="ci-kpi-val">{{ filas.length }}</div>
              <div class="ci-kpi-lbl">Insumos</div>
            </div>
          </div>
          <div class="ci-kpi">
            <v-icon size="18" color="var(--indigo)" class="mr-2">mdi-counter</v-icon>
            <div>
              <div class="ci-kpi-val">{{ totalMovimientos }}</div>
              <div class="ci-kpi-lbl">Movimientos</div>
            </div>
          </div>
          <div class="ci-kpi">
            <v-icon size="18" color="var(--gold)" class="mr-2">mdi-package-down</v-icon>
            <div>
              <div class="ci-kpi-val">{{ formatNum(totalConsumido) }}</div>
              <div class="ci-kpi-lbl">Total Trasladado</div>
            </div>
          </div>
          <div class="ci-kpi ci-kpi--periodo">
            <v-icon size="18" color="var(--ink-400)" class="mr-2">mdi-calendar-range</v-icon>
            <div>
              <div class="ci-kpi-val" style="font-size:13px">{{ fmtFecha(fechaIni) }} → {{ fmtFecha(fechaFin) }}</div>
              <div class="ci-kpi-lbl">Bodega Maestra: {{ bodegaMaestra }}</div>
            </div>
          </div>
        </div>

        <!-- TABLA -->
        <div class="ci-table-wrap">
          <table class="ci-table">
            <thead>
              <tr>
                <th>CÓD</th>
                <th class="th-nom">INSUMO / PRODUCTO</th>
                <th>UND</th>
                <th class="th-num">TRASLADADO</th>
                <th class="th-num">MOVIMIENTOS</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="grupo in productosAgrupados" :key="grupo.key">
                <tr class="ci-grupo-row">
                  <td colspan="5">
                    <v-icon size="13" class="mr-1" style="opacity:.6">mdi-folder-outline</v-icon>
                    {{ grupo.nombre }}
                  </td>
                </tr>
                <tr v-for="p in grupo.items" :key="p.codigo" class="ci-prod-row">
                  <td><span class="badge-cod">{{ p.codigo }}</span></td>
                  <td class="td-nom">{{ p.nombre }}</td>
                  <td><span class="badge-und">{{ p.und }}</span></td>
                  <td class="td-num num-consumido">{{ formatNum(p.total_consumido) }}</td>
                  <td class="td-num">
                    <span class="badge-mov">{{ p.num_movimientos }}</span>
                  </td>
                </tr>
              </template>

              <!-- TOTAL -->
              <tr class="ci-total-row">
                <td colspan="3"><strong>TOTALES</strong></td>
                <td class="td-num num-consumido"><strong>{{ formatNum(totalConsumido) }}</strong></td>
                <td class="td-num"><strong>{{ totalMovimientos }}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      <!-- EMPTY -->
      <div v-else-if="!loading && generado" class="ci-empty">
        <v-icon size="48" color="rgba(var(--v-theme-on-surface),.2)">mdi-package-variant-remove</v-icon>
        <p>No hay traslados desde la Bodega Maestra para este período</p>
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
import { fechaInputLocal } from '../../utils/formatters'

const auth    = useAuthStore()
const empresa = computed(() => auth.empresa)

// ── Filtros ───────────────────────────────────────────────────────
const hoy          = fechaInputLocal()
const primerDiaMes = fechaInputLocal(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

const fechaIni    = ref(primerDiaMes)
const fechaFin    = ref(hoy)
const errFechaIni = ref('')
const errFechaFin = ref('')

// ── Datos ─────────────────────────────────────────────────────────
const filas        = ref([])
const bodegaMaestra = ref('')
const loading      = ref(false)
const generado     = ref(false)
const errorMsg     = ref('')

// ── Helpers ───────────────────────────────────────────────────────
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
const totalConsumido   = computed(() => filas.value.reduce((s, p) => s + parseFloat(p.total_consumido), 0))
const totalMovimientos = computed(() => filas.value.reduce((s, p) => s + parseInt(p.num_movimientos), 0))

// ── Generar ───────────────────────────────────────────────────────
async function generar() {
  errFechaIni.value = fechaIni.value ? '' : 'Requerido'
  errFechaFin.value = fechaFin.value ? '' : 'Requerido'
  if (errFechaIni.value || errFechaFin.value) return

  loading.value  = true
  errorMsg.value = ''
  filas.value    = []
  generado.value = false

  try {
    const res = await api.get('/almacen/reporte-consumo-insumos', {
      params: {
        empresa:   empresa.value,
        fecha_ini: fechaIni.value,
        fecha_fin: fechaFin.value,
      }
    })
    filas.value     = res.data?.data || []
    bodegaMaestra.value = res.data?.bodega_maestra || ''
    generado.value  = true
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
  const mm   = String(hoyDate.getMonth()+1).padStart(2,'0')
  const dd   = String(hoyDate.getDate()).padStart(2,'0')
  const yyyy = hoyDate.getFullYear()
  const hoyStr = `${mm}/${dd}/${yyyy}`

  function drawHeader(pageNum, totalPages) {
    // Banner izquierdo oscuro
    doc.setFillColor(26, 26, 46)
    doc.rect(0, 0, 55, HEADER_H, 'F')
    // Banner derecho claro
    doc.setFillColor(255, 251, 235)
    doc.rect(55, 0, PW - 55, HEADER_H, 'F')
    // Línea separadora dorada
    doc.setDrawColor(202, 138, 4)
    doc.setLineWidth(0.5)
    doc.line(0, HEADER_H, PW, HEADER_H)

    // Texto izquierdo
    doc.setTextColor(148, 163, 184)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.text('REPORTE', ML, 8)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('CONSUMO DE', ML, 14)
    doc.text('INSUMOS', ML, 20)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(253, 224, 71)
    doc.text('BODEGA MAESTRA', ML, 26)

    // Datos derecha
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(120, 90, 0)
    doc.text('BODEGA MAESTRA:', 59, 8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(26, 26, 46)
    doc.setFontSize(8)
    doc.text(bodegaMaestra.value, 59, 14)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(120, 90, 0)
    doc.text('PERÍODO:', 130, 8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(26, 26, 46)
    doc.setFontSize(7.5)
    doc.text(`${fmtFecha(fechaIni.value)}  →  ${fmtFecha(fechaFin.value)}`, 130, 14)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(120, 90, 0)
    doc.text('INSUMOS:', 59, 21)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(26, 26, 46)
    doc.text(String(filas.value.length), 59 + doc.getTextWidth('INSUMOS:') + 2, 21)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(120, 90, 0)
    doc.text('TOTAL TRASLADADO:', 130, 21)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(26, 26, 46)
    doc.text(formatNum(totalConsumido.value), 130 + doc.getTextWidth('TOTAL TRASLADADO:') + 2, 21)

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
  const body = []

  for (const grupo of productosAgrupados.value) {
    body.push([{
      content: grupo.nombre.toUpperCase(),
      colSpan: 5,
      styles: {
        fontStyle: 'bold', fontSize: 7, textColor: [120, 90, 0],
        fillColor: [255, 251, 235], halign: 'left',
        cellPadding: { top: 1.2, bottom: 1.2, left: 4, right: 4 }
      }
    }])
    for (const p of grupo.items) {
      body.push([
        p.codigo,
        p.nombre,
        p.und,
        formatNum(p.total_consumido),
        String(p.num_movimientos),
      ])
    }
  }

  // Fila total
  body.push([
    { content: 'TOTALES', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [26,26,46], textColor: [255,255,255], halign: 'left', cellPadding: CP } },
    { content: formatNum(totalConsumido.value), styles: { fontStyle: 'bold', fillColor: [26,26,46], textColor: [253,224,71], halign: 'right', cellPadding: CP } },
    { content: String(totalMovimientos.value),  styles: { fontStyle: 'bold', fillColor: [26,26,46], textColor: [255,255,255], halign: 'center', cellPadding: CP } },
  ])

  autoTable(doc, {
    startY: HEADER_H + 3,
    showHead: 'everyPage',
    head: [[
      { content: 'CÓD',         styles: { halign: 'center' } },
      { content: 'INSUMO' },
      { content: 'UNIDAD',      styles: { halign: 'center' } },
      { content: 'TRASLADADO',  styles: { halign: 'right' } },
      { content: 'MOVIM.',      styles: { halign: 'center' } },
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
    alternateRowStyles: { fillColor: [255, 253, 245] },
    columnStyles: {
      0: { cellWidth: 14,   halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 18,   halign: 'center' },
      3: { cellWidth: 28,   halign: 'right',  textColor: [120, 90, 0] },
      4: { cellWidth: 20,   halign: 'center' },
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
.ci-container { padding: 24px; max-width: 1400px; margin: 0 auto; }


.ci-form-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 10px; padding: 16px 20px; margin-bottom: 16px; }
.ci-form-row  { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
.ci-field     { min-width: 160px; flex: 1; }
.ci-field--btn { flex: 0 0 auto; display: flex; align-items: center; padding-top: 2px; }

.ci-reporte-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 10px; overflow: hidden; }

/* KPIs */
.ci-kpis         { display: flex; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.07); }
.ci-kpi          { flex: 1; display: flex; align-items: center; padding: 12px 20px; border-right: 1px solid rgba(var(--v-theme-on-surface),.07); }
.ci-kpi:last-child { border-right: none; }
.ci-kpi--periodo { flex: 2; }
.ci-kpi-val      { font-size: 18px; font-weight: 800; line-height: 1.2; }
.ci-kpi-lbl      { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.4); margin-top: 2px; }

/* Tabla */
.ci-table-wrap { overflow-x: auto; }
.ci-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.ci-table thead th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.45); background: rgba(var(--v-theme-on-surface),.03); border-bottom: 2px solid rgba(var(--v-theme-on-surface),.1); white-space: nowrap; }
.th-nom { min-width: 200px; }
.th-num { text-align: right !important; }

.ci-grupo-row td { padding: 8px 12px 3px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--gold-strong); background: rgba(245,158,11,.05); }
.ci-prod-row td  { padding: 5px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.04); }
.ci-prod-row:hover { background: rgba(var(--v-theme-on-surface),.02); }
.ci-total-row td { padding: 8px 12px; border-top: 2px solid rgba(var(--v-theme-on-surface),.1); background: rgba(var(--v-theme-on-surface),.03); font-size: 13px; }

.badge-cod { display:inline-block; padding:1px 6px; border-radius:4px; font-size:11px; font-weight:700; font-family:monospace; background:rgba(var(--v-theme-on-surface),.07); }
.badge-und { display:inline-block; padding:1px 6px; border-radius:4px; font-size:11px; background:rgba(202,138,4,.12); color:var(--gold-strong); font-weight:600; }
.badge-mov { display:inline-block; padding:1px 8px; border-radius:10px; font-size:11px; background:rgba(var(--v-theme-on-surface),.07); font-weight:600; }

.td-nom       { font-weight: 500; }
.td-num       { text-align: right !important; white-space: nowrap; }
.num-consumido { color: var(--gold-strong); font-weight: 700; }

.ci-empty { text-align:center; padding:60px 24px; color:rgba(var(--v-theme-on-surface),.4); display:flex; flex-direction:column; align-items:center; gap:12px; font-size:14px; }
</style>
