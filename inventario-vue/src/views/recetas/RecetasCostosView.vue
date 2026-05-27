<template>
  <MainLayout>
    <div class="rcv-container">

      <!-- BREADCRUMB -->
      <div class="rcv-breadcrumb">
        <span class="bc-root">RECETAS</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Resumen de Costos</span>
      </div>

      <!-- HEADER -->
      <div class="rcv-header">
        <div class="rcv-header-left">
          <div class="rcv-icon-wrap"><v-icon size="22" color="white">mdi-file-chart-outline</v-icon></div>
          <div>
            <h1 class="rcv-title">RESUMEN DE COSTOS</h1>
            <p class="rcv-sub">Análisis de costos, márgenes y porcentajes por receta</p>
          </div>
        </div>
        <div class="d-flex gap-3 flex-wrap">
          <v-select v-model="filtroTipo" :items="tiposFiltro" item-title="label" item-value="val"
            variant="outlined" density="compact" hide-details style="width:200px" />
          <v-btn color="#f59e0b" variant="flat" rounded="lg" :loading="loading" @click="cargar">
            <v-icon start>mdi-refresh</v-icon>Actualizar
          </v-btn>
          <v-btn color="#ef4444" variant="flat" rounded="lg" :disabled="!recetas.length"
            @click="exportarPDF">
            <v-icon start>mdi-file-pdf-box</v-icon>PDF
          </v-btn>
        </div>
      </div>

      <!-- KPI CARDS -->
      <div class="rcv-kpi-row" v-if="totals">
        <div class="rcv-kpi" style="background:linear-gradient(135deg,#f59e0b,#d97706)">
          <v-icon size="20" color="white" class="mb-1">mdi-chef-hat</v-icon>
          <span class="kpi-val">{{ totals.total_recetas }}</span>
          <span class="kpi-lbl">Recetas</span>
        </div>
        <div class="rcv-kpi" style="background:linear-gradient(135deg,#ef4444,#dc2626)">
          <v-icon size="20" color="white" class="mb-1">mdi-cash-minus</v-icon>
          <span class="kpi-val">{{ fmt(totals.costo_promedio) }}</span>
          <span class="kpi-lbl">Costo Promedio</span>
        </div>
        <div class="rcv-kpi" style="background:linear-gradient(135deg,#22c55e,#16a34a)">
          <v-icon size="20" color="white" class="mb-1">mdi-cash-plus</v-icon>
          <span class="kpi-val">{{ fmt(totals.precio_promedio) }}</span>
          <span class="kpi-lbl">P. Venta Promedio</span>
        </div>
        <div class="rcv-kpi" :style="{ background: totals.margen_promedio <= 35 ? 'linear-gradient(135deg,#ef4444,#dc2626)' : totals.margen_promedio <= 45 ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#22c55e,#16a34a)' }">
          <v-icon size="20" color="white" class="mb-1">mdi-percent</v-icon>
          <span class="kpi-val">{{ totals.margen_promedio.toFixed(1) }}%</span>
          <span class="kpi-lbl">% Costo Promedio</span>
        </div>
      </div>

      <!-- TABLA -->
      <div class="rcv-table-card" ref="tableRef">
        <v-progress-linear v-if="loading" indeterminate color="#f59e0b" height="3" />
        <v-data-table
          :headers="headers"
          :items="recetas"
          density="compact"
          hover
          :items-per-page="25"
        >
          <template #item.tipo="{ item }">
            <v-chip :color="colorTipo(item.tipo)" size="x-small" variant="tonal" label>{{ item.tipo }}</v-chip>
          </template>

          <template #item.costo="{ item }">
            <span class="font-mono text-error font-weight-bold">{{ fmt(item.costo) }}</span>
          </template>

          <template #item.precio_venta="{ item }">
            <span class="font-mono">{{ fmt(item.precio_venta) }}</span>
          </template>

          <template #item.margen="{ item }">
            <span class="font-mono" :style="{ color: parseFloat(item.margen) >= 0 ? '#22c55e' : '#ef4444' }">
              {{ fmt(item.margen) }}
            </span>
          </template>

          <template #item.porcentaje_costo="{ item }">
            <div class="d-flex align-center gap-2 pct-cell">
              <v-progress-linear
                :model-value="Math.min(parseFloat(item.porcentaje_costo)||0,100)"
                :color="colorPct(item.porcentaje_costo)"
                height="8" rounded style="min-width:60px;max-width:100px" />
              <span class="font-weight-bold text-caption"
                :style="{ color: colorPctStr(item.porcentaje_costo), minWidth:'38px' }">
                {{ item.porcentaje_costo }}%
              </span>
            </div>
          </template>
        </v-data-table>
      </div>
    </div>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3500" location="bottom right">
      {{ snack.msg }}
    </v-snackbar>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { API_BASE } from '../../utils/constants.js'

const recetas    = ref([])
const totals     = ref(null)
const loading    = ref(false)
const filtroTipo = ref('TODOS')

const TIPOS = ['PLATO', 'PRODUCTO PROPIO', 'SUBRECETA', 'BEBIDA', 'POSTRE', 'ENTRADA', 'OTRO']
const tiposFiltro = computed(() => [
  { label: 'Todos los tipos', val: 'TODOS' },
  ...TIPOS.map(t => ({ label: t, val: t }))
])

const headers = [
  { title: 'CÓDIGO',    key: 'codigo',          width: 90 },
  { title: 'NOMBRE',    key: 'nombre',          minWidth: 160 },
  { title: 'TIPO',      key: 'tipo',            width: 120 },
  { title: 'CATEG.',    key: 'categoria',       width: 110 },
  { title: 'INGRED.',   key: 'num_ingredientes',width: 80, align: 'center' },
  { title: 'COSTO',     key: 'costo',           width: 120, align: 'end' },
  { title: 'P. VENTA',  key: 'precio_venta',    width: 120, align: 'end' },
  { title: 'MARGEN',    key: 'margen',          width: 120, align: 'end' },
  { title: '% COSTO',   key: 'porcentaje_costo',width: 180 },
]

const snack = ref({ show: false, msg: '', color: 'success' })
function ok(msg)  { snack.value = { show: true, msg, color: 'success' } }
function err(msg) { snack.value = { show: true, msg, color: 'error' } }

async function cargar() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (filtroTipo.value !== 'TODOS') params.set('tipo', filtroTipo.value)
    const r = await fetch(`${API_BASE}/recetas-reporte/costos?${params}`)
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    recetas.value = j.data || []
    totals.value  = {
      ...j.totals,
      margen_promedio: typeof j.totals.margen_promedio === 'number' ? j.totals.margen_promedio : parseFloat(j.totals.margen_promedio) || 0
    }
  } catch (e) { err(e.message) }
  finally { loading.value = false }
}

async function exportarPDF() {
  const { default: jsPDF } = await import('jspdf')
  await import('jspdf-autotable')
  const doc = new jsPDF({ orientation: 'landscape', format: 'letter' })

  // Cabecera
  doc.setFillColor(245, 158, 11)
  doc.rect(0, 0, doc.internal.pageSize.width, 18, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text('RESUMEN DE COSTOS DE RECETAS', 14, 12)
  doc.setFontSize(9)
  doc.text(`Tipo: ${filtroTipo.value} · Generado: ${new Date().toLocaleDateString('es-CO')}`, 14, 17)

  // KPIs
  doc.setTextColor(40, 40, 40)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  const kpiY = 24
  const kpis = [
    { lbl: 'Total Recetas', val: String(totals.value?.total_recetas || 0) },
    { lbl: 'Costo Promedio', val: fmt(totals.value?.costo_promedio) },
    { lbl: 'P. Venta Promedio', val: fmt(totals.value?.precio_promedio) },
    { lbl: '% Costo Prom.', val: `${(totals.value?.margen_promedio||0).toFixed(1)}%` },
  ]
  kpis.forEach((k, i) => {
    const x = 14 + i * 65
    doc.setFont('helvetica', 'bold')
    doc.text(k.val, x, kpiY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120, 120, 120)
    doc.text(k.lbl, x, kpiY + 4)
    doc.setTextColor(40, 40, 40)
  })

  doc.autoTable({
    startY: kpiY + 10,
    head: [['CÓDIGO', 'NOMBRE', 'TIPO', 'CATEG.', 'ING.', 'COSTO', 'P.VENTA', 'MARGEN', '% COSTO']],
    body: recetas.value.map(r => [
      r.codigo, r.nombre, r.tipo, r.categoria || '—',
      r.num_ingredientes,
      fmt(r.costo), fmt(r.precio_venta), fmt(r.margen),
      `${r.porcentaje_costo}%`
    ]),
    styles: { fontSize: 7.5, cellPadding: 1.5 },
    headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 52 },
      2: { cellWidth: 28 },
      3: { cellWidth: 25 },
      4: { cellWidth: 12, halign: 'center' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' },
    },
    alternateRowStyles: { fillColor: [252, 248, 240] },
    didDrawCell(data) {
      if (data.section === 'body' && data.column.index === 8) {
        const pct = parseFloat(recetas.value[data.row.index]?.porcentaje_costo) || 0
        const color = pct <= 30 ? [34,197,94] : pct <= 45 ? [245,158,11] : [239,68,68]
        doc.setTextColor(...color)
        doc.setFont('helvetica', 'bold')
        doc.text(`${pct}%`, data.cell.x + data.cell.width - 2, data.cell.y + data.cell.height / 2 + 1, { align: 'right' })
        doc.setTextColor(40, 40, 40)
        doc.setFont('helvetica', 'normal')
      }
    },
  })

  doc.save(`costos-recetas-${new Date().toISOString().slice(0,10)}.pdf`)
  ok('PDF generado')
}

function fmt(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function colorTipo(tipo) {
  const m = { 'PLATO': 'cyan', 'SUBRECETA': 'orange', 'PRODUCTO PROPIO': 'purple',
               'BEBIDA': 'blue', 'POSTRE': 'pink', 'ENTRADA': 'green', 'OTRO': 'grey' }
  return m[tipo] || 'grey'
}
function colorPct(pct) {
  const p = parseFloat(pct) || 0
  if (p <= 30) return 'green'
  if (p <= 45) return 'warning'
  return 'error'
}
function colorPctStr(pct) {
  const p = parseFloat(pct) || 0
  if (p <= 30) return '#22c55e'
  if (p <= 45) return '#f59e0b'
  return '#ef4444'
}

onMounted(cargar)
</script>

<style scoped>
.rcv-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
.rcv-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 12px; font-weight: 700; color: #f59e0b; text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.3); }
.bc-cat { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.8); font-weight: 500; }
.rcv-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.rcv-header-left { display: flex; align-items: center; gap: 16px; }
.rcv-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#f59e0b,#d97706); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(245,158,11,0.35); }
.rcv-title { font-size: 20px; font-weight: 800; margin: 0; }
.rcv-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 2px 0 0; }
.rcv-kpi-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.rcv-kpi { border-radius: 14px; padding: 14px 20px; display: flex; flex-direction: column; align-items: center; min-width: 140px; flex: 1; }
.kpi-val { font-size: 20px; font-weight: 800; color: #fff; line-height: 1.2; text-align: center; }
.kpi-lbl { font-size: 11px; color: rgba(255,255,255,0.8); text-align: center; }
.rcv-table-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 16px; overflow: hidden; }
.font-mono { font-family: monospace; }
.pct-cell { min-width: 150px; }
</style>
