<template>
  <MainLayout>

    <!-- BREADCRUMB -->
    <div class="breadcrumb-bar">
      <span class="bc-root">TESORERÍA</span>
      <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
      <span class="bc-section">Reportes</span>
      <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
      <span class="bc-item">Ventas por Período</span>
    </div>

    <!-- HEADER -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <v-icon size="26" color="white">mdi-trending-up</v-icon>
        </div>
        <div>
          <h1 class="page-title">VENTAS POR PERÍODO</h1>
          <p class="page-sub">Resumen de ventas consolidadas importadas desde Square</p>
        </div>
      </div>
      <div class="header-actions">
        <v-btn
          v-if="rows.length > 0"
          color="#ef4444"
          variant="flat"
          size="small"
          prepend-icon="mdi-file-pdf-box"
          :loading="generandoPdf"
          @click="exportarPDF"
        >
          Exportar PDF
        </v-btn>
      </div>
    </div>

    <!-- FILTROS -->
    <div class="filters-panel">
      <div class="filters-grid">

        <!-- Fechas -->
        <div class="filter-group dates-group">
          <div class="filter-label">
            <v-icon size="13" color="#06b6d4">mdi-calendar-range</v-icon>
            <span>Período</span>
          </div>
          <div class="dates-row">
            <input v-model="fechaInicio" type="date" class="date-input" />
            <v-icon size="15" color="rgba(255,255,255,0.3)">mdi-arrow-right</v-icon>
            <input v-model="fechaFin" type="date" class="date-input" />
          </div>
        </div>

        <!-- Centro de Costos -->
        <div class="filter-group">
          <div class="filter-label">
            <v-icon size="13" color="#f59e0b">mdi-map-marker-outline</v-icon>
            <span>Centro de Costos</span>
          </div>
          <v-select
            v-model="ccostosSeleccionados"
            :items="ccostos"
            item-title="nombre"
            item-value="codigo"
            density="compact"
            variant="outlined"
            hide-details
            :loading="ccostosLoading"
            class="filter-select-v"
            bg-color="rgb(var(--v-theme-surface))"
            style="min-width:240px"
            multiple
            chips
            closable-chips
            placeholder="Todos los centros"
            :menu-props="{ maxHeight: 320 }"
          >
            <template #prepend-item>
              <v-list-item title="Seleccionar todos" @click="toggleTodosCcostos">
                <template #prepend>
                  <v-checkbox-btn
                    :model-value="todosSeleccionados"
                    :indeterminate="algunoSeleccionado && !todosSeleccionados"
                    color="#f59e0b"
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
                    color="#f59e0b"
                  />
                </template>
              </v-list-item>
            </template>
          </v-select>
        </div>

      </div>

      <div class="filters-footer">
        <button class="btn-consultar" :disabled="loading" @click="consultar">
          <v-icon v-if="!loading" size="17">mdi-magnify</v-icon>
          <v-progress-circular v-else size="15" width="2" indeterminate color="white" />
          <span>{{ loading ? 'Consultando...' : 'Consultar' }}</span>
        </button>
      </div>
    </div>

    <!-- ERROR -->
    <div v-if="error" class="error-banner">
      <v-icon size="18" color="#ef4444">mdi-alert-circle-outline</v-icon>
      <span>{{ error }}</span>
    </div>

    <!-- KPI CARDS -->
    <div v-if="rows.length > 0" class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-icon" style="background:rgba(6,182,212,0.13)">
          <v-icon size="20" color="#06b6d4">mdi-currency-usd</v-icon>
        </div>
        <div class="kpi-info">
          <span class="kpi-val">{{ fmt(totals.ventas_netas) }}</span>
          <span class="kpi-label">Ventas Netas</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:rgba(16,185,129,0.13)">
          <v-icon size="20" color="#10b981">mdi-cash</v-icon>
        </div>
        <div class="kpi-info">
          <span class="kpi-val">{{ fmt(totals.efectivo) }}</span>
          <span class="kpi-label">Efectivo</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:rgba(139,92,246,0.13)">
          <v-icon size="20" color="#8b5cf6">mdi-credit-card-outline</v-icon>
        </div>
        <div class="kpi-info">
          <span class="kpi-val">{{ fmt(totals.tarjetas) }}</span>
          <span class="kpi-label">Tarjetas</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:rgba(245,158,11,0.13)">
          <v-icon size="20" color="#f59e0b">mdi-cash-refund</v-icon>
        </div>
        <div class="kpi-info">
          <span class="kpi-val">{{ fmt(totals.comisiones) }}</span>
          <span class="kpi-label">Comisiones</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:rgba(239,68,68,0.13)">
          <v-icon size="20" color="#ef4444">mdi-arrow-u-left-top</v-icon>
        </div>
        <div class="kpi-info">
          <span class="kpi-val">{{ fmt(totals.devoluciones) }}</span>
          <span class="kpi-label">Devoluciones</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:rgba(100,116,139,0.13)">
          <v-icon size="20" color="#64748b">mdi-table-row</v-icon>
        </div>
        <div class="kpi-info">
          <span class="kpi-val">{{ rows.length }}</span>
          <span class="kpi-label">Registros</span>
        </div>
      </div>
    </div>

    <!-- TABLA -->
    <div v-if="rows.length > 0" class="table-wrap">
      <table class="vp-table">
        <thead>
          <tr>
            <th>FECHA</th>
            <th class="col-num">BRUTAS</th>
            <th class="col-num">DEVOL.</th>
            <th class="col-num">DESC.</th>
            <th class="col-num">NETAS</th>
            <th class="col-num">IMPUESTOS</th>
            <th class="col-num">PROPINAS</th>
            <th class="col-num">COMISIONES</th>
            <th class="col-num">TARJETAS</th>
            <th class="col-num">EFECTIVO</th>
            <th class="col-num">OTROS</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in rows" :key="i" class="tr-data">
            <td class="td-fecha">{{ fmtFecha(r.fecha) }}</td>
            <td class="col-num">{{ fmt(r.ventas_brutas) }}</td>
            <td class="col-num td-red">{{ fmt(r.devoluciones) }}</td>
            <td class="col-num td-dim">{{ fmt(r.descuentos) }}</td>
            <td class="col-num td-bold">{{ fmt(r.ventas_netas) }}</td>
            <td class="col-num td-dim">{{ fmt(r.impuestos) }}</td>
            <td class="col-num td-dim">{{ fmt(r.propinas) }}</td>
            <td class="col-num td-dim">{{ fmt(r.comisiones) }}</td>
            <td class="col-num">{{ fmt(r.tarjetas) }}</td>
            <td class="col-num td-green">{{ fmt(r.efectivo) }}</td>
            <td class="col-num td-dim">{{ fmt(r.otros) }}</td>
          </tr>
        </tbody>
        <!-- Fila de totales -->
        <tfoot>
          <tr class="tr-total">
            <td colspan="1">TOTALES</td>
            <td class="col-num">{{ fmt(totals.ventas_brutas) }}</td>
            <td class="col-num td-red">{{ fmt(totals.devoluciones) }}</td>
            <td class="col-num">{{ fmt(totals.descuentos) }}</td>
            <td class="col-num td-bold">{{ fmt(totals.ventas_netas) }}</td>
            <td class="col-num">{{ fmt(totals.impuestos) }}</td>
            <td class="col-num">{{ fmt(totals.propinas) }}</td>
            <td class="col-num">{{ fmt(totals.comisiones) }}</td>
            <td class="col-num">{{ fmt(totals.tarjetas) }}</td>
            <td class="col-num td-green">{{ fmt(totals.efectivo) }}</td>
            <td class="col-num">{{ fmt(totals.otros) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- ESTADO VACÍO -->
    <div v-else-if="!loading && consultado" class="empty-state">
      <v-icon size="52" color="rgba(var(--v-theme-on-surface),0.15)">mdi-chart-bar</v-icon>
      <p>No hay registros de ventas para el período y filtros seleccionados</p>
    </div>

  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatFecha } from '../../utils/formatters'

const authStore = useAuthStore()

function getEmpresa() {
  return authStore.empresaCodigo
    || authStore.empresa
    || localStorage.getItem('empresaActual')
    || ''
}

const empresa = computed(() => getEmpresa())

// ── Fechas por defecto: mes actual ──────────────────────────────
function primerDiaMes() {
  const hoy = new Date()
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10)
}
function ultimoDiaMes() {
  const hoy = new Date()
  return new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10)
}

const fechaInicio          = ref(primerDiaMes())
const fechaFin             = ref(ultimoDiaMes())
const ccostosSeleccionados = ref([])
const ccostos              = ref([])
const ccostosLoading       = ref(false)
const rows                 = ref([])
const totals               = ref({ ventas_brutas:0, devoluciones:0, descuentos:0, ventas_netas:0,
                                   impuestos:0, propinas:0, comisiones:0, tarjetas:0, efectivo:0, otros:0 })
const loading              = ref(false)
const error                = ref('')
const consultado           = ref(false)

// ── Multi-select helpers ────────────────────────────────────────
const todosSeleccionados = computed(() => ccostosSeleccionados.value.length === ccostos.value.length && ccostos.value.length > 0)
const algunoSeleccionado = computed(() => ccostosSeleccionados.value.length > 0)

function toggleTodosCcostos() {
  if (todosSeleccionados.value) {
    ccostosSeleccionados.value = []
  } else {
    ccostosSeleccionados.value = ccostos.value.map(c => c.codigo)
  }
}

const ccostoLabel = computed(() => {
  if (!ccostosSeleccionados.value.length) return 'Todos los centros'
  if (todosSeleccionados.value) return 'Todos los centros'
  return ccostosSeleccionados.value
    .map(cod => ccostos.value.find(c => c.codigo === cod)?.nombre || cod)
    .join(', ')
})

// ── Cargar ccostos ──────────────────────────────────────────────
async function fetchCcostos() {
  const emp = getEmpresa()
  if (!emp) {
    console.warn('[ventas-periodo] fetchCcostos: empresa vacía')
    return
  }
  ccostosLoading.value = true
  try {
    const r = await api.get('/ccostos', { params: { empresa: emp } })
    console.log('[ventas-periodo] ccostos response:', r.data)
    const data = r.data?.data ?? r.data
    ccostos.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('[ventas-periodo] fetchCcostos error:', e)
  } finally {
    ccostosLoading.value = false
  }
}

// ── Consultar ───────────────────────────────────────────────────
async function consultar() {
  const emp = getEmpresa()
  if (!emp) { error.value = 'No se pudo determinar la empresa.'; return }
  loading.value  = true
  error.value    = ''
  rows.value     = []
  consultado.value = true
  try {
    const params = {
      empresa:     emp,
      fechaInicio: fechaInicio.value,
      fechaFin:    fechaFin.value,
    }
    if (ccostosSeleccionados.value.length > 0 && !todosSeleccionados.value) {
      params.ccostos = ccostosSeleccionados.value.join(',')
    }
    const r = await api.get('/tesoreria/ventas-periodo', { params })
    if (!r.data?.success) throw new Error(r.data?.error || 'Error al consultar')
    rows.value   = r.data.data   || []
    totals.value = r.data.totals || { ventas_brutas:0, devoluciones:0, descuentos:0, ventas_netas:0,
                                      impuestos:0, propinas:0, comisiones:0, tarjetas:0, efectivo:0, otros:0 }
  } catch (e) {
    error.value = e?.response?.data?.error || e.message || 'Error al consultar'
  } finally {
    loading.value = false
  }
}

// ── Formatters ──────────────────────────────────────────────────
function fmt(n) {
  const v = parseFloat(n) || 0
  return v.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtFecha(f) {
  if (!f) return ''
  const s = String(f).slice(0, 10)   // toma solo "YYYY-MM-DD" sin timezone
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

// ── PDF ─────────────────────────────────────────────────────────
const generandoPdf = ref(false)

function fmtFechaCorta(f) {
  if (!f) return ''
  const s = String(f).slice(0, 10)
  const [y, m, d] = s.split('-')
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${d} ${meses[parseInt(m) - 1]} ${y}`
}

function exportarPDF() {
  if (!rows.value.length) return
  generandoPdf.value = true
  try {
    const doc  = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
    const PW   = doc.internal.pageSize.getWidth()
    const PH   = doc.internal.pageSize.getHeight()
    const ML   = 10
    const hoy  = new Date().toLocaleDateString('es-CO', { day:'2-digit', month:'2-digit', year:'numeric' })

    const ccostoLabelPDF = ccostoLabel.value

    // ── Header ──────────────────────────────────────────────────
    doc.setFillColor(6, 182, 212)
    doc.rect(0, 0, PW, 18, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('VENTAS POR PERÍODO', ML, 8)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Período: ${fmtFechaCorta(fechaInicio.value)} — ${fmtFechaCorta(fechaFin.value)}   ·   C. Costo: ${ccostoLabelPDF}`,
      ML, 14
    )
    doc.text(`Impreso: ${hoy}`, PW - ML, 14, { align: 'right' })
    doc.setTextColor(0, 0, 0)

    // ── KPI resumen ─────────────────────────────────────────────
    autoTable(doc, {
      startY: 21,
      head: [['Ventas Netas', 'Efectivo', 'Tarjetas', 'Otros', 'Comisiones', 'Devoluciones', 'Registros']],
      body: [[
        fmt(totals.value.ventas_netas),
        fmt(totals.value.efectivo),
        fmt(totals.value.tarjetas),
        fmt(totals.value.otros),
        fmt(totals.value.comisiones),
        fmt(totals.value.devoluciones),
        String(rows.value.length)
      ]],
      styles: { fontSize: 8, halign: 'right', fontStyle: 'bold', cellPadding: 1.5 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 7, halign: 'center', cellPadding: 1.5 },
      theme: 'grid',
      margin: { left: ML, right: ML }
    })

    // ── Tabla principal ──────────────────────────────────────────
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 3,
      head: [['Fecha', 'Brutas', 'Devol.', 'Desc.', 'Netas', 'Impuestos', 'Propinas', 'Comisiones', 'Tarjetas', 'Efectivo', 'Otros']],
      body: rows.value.map(r => [
        fmtFechaCorta(r.fecha),
        fmt(r.ventas_brutas),
        fmt(r.devoluciones),
        fmt(r.descuentos),
        fmt(r.ventas_netas),
        fmt(r.impuestos),
        fmt(r.propinas),
        fmt(r.comisiones),
        fmt(r.tarjetas),
        fmt(r.efectivo),
        fmt(r.otros)
      ]),
      foot: [[
        'TOTALES',
        fmt(totals.value.ventas_brutas),
        fmt(totals.value.devoluciones),
        fmt(totals.value.descuentos),
        fmt(totals.value.ventas_netas),
        fmt(totals.value.impuestos),
        fmt(totals.value.propinas),
        fmt(totals.value.comisiones),
        fmt(totals.value.tarjetas),
        fmt(totals.value.efectivo),
        fmt(totals.value.otros)
      ]],
      styles: { fontSize: 7, cellPadding: 1.2 },
      headStyles: { fillColor: [6, 182, 212], textColor: 255, fontStyle: 'bold', fontSize: 6.5, cellPadding: 1.5 },
      footStyles: { fillColor: [241, 245, 249], textColor: 15, fontStyle: 'bold', cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 24 },
        1:  { halign: 'right' },
        2:  { halign: 'right' },
        3:  { halign: 'right' },
        4:  { halign: 'right', fontStyle: 'bold' },
        5:  { halign: 'right' },
        6:  { halign: 'right' },
        7:  { halign: 'right' },
        8:  { halign: 'right' },
        9:  { halign: 'right' },
        10: { halign: 'right' }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      theme: 'striped',
      margin: { left: ML, right: ML },
      didDrawCell: (data) => {
        if (data.section === 'foot' && data.column.index >= 1) {
          data.cell.styles.halign = 'right'
        }
      },
      didDrawPage: (data) => {
        // Número de página
        doc.setFontSize(7)
        doc.setTextColor(150)
        doc.text(`Página ${data.pageNumber}`, PW - ML, PH - 5, { align: 'right' })
        doc.setTextColor(0, 0, 0)
      }
    })

    // Abrir en nueva pestaña
    const blob = doc.output('blob')
    const url  = URL.createObjectURL(blob)
    window.open(url, '_blank')
  } finally {
    generandoPdf.value = false
  }
}

onMounted(() => {
  fetchCcostos()
})
</script>

<style scoped>
/* ── Layout ───────────────────────────────────────────────────── */
.breadcrumb-bar {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.45);
  letter-spacing: 0.5px; margin-bottom: 16px;
}
.bc-root   { color: #06b6d4; }
.bc-sep    { color: rgba(var(--v-theme-on-surface), 0.25) !important; }
.bc-item   { color: rgba(var(--v-theme-on-surface), 0.7); }

.page-header {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; margin-bottom: 20px;
}
.header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.header-left {
  display: flex; align-items: center; gap: 14px;
}
.header-icon {
  width: 48px; height: 48px; border-radius: 14px;
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.page-title {
  font-size: 18px; font-weight: 800;
  color: rgb(var(--v-theme-on-surface)); margin: 0;
  letter-spacing: 0.5px;
}
.page-sub {
  font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.5);
  margin: 2px 0 0;
}

/* ── Filtros ──────────────────────────────────────────────────── */
.filters-panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 14px; padding: 18px 20px 14px;
  margin-bottom: 20px;
}
.filters-grid {
  display: flex; flex-wrap: wrap; gap: 20px;
  align-items: flex-end;
}
.filter-group { display: flex; flex-direction: column; gap: 6px; }
.filter-label {
  display: flex; align-items: center; gap: 5px;
  font-size: 10.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.5);
}
.dates-group .dates-row {
  display: flex; align-items: center; gap: 8px;
}
.date-input {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.15);
  border-radius: 8px; padding: 7px 10px;
  font-size: 13px; background: rgba(var(--v-theme-on-surface), 0.04);
  color: rgb(var(--v-theme-on-surface));
  outline: none; transition: border-color .2s;
}
.date-input:focus { border-color: #06b6d4; }
.filter-select-v { min-width: 220px; }
.filters-footer { margin-top: 14px; display: flex; justify-content: flex-end; }
.btn-consultar {
  display: flex; align-items: center; gap: 6px;
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  color: white; border: none; border-radius: 8px;
  padding: 9px 20px; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: opacity .2s;
}
.btn-consultar:hover { opacity: .88; }
.btn-consultar:disabled { opacity: .5; cursor: not-allowed; }

/* ── Error ────────────────────────────────────────────────────── */
.error-banner {
  display: flex; align-items: center; gap: 8px;
  background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
  border-radius: 10px; padding: 12px 16px;
  font-size: 13px; color: #ef4444; margin-bottom: 16px;
}

/* ── KPIs ─────────────────────────────────────────────────────── */
.kpi-row {
  display: flex; flex-wrap: wrap; gap: 12px;
  margin-bottom: 20px;
}
.kpi-card {
  flex: 1; min-width: 140px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px; padding: 14px 16px;
  display: flex; align-items: center; gap: 12px;
}
.kpi-icon {
  width: 38px; height: 38px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.kpi-info { display: flex; flex-direction: column; gap: 2px; }
.kpi-val {
  font-size: 16px; font-weight: 800;
  font-family: 'Courier New', monospace;
  color: rgb(var(--v-theme-on-surface));
}
.kpi-label {
  font-size: 10px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.45);
}

/* ── Tabla ────────────────────────────────────────────────────── */
.table-wrap {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 14px; overflow-x: auto;
}
.vp-table {
  width: 100%; border-collapse: collapse;
  font-size: 12.5px; table-layout: auto;
}
.vp-table thead th {
  padding: 11px 12px;
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.45);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  white-space: nowrap; text-align: left;
}
.vp-table thead th.col-num { text-align: right; }
.tr-data td {
  padding: 9px 12px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
}
.tr-data:last-child td { border-bottom: none; }
.tr-data:hover td { background: rgba(var(--v-theme-on-surface), 0.025); }
.col-num { text-align: right !important; font-family: 'Courier New', monospace; }
.td-fecha { font-weight: 600; white-space: nowrap; }
.td-bold  { font-weight: 700; color: #06b6d4; }
.td-green { color: #10b981; font-weight: 600; }
.td-red   { color: #ef4444; }
.td-dim   { color: rgba(var(--v-theme-on-surface), 0.5); }
.badge-ccosto {
  display: inline-block;
  background: rgba(6,182,212,0.1); color: #06b6d4;
  border-radius: 4px; padding: 1px 6px;
  font-size: 10px; font-weight: 700; font-family: monospace;
  margin-right: 4px;
}
/* Fila de totales */
.tr-total td {
  padding: 10px 12px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  font-weight: 700; font-size: 12.5px;
  border-top: 2px solid rgba(var(--v-theme-on-surface), 0.12);
  white-space: nowrap;
}
.tr-total td.col-num { font-family: 'Courier New', monospace; text-align: right; }

/* ── Empty state ──────────────────────────────────────────────── */
.empty-state {
  text-align: center; padding: 60px 20px;
  color: rgba(var(--v-theme-on-surface), 0.35);
  font-size: 14px;
}
.empty-state p { margin-top: 12px; }
</style>
