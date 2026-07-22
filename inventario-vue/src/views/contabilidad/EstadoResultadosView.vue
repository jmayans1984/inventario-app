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
            <p class="er-sub">Ventas · Materia Prima (juego de inventarios) · Gastos agrupados por cuenta contable</p>
          </div>
        </div>
        <div class="er-header-right">
          <input type="month" v-model="mesSel" class="mes-input" />
          <v-btn color="#6d28d9" variant="flat" prepend-icon="mdi-refresh" :loading="loading" rounded="lg" @click="cargar">
            Actualizar
          </v-btn>
          <v-btn color="#ef4444" variant="flat" prepend-icon="mdi-file-pdf-box" :loading="generandoPdf"
                 rounded="lg" :disabled="!data" @click="generarPDF">
            Imprimir PDF
          </v-btn>
        </div>
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
              <v-icon size="20" color="#22c55e">mdi-cash-register</v-icon>
            </div>
            <div class="er-kpi-body">
              <div class="er-kpi-lbl">Ventas Netas</div>
              <div class="er-kpi-val" style="color:#22c55e">{{ fmt(data.ingresos.ventasNetas) }}</div>
            </div>
          </div>
          <div class="er-kpi">
            <div class="er-kpi-accent" style="background:#f97316"></div>
            <div class="er-kpi-icon" style="background:rgba(249,115,22,0.12)">
              <v-icon size="20" color="#f97316">mdi-fire</v-icon>
            </div>
            <div class="er-kpi-body">
              <div class="er-kpi-lbl">Consumo Materia Prima</div>
              <div class="er-kpi-val" style="color:#f97316">{{ fmt(data.materiaPrima.consumo) }}</div>
            </div>
          </div>
          <div class="er-kpi">
            <div class="er-kpi-accent" style="background:#0ea5e9"></div>
            <div class="er-kpi-icon" style="background:rgba(14,165,233,0.12)">
              <v-icon size="20" color="#0ea5e9">mdi-receipt-text-outline</v-icon>
            </div>
            <div class="er-kpi-body">
              <div class="er-kpi-lbl">Total Gastos</div>
              <div class="er-kpi-val" style="color:#0ea5e9">{{ fmt(data.totalGastos) }}</div>
            </div>
          </div>
          <div class="er-kpi">
            <div class="er-kpi-accent" :style="{ background: data.utilidadNeta >= 0 ? '#22c55e' : '#ef4444' }"></div>
            <div class="er-kpi-icon" :style="{ background: data.utilidadNeta >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)' }">
              <v-icon size="20" :color="data.utilidadNeta >= 0 ? '#22c55e' : '#ef4444'">mdi-scale-balance</v-icon>
            </div>
            <div class="er-kpi-body">
              <div class="er-kpi-lbl">Utilidad Neta</div>
              <div class="er-kpi-val" :style="{ color: data.utilidadNeta >= 0 ? '#22c55e' : '#ef4444' }">{{ fmt(data.utilidadNeta) }}</div>
            </div>
          </div>
        </div>

        <!-- ESTADO DE RESULTADOS -->
        <div class="er-card er-card-full">
          <div class="er-card-header">
            <v-icon size="18" color="#6d28d9">mdi-file-chart-outline</v-icon>
            <span class="er-card-title">Estado de Resultados — {{ mesLabel }}</span>
          </div>

          <table class="er-table">
            <tbody>
              <tr class="er-row-ingreso">
                <td class="er-td-nombre font-weight-bold">VENTAS NETAS</td>
                <td class="tr font-weight-bold" style="color:#22c55e">{{ fmt(data.ingresos.ventasNetas) }}</td>
              </tr>

              <template v-for="s in data.secciones" :key="s.tipo">
                <tr class="er-row-seccion">
                  <td colspan="2">{{ s.tipo }}</td>
                </tr>
                <tr v-for="g in s.grupos" :key="g.codigo || g.nombre" class="er-row-grupo">
                  <td class="er-td-nombre">
                    <span class="text-dim">{{ g.codigo || '—' }}</span> · {{ g.nombre }}
                    <span v-if="g.esGrupoMateriaPrima" class="badge-info">JUEGO DE INVENTARIOS</span>
                  </td>
                  <td class="tr">{{ fmt(g.total) }}</td>
                </tr>
                <tr class="er-row-subtotal">
                  <td class="er-td-nombre">SUBTOTAL {{ s.tipo }}</td>
                  <td class="tr">{{ fmt(s.subtotal) }}</td>
                </tr>
                <tr class="er-row-utilidad">
                  <td class="er-td-nombre">UTILIDAD DESPUÉS DE {{ s.tipo }}</td>
                  <td class="tr" :style="{ color: s.utilidadAcumulada >= 0 ? '#22c55e' : '#ef4444' }">{{ fmt(s.utilidadAcumulada) }}</td>
                </tr>
              </template>

              <tr class="er-row-total">
                <td class="er-td-nombre">UTILIDAD NETA</td>
                <td class="tr" :style="{ color: data.utilidadNeta >= 0 ? '#22c55e' : '#ef4444' }">{{ fmt(data.utilidadNeta) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- DETALLE MATERIA PRIMA -->
        <div class="er-card er-card-full">
          <div class="er-card-header">
            <v-icon size="18" color="#f97316">mdi-scale-balance</v-icon>
            <span class="er-card-title">Detalle — Juego de Inventarios Materia Prima</span>
          </div>
          <div class="er-mp-grid">
            <div class="er-mp-item">
              <div class="er-mp-lbl">Inventario Inicial</div>
              <div class="er-mp-val" style="color:#8b5cf6">{{ fmt(data.materiaPrima.valorInicial) }}</div>
            </div>
            <div class="er-mp-item">
              <div class="er-mp-lbl">+ Compras (cuenta MP)</div>
              <div class="er-mp-val" style="color:#0ea5e9">{{ fmt(data.materiaPrima.compras) }}</div>
            </div>
            <div class="er-mp-item">
              <div class="er-mp-lbl">− Inventario Final</div>
              <div class="er-mp-val" style="color:#8b5cf6">{{ fmt(data.materiaPrima.valorFinal) }}</div>
            </div>
            <div class="er-mp-item">
              <div class="er-mp-lbl">= Consumo Real</div>
              <div class="er-mp-val" style="color:#f97316">{{ fmt(data.materiaPrima.consumo) }}</div>
            </div>
          </div>
        </div>

      </template>

      <div v-else-if="!loading" class="er-empty">
        <v-icon size="56" color="#94a3b8">mdi-trending-up</v-icon>
        <p>Selecciona un mes y presiona Actualizar para calcular el estado de resultados.</p>
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

function mesActualStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
const mesSel = ref(mesActualStr())

const mesLabel = computed(() => {
  if (!mesSel.value) return ''
  const [y, m] = mesSel.value.split('-').map(Number)
  const nombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return `${nombres[m - 1]} ${y}`
})

// ── Formatters ──────────────────────────────────────────────────────────────
function fmt(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Carga ───────────────────────────────────────────────────────────────────
function rangoMes(mesStr) {
  const [y, m] = mesStr.split('-').map(Number)
  const desde = `${y}-${String(m).padStart(2, '0')}-01`
  const ultimoDia = new Date(y, m, 0).getDate()
  const hasta = `${y}-${String(m).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
  return { desde, hasta }
}

async function cargar() {
  if (!empresa.value || !mesSel.value) return
  loading.value = true
  try {
    const { desde, hasta } = rangoMes(mesSel.value)
    const params = new URLSearchParams({ empresa: empresa.value, desde, hasta })
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
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
    const PW = doc.internal.pageSize.getWidth()
    const PH = doc.internal.pageSize.getHeight()
    const ML = 12
    const MR = 12
    const TW = PW - ML - MR
    const HDR_H = 24
    const FTR_H = 10

    const C_INDIGO  = [30, 27, 75]
    const C_IND2    = [79, 70, 229]
    const C_IND3    = [99, 102, 241]
    const C_IND_BG  = [238, 240, 255]
    const C_EMERALD = [16, 185, 129]
    const C_RED     = [239, 68, 68]
    const C_ORANGE  = [249, 115, 22]
    const C_DARK    = [30, 27, 75]
    const C_BODY    = [55, 65, 81]
    const C_MID     = [107, 114, 128]
    const C_GREY    = [156, 163, 175]
    const C_LGREY   = [209, 213, 219]
    const C_ALTROW  = [249, 250, 255]
    const C_WHITE   = [255, 255, 255]

    const emp = empresaInfo.value
    const empNombre = (emp.nombre || authStore.empresaNombre || 'EMPRESA').toUpperCase()
    const empDir    = emp.direccion || emp.dir || ''
    const empTel    = emp.telefono1 || emp.telefono || emp.tel || ''
    const usuario   = authStore.userName || authStore.userNombre || 'Usuario'

    const ahora = new Date()
    const fechaHoraGen = `${String(ahora.getMonth()+1).padStart(2,'0')}/${String(ahora.getDate()).padStart(2,'0')}/${ahora.getFullYear()} ${String(ahora.getHours()).padStart(2,'0')}:${String(ahora.getMinutes()).padStart(2,'0')}`
    const TOTAL_PGS = '{total_pages_count_string}'
    let y = 0

    function drawFooter() {
      const pg = doc.internal.getCurrentPageInfo().pageNumber
      const yL = PH - FTR_H + 2
      const yTx = PH - FTR_H + 6.5
      doc.setDrawColor(...C_LGREY)
      doc.setLineWidth(0.3)
      doc.line(ML, yL, PW - MR, yL)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.setTextColor(...C_GREY)
      doc.text(`Informe generado por ${usuario} el ${fechaHoraGen}`, ML, yTx)
      doc.text(`Pagina ${pg} de ${TOTAL_PGS}`, PW - MR, yTx, { align: 'right' })
    }

    function drawHeader(isFirstPage = false) {
      const MT = 5
      doc.setFillColor(...C_INDIGO)
      doc.rect(ML, MT, TW, HDR_H - MT, 'F')
      doc.setFillColor(...C_IND3)
      doc.rect(ML, MT + (HDR_H - MT) - 2, TW, 2, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(...C_WHITE)
      doc.text(empNombre, ML + 5, MT + 7)

      const contactLine = [empDir, empTel].filter(Boolean).join('   |   ')
      if (contactLine) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6.5)
        doc.setTextColor(180, 190, 230)
        doc.text(contactLine, ML + 5, MT + 12.5)
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...C_WHITE)
      doc.text('ESTADO DE RESULTADOS', ML + TW - 5, MT + 7, { align: 'right' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(200, 210, 255)
      doc.text(mesLabel.value, ML + TW - 5, MT + 12.5, { align: 'right' })

      y = HDR_H + 6
    }

    const headerPages = new Set()
    function ensureHeader() {
      const pg = doc.internal.getCurrentPageInfo().pageNumber
      if (!headerPages.has(pg)) { drawHeader(false); headerPages.add(pg) }
    }

    drawHeader(true)
    headerPages.add(1)

    const d = data.value
    const body = []

    body.push([
      { content: 'VENTAS NETAS', styles: { fontStyle: 'bold', textColor: C_DARK, fillColor: C_IND_BG } },
      { content: fmt(d.ingresos.ventasNetas), styles: { halign: 'right', fontStyle: 'bold', textColor: C_EMERALD, fillColor: C_IND_BG } },
    ])

    for (const s of d.secciones) {
      body.push([
        { content: s.tipo, colSpan: 2, styles: { fontStyle: 'bold', textColor: C_WHITE, fillColor: C_IND2, fontSize: 7 } },
      ])
      for (const g of s.grupos) {
        const nombre = `${g.codigo || '—'} · ${g.nombre}${g.esGrupoMateriaPrima ? '  (juego de inventarios)' : ''}`
        body.push([
          { content: nombre, styles: { textColor: C_BODY } },
          { content: fmt(g.total), styles: { halign: 'right', textColor: C_BODY } },
        ])
      }
      body.push([
        { content: `SUBTOTAL ${s.tipo}`, styles: { fontStyle: 'bold', textColor: C_DARK, fillColor: C_IND_BG } },
        { content: fmt(s.subtotal), styles: { halign: 'right', fontStyle: 'bold', textColor: C_IND2, fillColor: C_IND_BG } },
      ])
      body.push([
        { content: `UTILIDAD DESPUES DE ${s.tipo}`, styles: { fontStyle: 'bold', textColor: C_DARK } },
        { content: fmt(s.utilidadAcumulada), styles: { halign: 'right', fontStyle: 'bold', textColor: s.utilidadAcumulada >= 0 ? C_EMERALD : C_RED } },
      ])
    }

    body.push([
      { content: 'UTILIDAD NETA', styles: { fontStyle: 'bold', fontSize: 9, textColor: C_WHITE, fillColor: C_INDIGO } },
      { content: fmt(d.utilidadNeta), styles: { halign: 'right', fontStyle: 'bold', fontSize: 9, textColor: d.utilidadNeta >= 0 ? C_EMERALD : [252,165,165], fillColor: C_INDIGO } },
    ])

    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: MR, top: HDR_H + 4, bottom: FTR_H + 2 },
      body,
      theme: 'plain',
      styles: { fontSize: 7.5, cellPadding: { top: 2, right: 3, bottom: 2, left: 3 } },
      columnStyles: {
        0: { cellWidth: TW - 40 },
        1: { cellWidth: 40, halign: 'right' },
      },
      tableLineColor: C_LGREY,
      tableLineWidth: 0.1,
      didDrawPage: () => { ensureHeader(); drawFooter() },
    })

    y = doc.lastAutoTable.finalY + 8
    if (y > PH - FTR_H - 40) { drawFooter(); doc.addPage(); drawHeader(false); headerPages.add(doc.internal.getCurrentPageInfo().pageNumber) }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...C_MID)
    doc.text('DETALLE JUEGO DE INVENTARIOS — MATERIA PRIMA', ML, y)
    y += 4

    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: MR, top: HDR_H + 4, bottom: FTR_H + 2 },
      head: [['CONCEPTO', 'VALOR']],
      body: [
        ['Inventario Inicial', fmt(d.materiaPrima.valorInicial)],
        ['(+) Compras cuenta Materia Prima', fmt(d.materiaPrima.compras)],
        ['(−) Inventario Final', fmt(d.materiaPrima.valorFinal)],
        [{ content: '(=) Consumo Real Materia Prima', styles: { fontStyle: 'bold' } },
         { content: fmt(d.materiaPrima.consumo), styles: { fontStyle: 'bold', textColor: C_ORANGE } }],
      ],
      headStyles: { fillColor: C_INDIGO, textColor: C_WHITE, fontSize: 6.5, cellPadding: { top: 2, right: 3, bottom: 2, left: 3 } },
      bodyStyles: { fontSize: 7, textColor: C_BODY, cellPadding: { top: 2, right: 3, bottom: 2, left: 3 } },
      alternateRowStyles: { fillColor: C_ALTROW },
      columnStyles: { 0: { cellWidth: TW - 40 }, 1: { cellWidth: 40, halign: 'right' } },
      tableLineColor: C_LGREY,
      tableLineWidth: 0.1,
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
.er-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.er-header-left { display: flex; align-items: center; gap: 16px; }
.er-icon-wrap {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
  background: linear-gradient(135deg, #6d28d9, #4c1d95);
  display: flex; align-items: center; justify-content: center;
}
.er-title { font-size: 22px; font-weight: 800; margin: 0 0 2px; color: rgb(var(--v-theme-on-surface)); }
.er-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 0; }
.er-header-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.mes-input {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
  border-radius: 10px; padding: 8px 12px; font-size: 13px; font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

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
.er-card-title { font-size: 13.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: rgb(var(--v-theme-on-surface)); flex: 1; }

/* TABLA ESTADO DE RESULTADOS */
.er-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.er-table td { padding: 9px 12px; }
.er-table .tr { text-align: right; }
.er-td-nombre { color: rgb(var(--v-theme-on-surface)); }
.text-dim { color: rgba(var(--v-theme-on-surface), 0.4); }

.er-row-ingreso td { background: rgba(34,197,94,0.08); border-radius: 8px; font-size: 15px; }
.er-row-seccion td {
  background: #6d28d9; color: white; font-weight: 800; font-size: 11.5px;
  letter-spacing: 0.6px; text-transform: uppercase; padding: 8px 12px;
}
.er-row-grupo td { border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06); font-size: 13px; }
.er-row-subtotal td { background: rgba(109,40,217,0.08); font-weight: 700; }
.er-row-utilidad td { font-weight: 700; font-style: italic; padding-bottom: 16px; }
.er-row-total td { background: #6d28d9; color: white; font-weight: 800; font-size: 16px; border-radius: 8px; }

.badge-info {
  background: rgba(6,182,212,0.12); color: #06b6d4;
  font-size: 9.5px; font-weight: 700; padding: 2px 7px; border-radius: 8px; margin-left: 6px;
  text-transform: uppercase;
}

/* MATERIA PRIMA GRID */
.er-mp-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; }
.er-mp-item {
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-radius: 10px; padding: 14px 16px; text-align: center;
}
.er-mp-lbl { font-size: 11px; font-weight: 700; color: rgba(var(--v-theme-on-surface), 0.5); text-transform: uppercase; margin-bottom: 4px; }
.er-mp-val { font-size: 17px; font-weight: 800; }
</style>
