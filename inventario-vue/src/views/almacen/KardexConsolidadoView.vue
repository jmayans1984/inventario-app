<template>
  <MainLayout>
    <div class="kc-container">

      <!-- BREADCRUMB -->
      <div class="kc-breadcrumb no-print">
        <span class="bc-root">ALMACÉN</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Kardex Consolidado</span>
      </div>

      <!-- CONTROLES -->
      <div class="kc-controls no-print">
        <div class="kc-controls-left">
          <div class="kc-icon-wrap">
            <v-icon size="22" color="white">mdi-table-multiple</v-icon>
          </div>
          <div>
            <h1 class="kc-title">KARDEX CONSOLIDADO</h1>
            <p class="kc-sub">Stock actual detallado por centro de costos</p>
          </div>
        </div>
        <v-btn
          v-if="!loading && productosAgrupados.length > 0"
          color="#047857"
          variant="elevated"
          prepend-icon="mdi-printer"
          @click="imprimir"
        >
          Imprimir / PDF
        </v-btn>
      </div>

      <!-- CARGANDO -->
      <div v-if="loading" class="kc-loading no-print">
        <v-progress-circular indeterminate color="#047857" size="36" />
        <span>Cargando kardex...</span>
      </div>

      <!-- DOCUMENTO -->
      <div v-else-if="productosAgrupados.length > 0" class="doc-wrapper">

        <!-- ENCABEZADO -->
        <div class="doc-header">
          <div class="doc-empresa-nombre">{{ empresaNombre }}</div>
          <div class="doc-header-fecha">
            <span class="doc-fecha-label">FECHA:</span>
            <span class="doc-fecha-valor">{{ fechaHoy }}</span>
          </div>
        </div>
        <div class="doc-titulo">KARDEX ACTUAL DETALLADO POR CENTRO DE COSTOS</div>
        <div class="doc-divider"></div>

        <!-- TABLA POR GRUPO -->
        <div v-for="grupo in productosAgrupados" :key="grupo.key" class="doc-grupo">
          <div class="doc-grupo-header">
            <span>{{ grupo.nombre }}</span>
            <span class="doc-grupo-count">{{ grupo.items.length }} producto{{ grupo.items.length !== 1 ? 's' : '' }}</span>
          </div>
          <div class="doc-tabla-wrap">
            <table class="doc-tabla">
              <thead>
                <tr>
                  <th class="col-cod" rowspan="2">CÓD.</th>
                  <th class="col-nom" rowspan="2">NOMBRE</th>
                  <th class="col-desc" rowspan="2">DESCRIPCIÓN</th>
                  <th class="col-und" rowspan="2">UND</th>
                  <th v-for="cc in ccostos" :key="cc.codigo" colspan="2" class="col-cc-header">{{ cc.nombre }}</th>
                </tr>
                <tr>
                  <template v-for="cc in ccostos" :key="cc.codigo">
                    <th class="col-stock">STOCK</th>
                    <th class="col-blank">HOY</th>
                  </template>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in grupo.items" :key="p.codigo">
                  <td class="col-cod">{{ p.codigo }}</td>
                  <td class="col-nom">{{ p.nombre }}</td>
                  <td class="col-desc">{{ p.descripcion }}</td>
                  <td class="col-und">{{ p.und }}</td>
                  <template v-for="cc in ccostos" :key="cc.codigo">
                    <td class="col-stock"
                        :class="{ 'stock-pos': stockVisible(p, cc.codigo) && (p.stocks[cc.codigo] || 0) > 0, 'stock-neg': stockVisible(p, cc.codigo) && (p.stocks[cc.codigo] || 0) < 0 }">
                      {{ stockVisible(p, cc.codigo) ? formatStock(p.stocks[cc.codigo]) : '' }}
                    </td>
                    <td class="col-blank"></td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <div v-else-if="!loading" class="kc-empty no-print">
        <v-icon size="48" color="rgba(var(--v-theme-on-surface),.2)">mdi-table-off</v-icon>
        <p>No hay productos de inventario</p>
        <span>Activa productos con "Control = SÍ" en Gestión de Productos</span>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const authStore = useAuthStore()
const loading        = ref(false)
const productos      = ref([])
const ccostos        = ref([])
const bodegaMaestra  = ref(null)

const empresaNombre = computed(() => authStore.empresaNombre || '')

const fechaHoy = computed(() => {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${d.getFullYear()}`
})

const productosAgrupados = computed(() => {
  const mapa = new Map()
  for (const p of productos.value) {
    const key    = p.grupo || '__sin_grupo__'
    const nombre = p.grupo_nombre || 'Sin Grupo'
    if (!mapa.has(key)) mapa.set(key, { key, nombre, items: [] })
    mapa.get(key).items.push(p)
  }
  return Array.from(mapa.values())
})

function formatStock(val) {
  if (!val || val === 0) return '—'
  const n = parseFloat(val)
  if (isNaN(n) || n === 0) return '—'
  return new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)
}

function stockVisible(producto, ccCodigo) {
  if (String(ccCodigo) === String(bodegaMaestra.value)) return true
  return producto.visible_operacional === 'SI'
}

async function cargar() {
  loading.value = true
  try {
    const res = await api.get('/almacen/kardex-consolidado', {
      params: { empresa: authStore.empresa }
    })
    ccostos.value       = res.data?.ccostos     || []
    productos.value     = res.data?.productos   || []
    bodegaMaestra.value = res.data?.bodegaMaestra || null
  } catch (e) {
    console.error('Error cargando kardex consolidado:', e)
  } finally {
    loading.value = false
  }
}

function imprimir() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const PW = doc.internal.pageSize.getWidth()
  const ML = 8, MR = 8

  function drawHeader() {
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(empresaNombre.value.toUpperCase(), ML, 12)

    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text('KARDEX ACTUAL DETALLADO POR CENTRO DE COSTOS', ML, 17)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    const fechaLabel = `FECHA: ${fechaHoy.value}`
    doc.text(fechaLabel, PW - MR - doc.getTextWidth(fechaLabel), 12)

    doc.setLineWidth(0.5)
    doc.line(ML, 20, PW - MR, 20)
  }

  drawHeader()

  // Cabecera doble fila: fija + sub-headers por CC (STOCK | HOY)
  const ccSubHeaders = []
  ccostos.value.forEach(cc => ccSubHeaders.push(cc.nombre, ''))
  const head = [
    [
      { content: 'CÓD.',        rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'NOMBRE',      rowSpan: 2, styles: { valign: 'middle' } },
      { content: 'DESCRIPCIÓN', rowSpan: 2, styles: { valign: 'middle' } },
      { content: 'UND',         rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      ...ccostos.value.map(cc => ({ content: cc.nombre, colSpan: 2, styles: { halign: 'center', fillColor: [220, 220, 220], textColor: [0, 0, 0] } }))
    ],
    [
      ...ccostos.value.flatMap(() => [
        { content: 'STOCK', styles: { halign: 'center', fontSize: 6 } },
        { content: 'HOY',   styles: { halign: 'center', fontSize: 6, fillColor: [255, 255, 255], textColor: [0, 0, 0] } },
      ])
    ]
  ]

  const body = []
  for (const grupo of productosAgrupados.value) {
    body.push([{
      content: `${grupo.nombre.toUpperCase()}   (${grupo.items.length} productos)`,
      colSpan: 4 + ccostos.value.length * 2,
      styles: { fontStyle: 'bold', fontSize: 7, fillColor: [80, 80, 80], textColor: [255, 255, 255], cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 } }
    }])
    for (const p of grupo.items) {
      const ccCells = ccostos.value.flatMap(cc => {
        const visible = String(cc.codigo) === String(bodegaMaestra.value) || p.visible_operacional === 'SI'
        const s = p.stocks[cc.codigo]
        const val = visible && s && s !== 0
          ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(s)
          : ''
        return [
          { content: val, styles: { halign: 'center', fontStyle: val ? 'bold' : 'normal', textColor: [0, 0, 0] } },
          { content: '', styles: { fillColor: [255, 255, 255] } }
        ]
      })
      body.push([p.codigo, p.nombre, p.descripcion || '', p.und, ...ccCells])
    }
  }

  const colW = Math.max(10, Math.min(18, Math.floor((PW - ML - MR - 97) / Math.max(ccostos.value.length * 2, 1))))
  const colStyles = {
    0: { cellWidth: 12, halign: 'center' },
    1: { cellWidth: 40 },
    2: { cellWidth: 30, textColor: [0, 0, 0] },
    3: { cellWidth: 10, halign: 'center' },
  }
  ccostos.value.forEach((_, i) => {
    colStyles[4 + i * 2]     = { cellWidth: colW, halign: 'center' }
    colStyles[4 + i * 2 + 1] = { cellWidth: colW, halign: 'center' }
  })

  autoTable(doc, {
    head,
    body,
    startY: 23,
    margin: { left: ML, right: MR, top: 23 },
    styles: {
      fontSize: 7,
      cellPadding: { top: 1.6, bottom: 1.6, left: 1.5, right: 1.5 },
      lineColor: [180, 180, 180],
      lineWidth: 0.2,
      overflow: 'ellipsize',
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
      cellPadding: { top: 1.6, bottom: 1.6, left: 1.5, right: 1.5 },
    },
    alternateRowStyles: { fillColor: [252, 252, 252] },
    columnStyles: colStyles,
    rowPageBreak: 'avoid',
    didDrawPage(data) {
      if (data.pageNumber > 1) drawHeader()
    },
  })

  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

onMounted(cargar)
</script>

<style scoped>
.kc-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
.kc-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 12px; font-weight: 700; color: #047857; text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface),.3); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface),.8); font-weight: 500; }
.kc-controls { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
.kc-controls-left { display: flex; align-items: center; gap: 16px; }
.kc-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#047857,#065f46); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(4,120,87,.35); flex-shrink: 0; }
.kc-title { font-size: 20px; font-weight: 800; margin: 0; }
.kc-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }
.kc-loading { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 80px; font-size: 13px; color: rgba(var(--v-theme-on-surface),.5); }
.kc-empty { text-align: center; padding: 80px 20px; color: rgba(var(--v-theme-on-surface),.4); }
.kc-empty p { font-size: 16px; font-weight: 600; margin: 12px 0 6px; }

/* DOCUMENTO */
.doc-wrapper { background: white; color: #000; padding: 24px; border-radius: 8px; box-shadow: 0 2px 16px rgba(0,0,0,.1); font-family: Arial, sans-serif; overflow-x: auto; }
.doc-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 4px; }
.doc-empresa-nombre { font-size: 16px; font-weight: 900; text-transform: uppercase; color: #000; }
.doc-header-fecha { display: flex; align-items: center; gap: 8px; }
.doc-fecha-label { font-size: 11px; font-weight: 700; color: #000; white-space: nowrap; }
.doc-fecha-valor { font-size: 11px; font-weight: 600; color: #000; }
.doc-titulo { font-size: 9px; font-weight: 600; color: #555; letter-spacing: .5px; text-transform: uppercase; margin-bottom: 6px; }
.doc-divider { height: 1.5px; background: #000; margin-bottom: 8px; }
.doc-grupo { margin-bottom: 6px; }
.doc-grupo-header { background: #000; color: #fff; padding: 3px 8px; display: flex; justify-content: space-between; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; }
.doc-grupo-count { opacity: .7; font-weight: 400; }
.doc-tabla-wrap { overflow-x: auto; }
.doc-tabla { width: 100%; border-collapse: collapse; font-size: 9px; }
.doc-tabla thead th { background: #f0f0f0; color: #000; padding: 3px 4px; text-align: center; font-size: 8px; font-weight: 700; text-transform: uppercase; border: 1px solid #aaa; white-space: nowrap; }
.doc-tabla tbody td { padding: 3px 4px; border: 1px solid #ccc; color: #000; vertical-align: middle; white-space: nowrap; height: 18px; }
.col-cod  { width: 40px; text-align: center; }
.col-nom  { width: 130px; font-weight: 500; }
.col-desc { width: 110px; font-size: 8px; color: #444; }
.col-und  { width: 30px; text-align: center; }
.col-cc-header { text-align: center; border: 1px solid #aaa; background: #e8f5e9; font-size: 7px; font-weight: 700; padding: 2px 4px; }
.col-stock { width: 50px; text-align: center; font-weight: 600; background: #fafafa; }
.col-blank  { width: 50px; text-align: center; background: #fff; }
.stock-pos { color: #047857; }
.stock-neg { color: #dc2626; }
</style>
