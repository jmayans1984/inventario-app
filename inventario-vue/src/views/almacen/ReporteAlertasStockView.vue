<template>
  <MainLayout>
    <div class="as-container">

      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">ALMACÉN</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Alertas de Stock</span>
      </div>

      <!-- HEADER -->
      <div class="as-header">
        <div class="as-header-icon">
          <v-icon size="28" color="white">mdi-alert-circle-outline</v-icon>
        </div>
        <div>
          <h2 class="as-title">Alertas de Stock</h2>
          <p class="as-subtitle">Productos bajo stock mínimo en la Bodega Maestra</p>
        </div>
        <div style="flex:1"></div>
        <div class="as-header-actions">
          <v-btn
            color="#dc2626"
            variant="elevated"
            prepend-icon="mdi-magnify"
            :loading="loading"
            @click="generar"
          >Generar</v-btn>
          <v-btn
            v-if="grupos.length"
            color="error"
            variant="outlined"
            prepend-icon="mdi-file-pdf-box"
            class="ml-2"
            @click="exportarPDF"
          >PDF</v-btn>
        </div>
      </div>

      <!-- MENSAJES -->
      <v-alert v-if="advertencia" type="warning" variant="tonal" class="mb-4" closable @click:close="advertencia=''">
        {{ advertencia }}
      </v-alert>
      <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-4" closable @click:close="errorMsg=''">
        {{ errorMsg }}
      </v-alert>

      <!-- LOADING -->
      <div v-if="loading" class="as-loading">
        <v-progress-circular indeterminate color="#dc2626" size="36" />
        <span>Consultando stock...</span>
      </div>

      <!-- SIN DATOS GENERADOS -->
      <div v-else-if="!generado" class="as-empty-state">
        <v-icon size="56" color="rgba(var(--v-theme-on-surface),.15)">mdi-alert-circle-outline</v-icon>
        <p>Presiona <strong>Generar</strong> para consultar los productos bajo stock mínimo</p>
      </div>

      <!-- SIN ALERTAS -->
      <div v-else-if="grupos.length === 0" class="as-empty-state as-ok">
        <v-icon size="56" color="#16a34a">mdi-check-circle-outline</v-icon>
        <p style="color:#16a34a;font-weight:700">¡Todo en orden!</p>
        <p>No hay productos por debajo del stock mínimo en la Bodega Maestra<span v-if="bodega"> ({{ bodega }})</span>.</p>
      </div>

      <!-- TABLA DE RESULTADOS -->
      <template v-else>

        <!-- Resumen -->
        <div class="as-resumen">
          <div class="as-res-chip as-res-total">
            <v-icon size="15">mdi-package-variant</v-icon>
            <span>{{ totalProductos }} producto{{ totalProductos !== 1 ? 's' : '' }} en alerta</span>
          </div>
          <div class="as-res-chip as-res-cero">
            <v-icon size="15">mdi-alert</v-icon>
            <span>{{ totalCero }} con stock cero o negativo</span>
          </div>
          <div v-if="bodega" class="as-res-chip as-res-bodega">
            <v-icon size="15">mdi-warehouse</v-icon>
            <span>Bodega: {{ bodega }}</span>
          </div>
        </div>

        <!-- Grupos -->
        <div v-for="grupo in grupos" :key="grupo.nombre" class="as-grupo-block">
          <div class="as-grupo-header">
            <v-icon size="14" color="#dc2626" class="mr-1">mdi-folder-outline</v-icon>
            <span class="as-grupo-nombre">{{ grupo.nombre }}</span>
            <span class="as-grupo-count">{{ grupo.items.length }} producto{{ grupo.items.length !== 1 ? 's' : '' }}</span>
          </div>

          <table class="as-table">
            <thead>
              <tr>
                <th class="th-cod">CÓDIGO</th>
                <th class="th-nom">NOMBRE</th>
                <th class="th-desc">DESCRIPCIÓN</th>
                <th class="th-und">UND</th>
                <th class="th-num">STOCK MÍN</th>
                <th class="th-num">STOCK ACTUAL</th>
                <th class="th-num">FALTANTE</th>
                <th class="th-barra">NIVEL</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in grupo.items" :key="p.codigo"
                class="as-row"
                :class="{ 'as-row-cero': parseFloat(p.stock_actual) <= 0 }">
                <td><span class="badge-cod">{{ p.codigo }}</span></td>
                <td class="td-nom">{{ p.nombre }}</td>
                <td class="td-desc">{{ p.descripcion || '—' }}</td>
                <td><span class="badge-und">{{ p.und }}</span></td>
                <td class="td-num">{{ fmtNum(p.stock_minimo) }}</td>
                <td class="td-num" :class="parseFloat(p.stock_actual) <= 0 ? 'td-cero' : 'td-bajo'">
                  {{ fmtNum(p.stock_actual) }}
                </td>
                <td class="td-num td-faltante">{{ fmtNum(p.faltante) }}</td>
                <td class="td-barra">
                  <div class="nivel-bar-bg">
                    <div class="nivel-bar-fill"
                      :class="parseFloat(p.stock_actual) <= 0 ? 'nivel-cero' : 'nivel-bajo'"
                      :style="{ width: nivelPct(p) + '%' }">
                    </div>
                  </div>
                  <span class="nivel-pct">{{ nivelPct(p) }}%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </template>
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

const authStore = useAuthStore()

const loading   = ref(false)
const generado  = ref(false)
const errorMsg  = ref('')
const advertencia = ref('')
const filas     = ref([])
const bodega    = ref('')

// Agrupar por grupo_nombre
const grupos = computed(() => {
  const map = {}
  for (const f of filas.value) {
    const k = f.grupo_nombre || 'Sin Grupo'
    if (!map[k]) map[k] = { nombre: k, items: [] }
    map[k].items.push(f)
  }
  return Object.values(map)
})

const totalProductos = computed(() => filas.value.length)
const totalCero      = computed(() => filas.value.filter(f => parseFloat(f.stock_actual) <= 0).length)

async function generar() {
  errorMsg.value = ''; advertencia.value = ''
  loading.value = true; generado.value = false; filas.value = []; bodega.value = ''
  try {
    const res = await api.get('/almacen/reporte-alertas-stock', {
      params: { empresa: authStore.empresaCodigo }
    })
    if (!res.data.success) throw new Error(res.data.error || 'Error al generar')
    filas.value  = res.data.data || []
    bodega.value = res.data.bodega || ''
    if (res.data.advertencia) advertencia.value = res.data.advertencia
    generado.value = true
  } catch (e) {
    errorMsg.value = e.response?.data?.error || e.message
  } finally {
    loading.value = false
  }
}

function fmtNum(v) {
  const n = parseFloat(v) || 0
  return n.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function nivelPct(p) {
  const actual = parseFloat(p.stock_actual) || 0
  const min    = parseFloat(p.stock_minimo) || 1
  if (actual <= 0) return 0
  return Math.min(Math.round((actual / min) * 100), 99)
}

// ── PDF ──────────────────────────────────────────────────────────
function exportarPDF() {
  const doc    = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
  const PW     = doc.internal.pageSize.getWidth()   // 279
  const PH     = doc.internal.pageSize.getHeight()  // 216
  const ML     = 8, MR = 8
  const HEADER_H = 30

  const hoyDate = new Date()
  const mm   = String(hoyDate.getMonth() + 1).padStart(2, '0')
  const dd   = String(hoyDate.getDate()).padStart(2, '0')
  const yyyy = hoyDate.getFullYear()
  const hoyStr = `${mm}/${dd}/${yyyy}`

  function drawHeader(pageNum, totalPages) {
    // Panel izquierdo oscuro
    doc.setFillColor(26, 26, 46)
    doc.rect(0, 0, 60, HEADER_H, 'F')
    // Panel derecho claro
    doc.setFillColor(248, 250, 252)
    doc.rect(60, 0, PW - 60, HEADER_H, 'F')
    // Línea roja separadora
    doc.setDrawColor(220, 38, 38)
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
    doc.text('ALERTAS DE STOCK', ML, 15)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(252, 165, 165)
    doc.text('BAJO STOCK MÍNIMO', ML, 21)

    // Derecha — Bodega
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(100, 116, 139)
    doc.text('BODEGA MAESTRA:', 64, 8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(26, 26, 46)
    doc.setFontSize(7.5)
    doc.text(bodega.value || '—', 64, 14)

    // Derecha — Productos en alerta
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(100, 116, 139)
    doc.text('PRODUCTOS EN ALERTA:', 140, 8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(26, 26, 46)
    doc.setFontSize(7.5)
    doc.text(String(totalProductos.value), 140, 14)

    // Derecha — Con stock cero
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(100, 116, 139)
    doc.text('CON STOCK CERO:', 64, 22)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(220, 38, 38)
    doc.setFontSize(7.5)
    doc.text(String(totalCero.value), 64 + doc.getTextWidth('CON STOCK CERO:') + 2, 22)

    // Número de página
    if (totalPages) {
      doc.setFontSize(7)
      doc.setTextColor(148, 163, 184)
      doc.text(`Pág. ${pageNum} / ${totalPages}`, PW - MR - 20, 14)
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
  const body     = []
  const rowItems = []  // para colorear celdas: null = fila de grupo

  for (const grupo of grupos.value) {
    body.push([{
      content: grupo.nombre.toUpperCase(),
      colSpan: 7,
      styles: {
        fontStyle: 'bold', fontSize: 7,
        textColor: [185, 28, 28],
        fillColor: [254, 242, 242],
        halign: 'left',
        cellPadding: { top: 1.4, bottom: 1.4, left: 5, right: 5 }
      }
    }])
    rowItems.push(null)

    for (const p of grupo.items) {
      body.push([
        p.codigo,
        p.nombre,
        p.descripcion || '—',
        p.und,
        fmtNum(p.stock_minimo),
        fmtNum(p.stock_actual),
        fmtNum(p.faltante),
      ])
      rowItems.push(p)
    }
  }

  autoTable(doc, {
    startY: HEADER_H + 3,
    showHead: 'everyPage',
    head: [[
      { content: 'CÓD',          styles: { halign: 'center' } },
      { content: 'NOMBRE' },
      { content: 'DESCRIPCIÓN' },
      { content: 'UND',          styles: { halign: 'center' } },
      { content: 'STOCK MÍN',   styles: { halign: 'right'  } },
      { content: 'STOCK ACTUAL', styles: { halign: 'right'  } },
      { content: 'FALTANTE',    styles: { halign: 'right'  } },
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
    columnStyles: {
      0: { cellWidth: 16,    halign: 'center' },
      1: { cellWidth: 55 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 14,    halign: 'center' },
      4: { cellWidth: 22,    halign: 'right' },
      5: { cellWidth: 25,    halign: 'right' },
      6: { cellWidth: 22,    halign: 'right', textColor: [185, 28, 28], fontStyle: 'bold' },
    },
    didParseCell(data) {
      if (data.section !== 'body') return
      const item = rowItems[data.row.index]
      if (!item) return
      if (data.column.index === 5) {
        const val = parseFloat(item.stock_actual)
        data.cell.styles.textColor = val <= 0 ? [220, 38, 38] : [202, 138, 4]
        data.cell.styles.fontStyle = 'bold'
      }
    },
    margin: { left: ML, right: MR, bottom: 14, top: HEADER_H + 2 },
    didDrawPage: (data) => { drawHeader(data.pageNumber, null) },
  })

  const totalPgs = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPgs; i++) {
    doc.setPage(i)
    drawFooter()
    doc.setFontSize(7)
    doc.setTextColor(148, 163, 184)
    doc.text(`Pág. ${i} / ${totalPgs}`, PW - MR - 20, 14)
    doc.setTextColor(0, 0, 0)
  }

  window.open(URL.createObjectURL(doc.output('blob')), '_blank')
}
</script>

<style scoped>
.as-container { padding: 20px 24px; max-width: 1200px; }

/* Breadcrumb */
.breadcrumb { display:flex; align-items:center; gap:4px; margin-bottom:16px; font-size:11px; }
.bc-root  { color:rgba(var(--v-theme-on-surface),.4); font-weight:600; text-transform:uppercase; letter-spacing:.5px; }
.bc-sep   { color:rgba(var(--v-theme-on-surface),.25); }
.bc-cat   { color:rgba(var(--v-theme-on-surface),.5); }
.bc-current { color:rgba(var(--v-theme-on-surface),.85); font-weight:700; }

/* Header */
.as-header { display:flex; align-items:center; gap:14px; margin-bottom:20px; }
.as-header-icon { width:46px; height:46px; border-radius:12px; background:linear-gradient(135deg,#dc2626,#b91c1c); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.as-title    { font-size:18px; font-weight:800; margin:0; }
.as-subtitle { font-size:12px; color:rgba(var(--v-theme-on-surface),.5); margin:2px 0 0; }
.as-header-actions { display:flex; align-items:center; }

/* Loading / Empty */
.as-loading { display:flex; align-items:center; gap:12px; padding:48px; justify-content:center; color:rgba(var(--v-theme-on-surface),.5); font-size:14px; }
.as-empty-state { display:flex; flex-direction:column; align-items:center; gap:10px; padding:64px 24px; text-align:center; color:rgba(var(--v-theme-on-surface),.45); font-size:13px; }
.as-empty-state strong { color:rgba(var(--v-theme-on-surface),.7); }
.as-ok p { color:rgba(var(--v-theme-on-surface),.6); }

/* Resumen chips */
.as-resumen { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; }
.as-res-chip { display:flex; align-items:center; gap:5px; padding:5px 12px; border-radius:20px; font-size:11px; font-weight:700; }
.as-res-total  { background:rgba(220,38,38,.1);  color:#dc2626; border:1px solid rgba(220,38,38,.25); }
.as-res-cero   { background:rgba(220,38,38,.06); color:#9f1239; border:1px solid rgba(220,38,38,.15); }
.as-res-bodega { background:rgba(var(--v-theme-on-surface),.06); color:rgba(var(--v-theme-on-surface),.6); border:1px solid rgba(var(--v-theme-on-surface),.12); }

/* Grupo */
.as-grupo-block  { margin-bottom:24px; border:1px solid rgba(var(--v-theme-on-surface),.08); border-radius:10px; overflow:hidden; }
.as-grupo-header { display:flex; align-items:center; gap:6px; padding:9px 16px; background:rgba(220,38,38,.05); border-bottom:1px solid rgba(220,38,38,.1); }
.as-grupo-nombre { font-size:12px; font-weight:700; color:rgba(var(--v-theme-on-surface),.8); text-transform:uppercase; letter-spacing:.4px; }
.as-grupo-count  { font-size:11px; color:rgba(var(--v-theme-on-surface),.4); margin-left:6px; }

/* Tabla */
.as-table { width:100%; border-collapse:collapse; font-size:12.5px; }
.as-table thead th { padding:8px 12px; text-align:left; font-size:10px; font-weight:700; letter-spacing:.5px; text-transform:uppercase; color:rgba(var(--v-theme-on-surface),.5); background:rgba(var(--v-theme-on-surface),.03); border-bottom:1px solid rgba(var(--v-theme-on-surface),.07); white-space:nowrap; }

.as-row { border-bottom:1px solid rgba(var(--v-theme-on-surface),.05); }
.as-row:hover { background:rgba(var(--v-theme-on-surface),.03); }
.as-row-cero  { background:rgba(220,38,38,.04); }
.as-row-cero:hover { background:rgba(220,38,38,.08); }

.as-table td { padding:9px 12px; vertical-align:middle; }

.th-cod   { width:80px; }
.th-nom   { width:200px; }
.th-desc  { }
.th-und   { width:60px; }
.th-num   { width:100px; text-align:right !important; }
.th-barra { width:110px; }

.td-nom  { font-weight:600; }
.td-desc { color:rgba(var(--v-theme-on-surface),.5); font-size:12px; }
.td-num  { text-align:right; font-family:monospace; font-size:12px; }
.td-bajo    { color:#ca8a04; font-weight:700; }
.td-cero    { color:#dc2626; font-weight:700; }
.td-faltante { color:#dc2626; font-weight:700; }

.badge-cod { background:rgba(var(--v-theme-on-surface),.07); border-radius:4px; padding:2px 7px; font-size:11px; font-weight:700; font-family:monospace; }
.badge-und { background:rgba(59,130,246,.1); color:#3b82f6; border-radius:4px; padding:2px 7px; font-size:10px; font-weight:700; }

/* Barra nivel */
.td-barra { vertical-align:middle; }
.nivel-bar-bg   { height:6px; background:rgba(var(--v-theme-on-surface),.1); border-radius:3px; overflow:hidden; display:inline-block; width:70px; vertical-align:middle; }
.nivel-bar-fill { height:100%; border-radius:3px; transition:width .3s; }
.nivel-bajo { background:#ca8a04; }
.nivel-cero { background:#dc2626; width:0% !important; }
.nivel-pct  { font-size:10px; color:rgba(var(--v-theme-on-surface),.4); margin-left:6px; font-family:monospace; }
</style>
