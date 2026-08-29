<template>
  <MainLayout>
    <div class="rm-wrap">

      <PageHeader
        title="Movimiento por Cuentas"
        description="Ingresos y egresos de una cuenta en un período determinado"
        :crumbs="['Tesorería', 'Reportes', 'Movimiento por Cuentas']"
      >
        <template #actions>
          <v-btn
            v-if="datos"
            color="error"
            variant="flat"
            prepend-icon="mdi-file-pdf-box"
            size="small"
            @click="exportarPDF"
            :loading="generandoPDF"
          >Exportar PDF</v-btn>
        </template>
      </PageHeader>

      <!-- PANEL FILTROS -->
      <div class="rm-filtros-panel">
        <!-- Cuenta bancaria -->
        <div class="filtro-group filtro-cuenta">
          <div class="filtro-icon-wrap">
            <v-icon size="18" color="primary">mdi-bank-outline</v-icon>
          </div>
          <div class="filtro-content">
            <label class="filtro-label">Cuenta Bancaria</label>
            <select v-model="bancoSeleccionado" class="rm-select" @change="onFiltroChange">
              <option value="">— Seleccione una cuenta —</option>
              <option v-for="c in cuentas" :key="c.codigo" :value="c.codigo">
                {{ c.nombre_cta }}
              </option>
            </select>
          </div>
        </div>

        <!-- Separador -->
        <div class="filtro-sep"></div>

        <!-- Fecha inicio -->
        <div class="filtro-group filtro-fecha">
          <div class="filtro-icon-wrap">
            <v-icon size="18" color="primary">mdi-calendar-start</v-icon>
          </div>
          <div class="filtro-content">
            <label class="filtro-label">Desde</label>
            <CampoFecha v-model="fechaInicio" class="rm-date" @change="onFiltroChange" />
          </div>
        </div>

        <!-- Fecha fin -->
        <div class="filtro-group filtro-fecha">
          <div class="filtro-icon-wrap">
            <v-icon size="18" color="primary">mdi-calendar-end</v-icon>
          </div>
          <div class="filtro-content">
            <label class="filtro-label">Hasta</label>
            <CampoFecha v-model="fechaFin" class="rm-date" @change="onFiltroChange" />
          </div>
        </div>

        <!-- Botón -->
        <div class="filtro-btn-wrap">
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-magnify"
            size="small"
            rounded="lg"
            :disabled="!bancoSeleccionado"
            @click="cargarDatos"
            :loading="cargando"
          >Ver Reporte</v-btn>
        </div>

        <!-- Badge cuenta seleccionada -->
        <div v-if="cuentaNombre" class="rm-cuenta-badge">
          <v-icon size="14" color="success">mdi-check-circle</v-icon>
          {{ cuentaNombre }}
        </div>
      </div>

      <!-- ESTADO INICIAL -->
      <div v-if="!bancoSeleccionado && !cargando" class="rm-estado-inicial">
        <div class="estado-inicial-inner">
          <div class="estado-inicial-icon">
            <v-icon size="52" color="primary">mdi-chart-timeline-variant</v-icon>
          </div>
          <h3 class="estado-inicial-title">Selecciona una Cuenta y Período</h3>
          <p class="estado-inicial-sub">Elige la cuenta bancaria y el rango de fechas para ver el detalle de movimientos del período.</p>
        </div>
      </div>

      <!-- ERROR -->
      <div v-else-if="errorMsg && !cargando" class="rm-error-panel">
        <v-icon size="24" color="error">mdi-alert-circle-outline</v-icon>
        <div>
          <div class="error-title">Error al cargar el reporte</div>
          <div class="error-detail">{{ errorMsg }}</div>
        </div>
        <v-btn size="x-small" variant="text" color="error" @click="cargarDatos">Reintentar</v-btn>
      </div>

      <!-- LOADING -->
      <div v-else-if="cargando" class="rm-loading">
        <v-progress-circular indeterminate color="primary" size="40" width="3" />
        <div>
          <div class="loading-title">Cargando movimientos...</div>
          <div class="loading-sub">{{ cuentaNombre }} · {{ fmtFechaCorta(fechaInicio) }} — {{ fmtFechaCorta(fechaFin) }}</div>
        </div>
      </div>

      <!-- CONTENIDO PRINCIPAL -->
      <div v-else-if="bancoSeleccionado && datosReady" class="rm-contenido">

        <!-- KPI CARDS -->
        <div class="rm-kpis">

          <!-- 1. Saldo Anterior (antes del período) -->
          <div class="kpi-card" :class="datos.saldoAnterior >= 0 ? 'kpi-saldo-pos' : 'kpi-saldo-neg'">
            <div class="kpi-deco"></div>
            <div class="kpi-inner">
              <div class="kpi-top">
                <div class="kpi-icon-wrap" :class="datos.saldoAnterior >= 0 ? 'kpi-icon-blue' : 'kpi-icon-orange'">
                  <v-icon size="20" color="white">mdi-bank-outline</v-icon>
                </div>
                <span class="kpi-badge" :class="datos.saldoAnterior >= 0 ? 'kpi-badge-blue' : 'kpi-badge-orange'">
                  <v-icon size="11">mdi-history</v-icon> SALDO ANTERIOR
                </span>
              </div>
              <div class="kpi-value" :class="datos.saldoAnterior >= 0 ? 'kpi-val-blue' : 'kpi-val-orange'">{{ fmt(datos.saldoAnterior) }}</div>
              <div class="kpi-label">Antes del período</div>
              <div class="kpi-sub">Hasta {{ fmtFechaCorta(fechaInicio) }}</div>
            </div>
          </div>

          <!-- 2. Ingresos -->
          <div class="kpi-card kpi-ingresos">
            <div class="kpi-deco"></div>
            <div class="kpi-inner">
              <div class="kpi-top">
                <div class="kpi-icon-wrap kpi-icon-green">
                  <v-icon size="20" color="white">mdi-arrow-down-bold-circle</v-icon>
                </div>
                <span class="kpi-badge kpi-badge-green">
                  <v-icon size="11">mdi-trending-up</v-icon> INGRESOS
                </span>
              </div>
              <div class="kpi-value kpi-val-green">{{ fmt(datos.totalIngresos) }}</div>
              <div class="kpi-label">Total Ingresos</div>
              <div class="kpi-sub">{{ countIngresos }} movimiento{{ countIngresos !== 1 ? 's' : '' }}</div>
            </div>
          </div>

          <!-- 3. Egresos -->
          <div class="kpi-card kpi-egresos">
            <div class="kpi-deco"></div>
            <div class="kpi-inner">
              <div class="kpi-top">
                <div class="kpi-icon-wrap kpi-icon-red">
                  <v-icon size="20" color="white">mdi-arrow-up-bold-circle</v-icon>
                </div>
                <span class="kpi-badge kpi-badge-red">
                  <v-icon size="11">mdi-trending-down</v-icon> EGRESOS
                </span>
              </div>
              <div class="kpi-value kpi-val-red">{{ fmt(datos.totalEgresos) }}</div>
              <div class="kpi-label">Total Egresos</div>
              <div class="kpi-sub">{{ countEgresos }} movimiento{{ countEgresos !== 1 ? 's' : '' }}</div>
            </div>
          </div>

          <!-- 4. Saldo Final = anterior + ingresos - egresos -->
          <div class="kpi-card" :class="(datos.saldoAnterior + datos.saldoNeto) >= 0 ? 'kpi-saldo-pos' : 'kpi-saldo-neg'">
            <div class="kpi-deco"></div>
            <div class="kpi-inner">
              <div class="kpi-top">
                <div class="kpi-icon-wrap" :class="(datos.saldoAnterior + datos.saldoNeto) >= 0 ? 'kpi-icon-blue' : 'kpi-icon-orange'">
                  <v-icon size="20" color="white">{{ (datos.saldoAnterior + datos.saldoNeto) >= 0 ? 'mdi-scale-balance' : 'mdi-alert-outline' }}</v-icon>
                </div>
                <span class="kpi-badge" :class="(datos.saldoAnterior + datos.saldoNeto) >= 0 ? 'kpi-badge-blue' : 'kpi-badge-orange'">
                  <v-icon size="11">mdi-calculator</v-icon> SALDO FINAL
                </span>
              </div>
              <div class="kpi-value" :class="(datos.saldoAnterior + datos.saldoNeto) >= 0 ? 'kpi-val-blue' : 'kpi-val-orange'">{{ fmt(datos.saldoAnterior + datos.saldoNeto) }}</div>
              <div class="kpi-label">Saldo Final</div>
              <div class="kpi-sub">Anterior + Ing − Egr</div>
            </div>
          </div>

        </div>

        <!-- BARRA RESUMEN OSCURA — solo cuenta y período -->
        <div class="rm-resumen-bar">
          <div class="resumen-item">
            <div class="resumen-label">Cuenta</div>
            <div class="resumen-value resumen-white">{{ cuentaNombre }}</div>
          </div>
          <div class="resumen-sep"></div>
          <div class="resumen-item">
            <div class="resumen-label">Período</div>
            <div class="resumen-value resumen-white">{{ fmtFechaCorta(fechaInicio) }} — {{ fmtFechaCorta(fechaFin) }}</div>
          </div>
        </div>

        <!-- TABLA -->
        <div class="rm-table-card">

          <div class="rm-table-header">
            <div class="rm-table-title-group">
              <div class="rm-table-icon">
                <v-icon size="16" color="primary">mdi-table-arrow-right</v-icon>
              </div>
              <div>
                <div class="rm-table-title">Detalle de Movimientos</div>
                <div class="rm-table-sub">{{ cuentaNombre }} · {{ fmtFechaCorta(fechaInicio) }} al {{ fmtFechaCorta(fechaFin) }}</div>
              </div>
            </div>
            <div class="rm-table-chips">
              <div v-if="countIngresos > 0" class="chip chip-green">
                <v-icon size="11">mdi-arrow-down</v-icon> {{ countIngresos }} Ing.
              </div>
              <div v-if="countEgresos > 0" class="chip chip-red">
                <v-icon size="11">mdi-arrow-up</v-icon> {{ countEgresos }} Egr.
              </div>
              <div class="chip chip-gray">{{ datos.cantidadMovimientos }} total</div>
            </div>
          </div>

          <!-- Sin movimientos -->
          <div v-if="datos.movimientos.length === 0" class="rm-empty">
            <div class="empty-circle">
              <v-icon size="40" color="#94a3b8">mdi-calendar-remove-outline</v-icon>
            </div>
            <div class="empty-title">Sin movimientos en este período</div>
            <div class="empty-sub">No se encontraron registros para la cuenta y el rango de fechas seleccionado.</div>
          </div>

          <!-- Tabla -->
          <div v-else class="rm-tabla-wrap">
            <table class="rm-tabla">
              <thead>
                <tr>
                  <th style="width:105px">FECHA</th>
                  <th>BENEFICIARIO</th>
                  <th>CONCEPTO</th>
                  <th class="col-right" style="width:150px">INGRESO</th>
                  <th class="col-right" style="width:150px">EGRESO</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(mov, idx) in datos.movimientos"
                  :key="mov.numero || idx"
                  :class="idx % 2 === 0 ? 'tr-even' : 'tr-odd'"
                >
                  <td class="td-fecha">{{ fmtFecha(mov.fecha) }}</td>
                  <td class="td-beneficiario">{{ mov.beneficiario || '—' }}</td>
                  <td class="td-concepto">{{ mov.concepto || '—' }}</td>
                  <td class="td-monto col-right">
                    <span v-if="Number(mov.ingreso) > 0" class="monto-ing">{{ fmt(mov.ingreso) }}</span>
                    <span v-else class="monto-dash">—</span>
                  </td>
                  <td class="td-monto col-right">
                    <span v-if="Number(mov.egreso) > 0" class="monto-egr">{{ fmt(mov.egreso) }}</span>
                    <span v-else class="monto-dash">—</span>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="tr-foot">
                  <td colspan="3" class="foot-label">TOTALES DEL PERÍODO</td>
                  <td class="col-right foot-monto monto-ing">{{ fmt(datos.totalIngresos) }}</td>
                  <td class="col-right foot-monto monto-egr">{{ fmt(datos.totalEgresos) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>

      </div><!-- /rm-contenido -->

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatFecha } from '../../utils/formatters'
import { alignReportCell, detailTableOptions, drawReportFooter, drawReportHeader, summaryTableOptions } from '../../utils/pdfReportStyle'

const authStore = useAuthStore()

const cuentas           = ref([])
const bancoSeleccionado = ref('')
const fechaInicio       = ref(primerDiaMes())
const fechaFin          = ref(hoy())
const datos             = ref(null)
const cargando          = ref(false)
const errorMsg          = ref('')
const generandoPDF      = ref(false)

// ─── Helpers de fecha ────────────────────────────────────────
function primerDiaMes() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
function hoy() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Helpers generales ───────────────────────────────────────
function getEmpresa() {
  return authStore.empresa
    || authStore.user?.empresa
    || localStorage.getItem('empresaActual')
    || localStorage.getItem('empresa')
    || ''
}

const cuentaNombre = computed(() => {
  if (!bancoSeleccionado.value) return ''
  const c = cuentas.value.find(x => String(x.codigo) === String(bancoSeleccionado.value))
  return c?.nombre_cta || ''
})

const datosReady    = computed(() => datos.value !== null)
const countIngresos = computed(() => (datos.value?.movimientos || []).filter(m => Number(m.ingreso) > 0).length)
const countEgresos  = computed(() => (datos.value?.movimientos || []).filter(m => Number(m.egreso)  > 0).length)

function fmt(val) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP',
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(parseFloat(val || 0))
}

function fmtFecha(f) {
  if (!f) return '—'
  try {
    // Parsear sin conversión de zona horaria — new Date('YYYY-MM-DD') interpreta UTC y
    // en zonas negativas (ej. UTC-5) retrocede al día anterior
    const s = String(f).split('T')[0]
    const [y, m, d] = s.split('-')
    return `${m}/${d}/${y}`
  } catch { return String(f) }
}

function fmtFechaCorta(f) {
  if (!f) return ''
  try {
    const [y, m, d] = f.split('-')
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    return `${d} ${meses[parseInt(m) - 1]} ${y}`
  } catch { return f }
}

// ─── API ─────────────────────────────────────────────────────
async function cargarCuentas() {
  try {
    const res = await api.get('/contabilidad/cuentas-bancarias', {
      params: { empresa: getEmpresa(), estado: 'ACTIVA' }
    })
    cuentas.value = res.data?.data || res.data || []
  } catch (e) {
    console.error('Error cuentas:', e)
  }
}

async function cargarDatos() {
  if (!bancoSeleccionado.value) return
  errorMsg.value = ''
  datos.value = null
  cargando.value = true

  const empresa = getEmpresa()
  console.log('[MovCuentas] banco:', bancoSeleccionado.value, '| empresa:', empresa, '| periodo:', fechaInicio.value, '-', fechaFin.value)

  try {
    const res = await api.get('/tesoreria/movimientos-cuenta', {
      params: { banco: bancoSeleccionado.value, empresa, fechaInicio: fechaInicio.value, fechaFin: fechaFin.value }
    })
    if (res.data?.success) {
      datos.value = res.data.data
    } else {
      errorMsg.value = res.data?.error || 'Error desconocido del servidor'
    }
  } catch (e) {
    errorMsg.value = e?.response?.data?.error || e?.message || 'No se pudo conectar con el servidor'
  } finally {
    cargando.value = false
  }
}

function onFiltroChange() {
  errorMsg.value = ''
  datos.value = null
  if (bancoSeleccionado.value) cargarDatos()
}

onMounted(cargarCuentas)

// ─── PDF ─────────────────────────────────────────────────────

function exportarPDF() {
  if (!datos.value) return
  generandoPDF.value = true
  try {
    const nombreCuenta = cuentaNombre.value || bancoSeleccionado.value
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const ML = 14
    const startY = drawReportHeader(doc, {
      title: 'MOVIMIENTO POR CUENTAS',
      subtitle: `Cuenta: ${nombreCuenta} | Periodo: ${fmtFechaCorta(fechaInicio.value)} - ${fmtFechaCorta(fechaFin.value)}`,
      empresa: authStore.empresaNombre || getEmpresa(),
      usuario: authStore.userName || authStore.userNombre,
      margin: ML,
    })
    autoTable(doc, { startY, head: [['Total Ingresos', 'Total Egresos', 'Saldo Neto', 'Movimientos']], body: [[fmt(datos.value.totalIngresos), fmt(datos.value.totalEgresos), fmt(datos.value.saldoNeto), String(datos.value.cantidadMovimientos)]], ...summaryTableOptions(ML) })
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 6,
      head: [['Fecha', 'Beneficiario', 'Concepto', 'Ingreso', 'Egreso']],
      body: datos.value.movimientos.map(m => [fmtFecha(m.fecha), m.beneficiario || '-', m.concepto || '', Number(m.ingreso) > 0 ? fmt(m.ingreso) : '-', Number(m.egreso) > 0 ? fmt(m.egreso) : '-']),
      foot: [['', '', 'TOTALES', fmt(datos.value.totalIngresos), fmt(datos.value.totalEgresos)]],
      ...detailTableOptions(ML),
      columnStyles: { 0: { cellWidth: 24 }, 1: { cellWidth: 36 }, 3: { halign: 'right', cellWidth: 34 }, 4: { halign: 'right', cellWidth: 34 } },
      didParseCell: (data) => alignReportCell(data, { 0: 'left', 1: 'left', 2: 'left', 3: 'right', 4: 'right' }),
      didDrawPage: (data) => drawReportFooter(doc, { pageNumber: data.pageNumber, margin: ML }),
    })
    doc.save(`movimientos-${nombreCuenta.replace(/\s+/g, '-')}-${fechaInicio.value}-${fechaFin.value}.pdf`)
  } finally {
    generandoPDF.value = false
  }
}
</script>

<style scoped>
/* ── Wrapper ───────────────────────────────────────── */
.rm-wrap { padding: 24px; max-width: 1200px; margin: 0 auto; min-height: 100%; }

/* ── Breadcrumb ────────────────────────────────────── */
.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 11px; font-weight: 700; color: var(--indigo); text-transform: uppercase; letter-spacing: 0.5px; }
.bc-cat  { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.4); }
.bc-cur  { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.7); font-weight: 600; }

/* ── Header ────────────────────────────────────────── */
.rm-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }
.rm-header-left { display: flex; align-items: center; gap: 16px; }
.rm-icon-wrap {
  width: 52px; height: 52px; border-radius: 16px;
  background: linear-gradient(135deg, var(--indigo) 0%, var(--indigo) 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 20px rgba(139,92,246,0.38); flex-shrink: 0;
}
.rm-title { font-size: 21px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); letter-spacing: 0.4px; margin: 0; }
.rm-sub   { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.45); margin: 3px 0 0; }

/* ── Panel filtros ─────────────────────────────────── */
.rm-filtros-panel {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  border-radius: 14px; padding: 14px 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.filtro-group { display: flex; align-items: center; gap: 10px; }
.filtro-cuenta { flex: 1; min-width: 200px; }
.filtro-fecha  { min-width: 160px; }
.filtro-sep    { width: 1px; height: 36px; background: rgba(var(--v-theme-on-surface), 0.1); flex-shrink: 0; }
.filtro-icon-wrap {
  width: 34px; height: 34px; border-radius: 9px;
  background: rgba(6,182,212,0.09);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.filtro-content { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.filtro-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.5); }
.filtro-btn-wrap { flex-shrink: 0; }

.rm-select {
  width: 100%; max-width: 340px; height: 36px; padding: 0 10px;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.18);
  border-radius: 8px;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-surface));
  font-size: 13px; font-family: inherit; font-weight: 500;
  cursor: pointer; outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.rm-select:focus { border-color: var(--indigo); box-shadow: 0 0 0 3px rgba(6,182,212,0.15); }

.rm-date {
  height: 36px; padding: 0 10px;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.18);
  border-radius: 8px;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-surface));
  font-size: 13px; font-family: inherit;
  cursor: pointer; outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.rm-date:focus { border-color: var(--indigo); box-shadow: 0 0 0 3px rgba(139,92,246,0.15); }

.rm-cuenta-badge {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; color: var(--success);
  background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2);
  border-radius: 20px; padding: 3px 10px; white-space: nowrap;
}

/* ── Estado inicial ────────────────────────────────── */
.rm-estado-inicial { display: flex; align-items: center; justify-content: center; padding: 72px 24px; }
.estado-inicial-inner { text-align: center; max-width: 420px; }
.estado-inicial-icon {
  width: 90px; height: 90px; border-radius: 24px;
  background: rgba(139,92,246,0.08); border: 2px dashed rgba(139,92,246,0.3);
  display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;
}
.estado-inicial-title { font-size: 18px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); margin: 0 0 8px; }
.estado-inicial-sub   { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.45); line-height: 1.6; margin: 0; }

/* ── Error ─────────────────────────────────────────── */
.rm-error-panel {
  display: flex; align-items: flex-start; gap: 14px;
  background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.2);
  border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;
}
.error-title  { font-size: 13px; font-weight: 700; color: var(--error); }
.error-detail { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.6); margin-top: 2px; }

/* ── Loading ───────────────────────────────────────── */
.rm-loading { display: flex; align-items: center; gap: 20px; padding: 60px 0; justify-content: center; }
.loading-title { font-size: 14px; font-weight: 600; color: rgb(var(--v-theme-on-surface)); }
.loading-sub   { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.45); margin-top: 3px; }

/* ── Contenido ─────────────────────────────────────── */
.rm-contenido { display: flex; flex-direction: column; gap: 20px; }

/* ── KPI Cards ─────────────────────────────────────── */
.rm-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
@media (max-width: 960px) { .rm-kpis { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .rm-kpis { grid-template-columns: 1fr; } }

.kpi-card {
  border-radius: 14px; background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  position: relative; overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: box-shadow 0.2s, transform 0.2s;
}
.kpi-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.09); transform: translateY(-2px); }

.kpi-deco { position: absolute; top: 0; right: 0; width: 80px; height: 80px; border-radius: 0 14px 0 80px; opacity: 0.07; }
.kpi-ingresos  .kpi-deco { background: var(--success); }
.kpi-egresos   .kpi-deco { background: var(--error); }
.kpi-saldo-pos .kpi-deco { background: #3b82f6; }
.kpi-saldo-neg .kpi-deco { background: var(--gold); }
.kpi-total     .kpi-deco { background: var(--indigo); }

.kpi-inner { padding: 18px 18px 14px; }
.kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }

.kpi-icon-wrap { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.kpi-icon-green  { background: linear-gradient(135deg,var(--success),var(--success)); }
.kpi-icon-red    { background: linear-gradient(135deg,var(--error),var(--error)); }
.kpi-icon-blue   { background: linear-gradient(135deg,#3b82f6,#2563eb); }
.kpi-icon-orange { background: linear-gradient(135deg,var(--gold),var(--gold)); }
.kpi-icon-purple { background: linear-gradient(135deg,var(--indigo),var(--indigo)); }

.kpi-badge {
  font-size: 9.5px; font-weight: 700;
  display: flex; align-items: center; gap: 3px;
  border-radius: 20px; padding: 3px 8px;
  text-transform: uppercase; letter-spacing: 0.3px;
}
.kpi-badge-green  { background: rgba(16,185,129,0.1);  color: var(--success); }
.kpi-badge-red    { background: rgba(239,68,68,0.1);   color: var(--error); }
.kpi-badge-blue   { background: rgba(59,130,246,0.1);  color: #3b82f6; }
.kpi-badge-orange { background: rgba(245,158,11,0.1);  color: var(--gold); }
.kpi-badge-purple { background: rgba(139,92,246,0.1);  color: var(--indigo); }

.kpi-value  { font-size: 20px; font-weight: 800; line-height: 1; margin-bottom: 4px; font-variant-numeric: tabular-nums; }
.kpi-val-green  { color: var(--success); }
.kpi-val-red    { color: var(--error); }
.kpi-val-blue   { color: #3b82f6; }
.kpi-val-orange { color: var(--gold); }
.kpi-val-purple { color: var(--indigo); }

.kpi-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.5); margin-bottom: 4px; }
.kpi-sub   { font-size: 10.5px; color: rgba(var(--v-theme-on-surface), 0.4); }

/* ── Barra resumen oscura ──────────────────────────── */
.rm-resumen-bar {
  display: flex; align-items: center; gap: 0; flex-wrap: wrap;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 14px; padding: 16px 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.18);
}
.resumen-item { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 100px; padding: 0 12px; }
.resumen-result { border-left: 1px solid rgba(255,255,255,0.15); }
.resumen-sep { width: 1px; height: 36px; background: rgba(255,255,255,0.1); flex-shrink: 0; }
.resumen-op { flex-shrink: 0; width: 28px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.3); }
.resumen-label   { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255,255,255,0.4); }
.resumen-label-w { color: rgba(255,255,255,0.7); }
.resumen-value   { font-size: 14px; font-weight: 800; font-variant-numeric: tabular-nums; }
.resumen-white  { color: #fff; }
.resumen-green  { color: #34d399; }
.resumen-red    { color: #f87171; }
.resumen-blue   { color: #60a5fa; }
.resumen-orange { color: #fbbf24; }

/* ── Table Card ────────────────────────────────────── */
.rm-table-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 14px; overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.rm-table-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; flex-wrap: wrap; gap: 10px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07);
}
.rm-table-title-group { display: flex; align-items: center; gap: 12px; }
.rm-table-icon {
  width: 34px; height: 34px; border-radius: 9px;
  background: rgba(6,182,212,0.1);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.rm-table-title { font-size: 13px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); text-transform: uppercase; letter-spacing: 0.4px; }
.rm-table-sub   { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.45); margin-top: 2px; }
.rm-table-chips { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }

.chip { font-size: 10px; font-weight: 700; display: flex; align-items: center; gap: 3px; border-radius: 20px; padding: 3px 9px; text-transform: uppercase; letter-spacing: 0.3px; }
.chip-green { background: rgba(16,185,129,0.1);  color: var(--success); border: 1px solid rgba(16,185,129,0.2); }
.chip-red   { background: rgba(239,68,68,0.1);   color: var(--error); border: 1px solid rgba(239,68,68,0.2); }
.chip-gray  { background: rgba(var(--v-theme-on-surface),0.06); color: rgba(var(--v-theme-on-surface),0.5); border: 1px solid rgba(var(--v-theme-on-surface),0.1); }

/* ── Empty state ───────────────────────────────────── */
.rm-empty { text-align: center; padding: 56px 24px; }
.empty-circle {
  width: 80px; height: 80px; border-radius: 50%;
  background: rgba(var(--v-theme-on-surface),0.05);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px; border: 2px solid rgba(var(--v-theme-on-surface),0.1);
}
.empty-title { font-size: 16px; font-weight: 700; color: rgba(var(--v-theme-on-surface),0.6); margin-bottom: 6px; }
.empty-sub   { font-size: 12px; color: rgba(var(--v-theme-on-surface),0.4); }

/* ── Tabla ─────────────────────────────────────────── */
.rm-tabla-wrap { overflow-x: auto; }
.rm-tabla { width: 100%; border-collapse: collapse; font-size: 13px; }
.rm-tabla thead tr { background: rgba(var(--v-theme-on-surface),0.04); }
.rm-tabla thead th {
  padding: 11px 14px; text-align: left;
  font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
  text-transform: uppercase; color: rgba(var(--v-theme-on-surface),0.5);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.08); white-space: nowrap;
}
.rm-tabla tbody td { padding: 10px 14px; }
.rm-tabla tbody tr { border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.05); transition: background 0.12s; }
.rm-tabla tbody tr:hover { background: rgba(139,92,246,0.05) !important; }
.tr-even { background: rgb(var(--v-theme-surface)); }
.tr-odd  { background: rgba(var(--v-theme-on-surface),0.022); }

.col-right { text-align: right !important; }
.td-fecha        { font-size: 12px; color: rgba(var(--v-theme-on-surface),0.6); white-space: nowrap; }
.td-tipo         { }
.td-beneficiario { font-size: 12px; color: rgba(var(--v-theme-on-surface),0.7); font-weight: 500; }
.td-concepto     { color: rgb(var(--v-theme-on-surface)); }
.td-monto        { font-variant-numeric: tabular-nums; font-weight: 600; font-size: 12px; }

.tipo-ing { background: rgba(16,185,129,0.12); color: var(--success); padding: 3px 8px; border-radius: 4px; font-size: 10.5px; font-weight: 800; }
.tipo-egr { background: rgba(239,68,68,0.1);  color: var(--error); padding: 3px 8px; border-radius: 4px; font-size: 10.5px; font-weight: 800; }

.monto-ing  { color: var(--success); }
.monto-egr  { color: var(--error); }
.monto-dash { color: rgba(var(--v-theme-on-surface),0.2); }

/* ── Tfoot ─────────────────────────────────────────── */
.tr-foot { background: rgba(var(--v-theme-on-surface),0.05); border-top: 2px solid rgba(var(--v-theme-on-surface),0.1); }
.tr-foot td { padding: 11px 14px; }
.foot-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface),0.6); }
.foot-monto { font-size: 13px; font-weight: 800; font-variant-numeric: tabular-nums; }
</style>
