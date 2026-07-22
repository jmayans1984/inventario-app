<template>
  <MainLayout>
    <div class="er-wrap">

      <!-- BREADCRUMB -->
      <div class="er-breadcrumb">
        <span class="bc-root">CONTABILIDAD</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Estado de Resultados</span>
      </div>

      <!-- HEADER -->
      <div class="er-header">
        <div class="er-header-left">
          <div class="er-icon-wrap">
            <v-icon size="24" color="white">mdi-trending-up</v-icon>
          </div>
          <div>
            <h1 class="er-title">ESTADO DE RESULTADOS</h1>
            <p class="er-sub">Cuentas contables agrupadas por grupo de gastos · Materia Prima por juego de inventarios</p>
          </div>
        </div>
      </div>

      <!-- FILTROS -->
      <div class="er-filtros">
        <div class="modo-toggle">
          <button :class="['modo-btn', { active: modo === 'mensual' }]" @click="modo = 'mensual'">Mensual</button>
          <button :class="['modo-btn', { active: modo === 'anual' }]"   @click="modo = 'anual'">Anual (por mes)</button>
        </div>
        <input v-if="modo === 'mensual'" type="month" v-model="mesSel" class="fx-input" />
        <input v-else type="number" v-model.number="anioSel" class="fx-input fx-anio" min="2000" max="2100" />
        <select v-model="ccostoSel" class="fx-input fx-select">
          <option value="">Toda la Empresa</option>
          <option v-for="cc in (data?.ccostosDisponibles || [])" :key="cc.codigo" :value="cc.codigo">{{ cc.nombre }}</option>
        </select>
        <v-btn color="#6d28d9" variant="flat" prepend-icon="mdi-refresh" :loading="loading" rounded="lg" @click="cargar">
          Actualizar
        </v-btn>
        <v-btn color="#ef4444" variant="flat" prepend-icon="mdi-file-pdf-box" :loading="generandoPdf"
               rounded="lg" :disabled="!data" @click="generarPDF">
          Imprimir PDF
        </v-btn>
      </div>

      <!-- LOADING -->
      <div v-if="loading" class="er-loading">
        <v-progress-circular indeterminate color="#6d28d9" size="48" />
        <p>Calculando estado de resultados...</p>
      </div>

      <template v-else-if="data">

        <div v-if="!data.materiaPrima.ctaCodigo" class="er-warning">
          <v-icon size="20" color="#ef4444">mdi-alert-circle-outline</v-icon>
          <span>No hay configurada la <b>Cuenta Contable Materia Prima (Entrada de Almacén)</b> en Configuración General. El costo de materia prima se calculará solo con el juego de inventarios, sin compras.</span>
        </div>

        <!-- KPI CARDS -->
        <div class="er-kpis">
          <div class="er-kpi">
            <div class="er-kpi-accent" style="background:#22c55e"></div>
            <div class="er-kpi-icon" style="background:rgba(34,197,94,0.12)">
              <v-icon size="20" color="#22c55e">mdi-trending-up</v-icon>
            </div>
            <div class="er-kpi-body">
              <div class="er-kpi-lbl">Total Ingresos</div>
              <div class="er-kpi-val" style="color:#22c55e">{{ fmt(data.kpis.totalIngresos) }}</div>
            </div>
          </div>
          <div class="er-kpi">
            <div class="er-kpi-accent" style="background:#f97316"></div>
            <div class="er-kpi-icon" style="background:rgba(249,115,22,0.12)">
              <v-icon size="20" color="#f97316">mdi-fire</v-icon>
            </div>
            <div class="er-kpi-body">
              <div class="er-kpi-lbl">Consumo Materia Prima</div>
              <div class="er-kpi-val" style="color:#f97316">{{ fmt(data.kpis.consumoMP) }}</div>
            </div>
          </div>
          <div class="er-kpi">
            <div class="er-kpi-accent" style="background:#0ea5e9"></div>
            <div class="er-kpi-icon" style="background:rgba(14,165,233,0.12)">
              <v-icon size="20" color="#0ea5e9">mdi-receipt-text-outline</v-icon>
            </div>
            <div class="er-kpi-body">
              <div class="er-kpi-lbl">Total Egresos</div>
              <div class="er-kpi-val" style="color:#0ea5e9">{{ fmt(data.kpis.totalEgresos) }}</div>
            </div>
          </div>
          <div class="er-kpi">
            <div class="er-kpi-accent" :style="{ background: data.kpis.utilidadNeta >= 0 ? '#22c55e' : '#ef4444' }"></div>
            <div class="er-kpi-icon" :style="{ background: data.kpis.utilidadNeta >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)' }">
              <v-icon size="20" :color="data.kpis.utilidadNeta >= 0 ? '#22c55e' : '#ef4444'">mdi-scale-balance</v-icon>
            </div>
            <div class="er-kpi-body">
              <div class="er-kpi-lbl">Utilidad Neta</div>
              <div class="er-kpi-val" :style="{ color: data.kpis.utilidadNeta >= 0 ? '#22c55e' : '#ef4444' }">{{ fmt(data.kpis.utilidadNeta) }}</div>
            </div>
          </div>
        </div>

        <!-- ESTADO DE RESULTADOS -->
        <div class="er-card er-card-full">
          <div class="er-card-header">
            <v-icon size="18" color="#6d28d9">mdi-file-chart-outline</v-icon>
            <span class="er-card-title">
              {{ modo === 'anual' ? `Estado de Resultados — ${anioSel}` : `Estado de Resultados — ${mesLabel}` }}
              <span v-if="ccostoSel" class="er-card-badge">{{ ccostoNombre }}</span>
              <span v-else class="er-card-badge">Toda la Empresa</span>
            </span>
          </div>

          <div class="er-table-wrap">
            <table class="er-table">
              <thead>
                <tr>
                  <th class="th-cuenta">CUENTA</th>
                  <th v-for="p in data.periodos" :key="p.key" class="tr">{{ p.label }}</th>
                  <th v-if="modo === 'anual'" class="tr th-total">TOTAL</th>
                  <th class="tr th-pct">% VTA</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="g in data.grupos" :key="g.codigo || g.nombre">
                  <tr class="er-row-grupo-header">
                    <td :colspan="colCount">{{ g.nombre }}</td>
                  </tr>
                  <tr v-for="c in g.cuentas" :key="c.codigo" class="er-row-cuenta">
                    <td class="td-cuenta td-indent">
                      {{ c.nombre }}
                      <span v-if="c.esConsumoCalculado" class="badge-info">JUEGO DE INVENTARIOS</span>
                    </td>
                    <td v-for="(v, i) in c.valores" :key="i" class="tr">{{ v === 0 ? '—' : fmt(v) }}</td>
                    <td v-if="modo === 'anual'" class="tr font-weight-bold">{{ fmt(c.total) }}</td>
                    <td class="tr td-pct"></td>
                  </tr>
                  <tr v-if="!g.cuentas.length" class="er-row-cuenta">
                    <td class="td-cuenta td-indent text-dim">Sin movimientos</td>
                    <td v-for="i in data.periodos.length" :key="i" class="tr">—</td>
                    <td v-if="modo === 'anual'" class="tr">—</td>
                    <td class="tr td-pct"></td>
                  </tr>
                  <tr class="er-row-subtotal">
                    <td class="td-cuenta"></td>
                    <td v-for="(v, i) in g.subtotales" :key="i" class="tr">{{ fmt(v) }}</td>
                    <td v-if="modo === 'anual'" class="tr">{{ fmt(g.total) }}</td>
                    <td class="tr td-pct">{{ fmtPct(modo === 'anual' ? g.totalPct : g.subtotalesPct[0]) }}</td>
                  </tr>
                </template>

                <tr class="er-row-total">
                  <td class="td-cuenta">UTILIDAD NETA</td>
                  <td v-for="(v, i) in data.utilidadPorPeriodo" :key="i" class="tr">{{ fmt(v) }}</td>
                  <td v-if="modo === 'anual'" class="tr">{{ fmt(data.kpis.utilidadNeta) }}</td>
                  <td class="tr td-pct">{{ fmtPct(utilidadPct) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </template>

      <div v-else-if="!loading" class="er-empty">
        <v-icon size="56" color="#94a3b8">mdi-trending-up</v-icon>
        <p>Selecciona un período y presiona Actualizar para calcular el estado de resultados.</p>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { API_BASE } from '../../utils/constants.js'
import { useAuthStore } from '../../stores/auth'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import api from '../../services/api'

const authStore = useAuthStore()
const empresa = computed(() =>
  authStore.empresaCodigo || authStore.empresa || localStorage.getItem('empresaActual') || ''
)

// ── Estado ──────────────────────────────────────────────────────────────────
const loading      = ref(false)
const generandoPdf = ref(false)
const data         = ref(null)
const empresaInfo  = ref({})

const modo = ref('mensual')

function mesActualStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
const mesSel  = ref(mesActualStr())
const anioSel = ref(new Date().getFullYear())
const ccostoSel = ref('')

const mesLabel = computed(() => {
  if (!mesSel.value) return ''
  const [y, m] = mesSel.value.split('-').map(Number)
  const nombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return `${nombres[m - 1]} ${y}`
})

const ccostoNombre = computed(() => {
  if (!ccostoSel.value || !data.value) return ''
  const cc = (data.value.ccostosDisponibles || []).find(c => c.codigo === ccostoSel.value)
  return cc ? cc.nombre : ccostoSel.value
})

// columnas: CUENTA + períodos + (TOTAL si anual) + % VTA
const colCount = computed(() => (data.value?.periodos?.length || 1) + 1 + (modo.value === 'anual' ? 1 : 0) + 1)

const utilidadPct = computed(() => {
  if (!data.value) return null
  const vn = data.value.kpis?.ventasNetas || 0
  return vn > 0 ? (data.value.kpis.utilidadNeta / vn) * 100 : null
})

// ── Formatters ──────────────────────────────────────────────────────────────
function fmt(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtPct(v) {
  if (v === null || v === undefined) return ''
  return `${v.toFixed(2)}%`
}

// ── Carga ───────────────────────────────────────────────────────────────────
async function cargar() {
  if (!empresa.value) return
  loading.value = true
  try {
    const params = new URLSearchParams({ empresa: empresa.value, modo: modo.value })
    if (modo.value === 'anual') params.set('anio', String(anioSel.value))
    else params.set('mes', mesSel.value)
    if (ccostoSel.value) params.set('ccosto', ccostoSel.value)

    const res = await fetch(`${API_BASE}/contabilidad/estado-resultados?${params}`)
    const j   = await res.json()
    if (!j.success) throw new Error(j.error)
    data.value = j
  } catch (e) {
    console.error('estado-resultados:', e)
    data.value = null
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  cargar()
  try {
    const res = await api.get('/empresa/info', { params: { empresa: empresa.value } })
    empresaInfo.value = res.data?.data || {}
  } catch (e) {
    console.error('empresa/info:', e)
  }
})

// ── GENERAR PDF ──────────────────────────────────────────────────────────────
async function generarPDF() {
  if (!data.value) return
  generandoPdf.value = true
  try {
    const anual = modo.value === 'anual'
    const doc = new jsPDF({ orientation: anual ? 'landscape' : 'portrait', unit: 'mm', format: 'letter' })
    const PW = doc.internal.pageSize.getWidth()
    const PH = doc.internal.pageSize.getHeight()
    const ML = 10
    const MR = 10
    const TW = PW - ML - MR
    const HDR_H = 22
    const FTR_H = 9

    const C_INDIGO  = [30, 27, 75]
    const C_IND2    = [79, 70, 229]
    const C_IND3    = [99, 102, 241]
    const C_IND_BG  = [238, 240, 255]
    const C_EMERALD = [16, 185, 129]
    const C_RED     = [239, 68, 68]
    const C_DARK    = [30, 27, 75]
    const C_BODY    = [55, 65, 81]
    const C_MID     = [107, 114, 128]
    const C_GREY    = [156, 163, 175]
    const C_LGREY   = [209, 213, 219]
    const C_ALTROW  = [249, 250, 255]
    const C_WHITE   = [255, 255, 255]

    const emp = empresaInfo.value
    const empNombre = (emp.nombre || authStore.empresaNombre || 'EMPRESA').toUpperCase()
    const usuario   = authStore.userName || authStore.userNombre || 'Usuario'
    const ahora = new Date()
    const fechaHoraGen = `${String(ahora.getMonth()+1).padStart(2,'0')}/${String(ahora.getDate()).padStart(2,'0')}/${ahora.getFullYear()} ${String(ahora.getHours()).padStart(2,'0')}:${String(ahora.getMinutes()).padStart(2,'0')}`
    const TOTAL_PGS = '{total_pages_count_string}'
    let y = 0

    function drawFooter() {
      const pg = doc.internal.getCurrentPageInfo().pageNumber
      const yL = PH - FTR_H + 2
      const yTx = PH - FTR_H + 6
      doc.setDrawColor(...C_LGREY)
      doc.setLineWidth(0.3)
      doc.line(ML, yL, PW - MR, yL)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.setTextColor(...C_GREY)
      doc.text(`Informe generado por ${usuario} el ${fechaHoraGen}`, ML, yTx)
      doc.text(`Pagina ${pg} de ${TOTAL_PGS}`, PW - MR, yTx, { align: 'right' })
    }

    const periodoTitulo = anual ? String(anioSel.value) : mesLabel.value
    const ccostoTitulo = ccostoSel.value ? ccostoNombre.value : 'TODA LA EMPRESA'

    function drawHeader() {
      const MT = 5
      doc.setFillColor(...C_INDIGO)
      doc.rect(ML, MT, TW, HDR_H - MT, 'F')
      doc.setFillColor(...C_IND3)
      doc.rect(ML, MT + (HDR_H - MT) - 2, TW, 2, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(...C_WHITE)
      doc.text(empNombre, ML + 5, MT + 7)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(180, 190, 230)
      doc.text(ccostoTitulo, ML + 5, MT + 12.5)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...C_WHITE)
      doc.text('ESTADO DE RESULTADOS', ML + TW - 5, MT + 7, { align: 'right' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(200, 210, 255)
      doc.text(periodoTitulo, ML + TW - 5, MT + 12.5, { align: 'right' })

      y = HDR_H + 5
    }

    const headerPages = new Set()
    function ensureHeader() {
      const pg = doc.internal.getCurrentPageInfo().pageNumber
      if (!headerPages.has(pg)) { drawHeader(); headerPages.add(pg) }
    }
    drawHeader()
    headerPages.add(1)

    const d = data.value
    const nPeriodos = d.periodos.length
    const nValCols = nPeriodos + (anual ? 1 : 0)   // columnas de valores
    const nCols = 1 + nValCols + 1                  // CUENTA + valores + % VTA
    const pctColIdx = nCols - 1
    const colCuenta = TW * 0.34
    const colPct = 13
    const colValor = (TW - colCuenta - colPct) / nValCols
    const PCT_FONT = 4.5                            // 2 pts menor que la fuente de los valores (6.5)

    const columnStyles = { 0: { cellWidth: colCuenta } }
    for (let i = 1; i < pctColIdx; i++) columnStyles[i] = { cellWidth: colValor, halign: 'right' }
    columnStyles[pctColIdx] = { cellWidth: colPct, halign: 'right', fontSize: PCT_FONT, textColor: C_MID }

    const head = [['CUENTA', ...d.periodos.map(p => p.label), ...(anual ? ['TOTAL'] : []), '% VTA']]
    const body = []
    const subtotalRows = new Set()
    const indentPad = { top: 0.9, right: 2, bottom: 0.9, left: 9 }
    const subLine = { top: 0.25, bottom: 0.1, left: 0, right: 0 }

    for (const g of d.grupos) {
      body.push([{
        content: g.nombre, colSpan: nCols,
        styles: { fontStyle: 'bold', fillColor: false, textColor: C_IND2, fontSize: 6.8,
                  cellPadding: { top: 4.5, right: 2, bottom: 1, left: 2 } }
      }])
      const cuentasList = g.cuentas.length ? g.cuentas : [{ nombre: 'Sin movimientos', valores: new Array(nPeriodos).fill(0), total: 0 }]
      for (const c of cuentasList) {
        body.push([
          { content: c.nombre, styles: { fillColor: false, cellPadding: indentPad } },
          ...c.valores.map(v => ({ content: v === 0 ? '—' : fmt(v), styles: { fillColor: false } })),
          ...(anual ? [{ content: fmt(c.total), styles: { fontStyle: 'bold', fillColor: false } }] : []),
          { content: '', styles: { fillColor: false } }
        ])
      }
      subtotalRows.add(body.length)
      const pctSub = anual ? g.totalPct : g.subtotalesPct[0]
      body.push([
        { content: '', styles: { fillColor: false, lineWidth: subLine, lineColor: C_LGREY } },
        ...g.subtotales.map(v => ({ content: fmt(v), styles: { fontStyle: 'bold', fillColor: false, textColor: C_IND2, cellPadding: { top: 1.2, right: 2, bottom: 1.2, left: 2 }, lineWidth: subLine, lineColor: C_LGREY } })),
        ...(anual ? [{ content: fmt(g.total), styles: { fontStyle: 'bold', fillColor: false, textColor: C_IND2, cellPadding: { top: 1.2, right: 2, bottom: 1.2, left: 2 }, lineWidth: subLine, lineColor: C_LGREY } }] : []),
        { content: fmtPct(pctSub), styles: { fontStyle: 'bold', fillColor: false, textColor: C_IND2, fontSize: PCT_FONT, cellPadding: { top: 1.2, right: 2, bottom: 1.2, left: 2 }, lineWidth: subLine, lineColor: C_LGREY } }
      ])
    }

    const utilPct = d.kpis.ventasNetas > 0 ? (d.kpis.utilidadNeta / d.kpis.ventasNetas) * 100 : null
    body.push([
      { content: 'UTILIDAD NETA', styles: { fontStyle: 'bold', fontSize: 8, fillColor: C_INDIGO, textColor: C_WHITE } },
      ...d.utilidadPorPeriodo.map(v => ({ content: fmt(v), styles: { fontStyle: 'bold', fontSize: 8, fillColor: C_INDIGO, textColor: v >= 0 ? C_EMERALD : [252,165,165] } })),
      ...(anual ? [{ content: fmt(d.kpis.utilidadNeta), styles: { fontStyle: 'bold', fontSize: 8, fillColor: C_INDIGO, textColor: d.kpis.utilidadNeta >= 0 ? C_EMERALD : [252,165,165] } }] : []),
      { content: fmtPct(utilPct), styles: { fontStyle: 'bold', fontSize: 6, fillColor: C_INDIGO, textColor: C_WHITE } }
    ])

    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: MR, top: HDR_H + 3, bottom: FTR_H + 2 },
      head,
      body,
      theme: 'plain',
      styles: { fontSize: 6.5, cellPadding: { top: 0.9, right: 2, bottom: 0.9, left: 2 }, halign: 'right', lineWidth: 0 },
      headStyles: { fillColor: C_INDIGO, textColor: C_WHITE, fontSize: 6, halign: 'right', lineWidth: { bottom: 0.3 }, lineColor: C_INDIGO },
      columnStyles,
      tableLineWidth: 0,
      didParseCell: (hd) => {
        if (hd.column.index === 0 && hd.section === 'body' && !subtotalRows.has(hd.row.index)) hd.cell.styles.halign = 'left'
      },
      didDrawPage: () => { ensureHeader(); drawFooter() },
    })

    drawFooter()
    doc.putTotalPages(TOTAL_PGS)
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  } catch (e) {
    console.error('generarPDF estado-resultados:', e)
  } finally {
    generandoPdf.value = false
  }
}
</script>

<style scoped>
.er-wrap { padding: 0 0 32px; }

/* BREADCRUMB */
.er-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: rgba(var(--v-theme-on-surface), 0.4); text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.25); }
.bc-cat { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-current { font-size: 11px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }

/* HEADER */
.er-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.er-header-left { display: flex; align-items: center; gap: 16px; }
.er-icon-wrap {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
  background: linear-gradient(135deg, #6d28d9, #4c1d95);
  display: flex; align-items: center; justify-content: center;
}
.er-title { font-size: 22px; font-weight: 800; margin: 0 0 2px; color: rgb(var(--v-theme-on-surface)); }
.er-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 0; }

/* FILTROS */
.er-filtros { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
.modo-toggle {
  display: flex; border-radius: 10px; overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
}
.modo-btn {
  padding: 8px 16px; font-size: 12.5px; font-weight: 700; letter-spacing: 0.3px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  background: transparent; border: none; cursor: pointer; transition: all 0.18s ease;
}
.modo-btn + .modo-btn { border-left: 1px solid rgba(var(--v-theme-on-surface), 0.08); }
.modo-btn.active { background: #6d28d9; color: white; }

.fx-input {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
  border-radius: 10px; padding: 8px 12px; font-size: 13px; font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}
.fx-anio { width: 90px; }
.fx-select { min-width: 180px; }

/* AVISO */
.er-warning {
  display: flex; align-items: center; gap: 10px;
  background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25);
  color: rgb(var(--v-theme-on-surface)); border-radius: 10px;
  padding: 12px 16px; font-size: 13px; margin-bottom: 18px;
}

/* LOADING / EMPTY */
.er-loading, .er-empty {
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  padding: 80px 0; color: rgba(var(--v-theme-on-surface), 0.5); font-size: 14px;
}

/* KPIs */
.er-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; margin-bottom: 20px; }
.er-kpi {
  position: relative; display: flex; align-items: center; gap: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px; padding: 16px 18px; overflow: hidden;
}
.er-kpi-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
.er-kpi-icon { width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.er-kpi-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.45); }
.er-kpi-val { font-size: 19px; font-weight: 800; line-height: 1.2; margin: 2px 0; }

/* CARDS */
.er-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px; padding: 18px 20px; margin-bottom: 18px;
}
.er-card-full { width: 100%; }
.er-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.er-card-title { font-size: 13.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: rgb(var(--v-theme-on-surface)); flex: 1; display: flex; align-items: center; gap: 8px; }
.er-card-badge {
  font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 10px;
  background: rgba(109,40,217,0.1); color: #6d28d9; white-space: nowrap; text-transform: none;
}

/* TABLA ESTADO DE RESULTADOS (estilo limpio, compacto, tipo hoja contable) */
.er-table-wrap { overflow-x: auto; }
.er-table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
.er-table thead th {
  text-align: right; font-size: 9.5px; font-weight: 800; letter-spacing: 0.4px;
  color: rgba(var(--v-theme-on-surface), 0.5); text-transform: uppercase;
  padding: 5px 8px; border-bottom: 2px solid rgba(var(--v-theme-on-surface), 0.15);
  white-space: nowrap;
}
.th-cuenta { text-align: left !important; width: 100%; }
.th-total { color: #6d28d9 !important; }
.er-table td { padding: 2.5px 8px; white-space: nowrap; line-height: 1.3; }
/* La columna CUENTA absorbe el ancho sobrante; valores y % quedan juntos a la derecha */
.er-table thead th:not(.th-cuenta),
.er-table td:not(.td-cuenta) { width: 1px; }
/* % pegado al valor de la izquierda */
.th-pct, .td-pct { padding-left: 2px !important; }
.er-table .tr { text-align: right; }
.td-cuenta { color: rgb(var(--v-theme-on-surface)); text-align: left; white-space: normal; }
.td-indent { padding-left: 24px !important; }
.text-dim { color: rgba(var(--v-theme-on-surface), 0.4); font-style: italic; }

.er-row-grupo-header td {
  font-weight: 800; font-size: 10.5px; letter-spacing: 0.5px; text-transform: uppercase;
  color: #6d28d9; padding: 16px 8px 4px;
  border-bottom: 1px solid rgba(109,40,217,0.2);
}
.er-row-cuenta td { border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.04); }
.er-row-subtotal td {
  font-weight: 700; background: transparent;
  padding: 3.5px 8px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.15);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
/* Columna % sobre venta: fuente 2px más pequeña que los valores, alineada al final */
.th-pct { color: rgba(var(--v-theme-on-surface), 0.45) !important; }
.td-pct { font-size: 9.5px; color: rgba(var(--v-theme-on-surface), 0.5); text-align: right; }
.er-row-subtotal .td-pct { color: #6d28d9; font-weight: 700; }
.er-row-total .td-pct { color: rgba(255,255,255,0.85); }
.er-row-total td {
  background: #6d28d9; color: white; font-weight: 800; font-size: 14px;
  padding: 12px 10px;
}

.badge-info {
  background: rgba(6,182,212,0.12); color: #06b6d4;
  font-size: 9.5px; font-weight: 700; padding: 2px 7px; border-radius: 8px; margin-left: 6px;
  text-transform: uppercase;
}
</style>
