<template>
  <MainLayout>
    <div class="rc-wrap">

      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">TESORERÍA</span>
        <v-icon size="13" color="#06b6d4">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="13" color="#475569">mdi-chevron-right</v-icon>
        <span class="bc-cur">Conciliación Bancaria</span>
      </div>

      <!-- HEADER -->
      <div class="rc-header">
        <div class="rc-header-left">
          <div class="rc-icon-wrap">
            <v-icon size="26" color="white">mdi-bank-check</v-icon>
          </div>
          <div>
            <h1 class="rc-title">CONCILIACIÓN BANCARIA</h1>
            <p class="rc-sub">Seguimiento de movimientos pendientes de conciliar</p>
          </div>
        </div>
        <div class="rc-header-actions">
          <v-btn
            v-if="datos"
            color="#ef4444"
            variant="flat"
            prepend-icon="mdi-file-pdf-box"
            size="small"
            rounded="lg"
            @click="exportarPDF"
            :loading="generandoPDF"
            class="btn-pdf"
          >Exportar PDF</v-btn>
        </div>
      </div>

      <!-- PANEL SELECTOR -->
      <div class="rc-selector-panel">
        <div class="rc-selector-left">
          <div class="rc-selector-icon">
            <v-icon size="20" color="#06b6d4">mdi-bank-outline</v-icon>
          </div>
          <div class="rc-selector-content">
            <label class="rc-selector-label">Cuenta Bancaria</label>
            <select v-model="bancoSeleccionado" class="rc-select" @change="onCuentaChange">
              <option value="">— Seleccione una cuenta —</option>
              <option
                v-for="c in cuentas"
                :key="c.codigo"
                :value="c.codigo"
              >{{ c.nombre_cta }}</option>
            </select>
          </div>
        </div>
        <div class="rc-selector-right">
          <v-btn
            color="#06b6d4"
            variant="flat"
            prepend-icon="mdi-magnify"
            size="small"
            rounded="lg"
            :disabled="!bancoSeleccionado"
            @click="cargarDatos"
            :loading="cargando"
          >Ver Reporte</v-btn>
        </div>
        <!-- Cuenta seleccionada badge -->
        <div v-if="cuentaNombre" class="rc-cuenta-badge">
          <v-icon size="14" color="#10b981">mdi-check-circle</v-icon>
          {{ cuentaNombre }}
        </div>
      </div>

      <!-- ESTADO INICIAL -->
      <div v-if="!bancoSeleccionado && !cargando" class="rc-estado-inicial">
        <div class="estado-inicial-inner">
          <div class="estado-inicial-icon">
            <v-icon size="52" color="#06b6d4">mdi-bank-outline</v-icon>
          </div>
          <h3 class="estado-inicial-title">Selecciona una Cuenta Bancaria</h3>
          <p class="estado-inicial-sub">Elige una cuenta del selector de arriba para ver el reporte de conciliación con los movimientos pendientes.</p>
        </div>
      </div>

      <!-- ERROR -->
      <div v-else-if="errorMsg && !cargando" class="rc-error-panel">
        <v-icon size="24" color="#ef4444">mdi-alert-circle-outline</v-icon>
        <div>
          <div class="error-title">Error al cargar el reporte</div>
          <div class="error-detail">{{ errorMsg }}</div>
        </div>
        <v-btn size="x-small" variant="text" color="#ef4444" @click="cargarDatos">Reintentar</v-btn>
      </div>

      <!-- LOADING -->
      <div v-else-if="cargando" class="rc-loading">
        <v-progress-circular indeterminate color="#06b6d4" size="40" width="3" />
        <div>
          <div class="loading-title">Cargando reporte...</div>
          <div class="loading-sub">{{ cuentaNombre }}</div>
        </div>
      </div>

      <!-- CONTENIDO PRINCIPAL -->
      <div v-else-if="bancoSeleccionado && datosReady" class="rc-contenido">

        <!-- KPI CARDS -->
        <div class="rc-kpis">

          <div class="kpi-card kpi-conciliado">
            <div class="kpi-decoration"></div>
            <div class="kpi-inner">
              <div class="kpi-top">
                <div class="kpi-icon-wrap kpi-icon-blue">
                  <v-icon size="20" color="white">mdi-check-decagram</v-icon>
                </div>
                <span class="kpi-trend kpi-trend-blue">
                  <v-icon size="12">mdi-bank</v-icon> CONCILIADO
                </span>
              </div>
              <div class="kpi-value kpi-val-blue">{{ fmt(datos.saldoConciliado) }}</div>
              <div class="kpi-label">Saldo Conciliado</div>
              <div class="kpi-bar">
                <div class="kpi-bar-fill kpi-bar-blue" :style="{ width: porcentajeConciliado + '%' }"></div>
              </div>
            </div>
          </div>

          <div class="kpi-card kpi-ingresos">
            <div class="kpi-decoration"></div>
            <div class="kpi-inner">
              <div class="kpi-top">
                <div class="kpi-icon-wrap kpi-icon-green">
                  <v-icon size="20" color="white">mdi-arrow-down-bold-circle</v-icon>
                </div>
                <span class="kpi-trend kpi-trend-green">
                  <v-icon size="12">mdi-clock-outline</v-icon> PENDIENTE
                </span>
              </div>
              <div class="kpi-value kpi-val-green">{{ fmt(datos.totalIngresosPend) }}</div>
              <div class="kpi-label">Ingresos por Conciliar</div>
              <div class="kpi-sub-info">{{ countIngresos }} movimiento{{ countIngresos !== 1 ? 's' : '' }}</div>
            </div>
          </div>

          <div class="kpi-card kpi-egresos">
            <div class="kpi-decoration"></div>
            <div class="kpi-inner">
              <div class="kpi-top">
                <div class="kpi-icon-wrap kpi-icon-red">
                  <v-icon size="20" color="white">mdi-arrow-up-bold-circle</v-icon>
                </div>
                <span class="kpi-trend kpi-trend-red">
                  <v-icon size="12">mdi-clock-outline</v-icon> PENDIENTE
                </span>
              </div>
              <div class="kpi-value kpi-val-red">{{ fmt(datos.totalEgresosPend) }}</div>
              <div class="kpi-label">Egresos por Conciliar</div>
              <div class="kpi-sub-info">{{ countEgresos }} movimiento{{ countEgresos !== 1 ? 's' : '' }}</div>
            </div>
          </div>

          <div class="kpi-card kpi-proyectado">
            <div class="kpi-decoration"></div>
            <div class="kpi-inner">
              <div class="kpi-top">
                <div class="kpi-icon-wrap kpi-icon-purple">
                  <v-icon size="20" color="white">mdi-calculator-variant-outline</v-icon>
                </div>
                <span class="kpi-trend kpi-trend-purple">
                  <v-icon size="12">mdi-trending-up</v-icon> PROYECTADO
                </span>
              </div>
              <div class="kpi-value kpi-val-purple">{{ fmt(datos.saldoProyectado) }}</div>
              <div class="kpi-label">Saldo Proyectado</div>
              <div class="kpi-sub-info">Al conciliar todo</div>
            </div>
          </div>

        </div>

        <!-- BARRA DE FÓRMULA -->
        <div class="rc-formula-bar">
          <div class="formula-item">
            <div class="formula-label">Saldo Conciliado</div>
            <div class="formula-value formula-blue">{{ fmt(datos.saldoConciliado) }}</div>
          </div>
          <div class="formula-op formula-op-plus">
            <v-icon size="18">mdi-plus</v-icon>
          </div>
          <div class="formula-item">
            <div class="formula-label">Ingresos Pend.</div>
            <div class="formula-value formula-green">{{ fmt(datos.totalIngresosPend) }}</div>
          </div>
          <div class="formula-op formula-op-minus">
            <v-icon size="18">mdi-minus</v-icon>
          </div>
          <div class="formula-item">
            <div class="formula-label">Egresos Pend.</div>
            <div class="formula-value formula-red">{{ fmt(datos.totalEgresosPend) }}</div>
          </div>
          <div class="formula-equals">
            <v-icon size="18" color="rgba(255,255,255,0.7)">mdi-equal</v-icon>
          </div>
          <div class="formula-item formula-result">
            <div class="formula-label formula-label-white">Saldo Proyectado</div>
            <div class="formula-value formula-white">{{ fmt(datos.saldoProyectado) }}</div>
          </div>
        </div>

        <!-- TABLA DE MOVIMIENTOS -->
        <div class="rc-table-card">

          <div class="rc-table-header">
            <div class="rc-table-title-group">
              <div class="rc-table-icon">
                <v-icon size="16" color="#f59e0b">mdi-clock-alert-outline</v-icon>
              </div>
              <div>
                <div class="rc-table-title">Movimientos Pendientes de Conciliar</div>
                <div class="rc-table-sub">{{ cuentaNombre }}</div>
              </div>
            </div>
            <div class="rc-table-chips">
              <div v-if="countIngresos > 0" class="chip chip-green">
                <v-icon size="11">mdi-arrow-down</v-icon>
                {{ countIngresos }} Ingr.
              </div>
              <div v-if="countEgresos > 0" class="chip chip-red">
                <v-icon size="11">mdi-arrow-up</v-icon>
                {{ countEgresos }} Egr.
              </div>
              <div class="chip chip-gray">
                {{ datos.movimientos.length }} total
              </div>
            </div>
          </div>

          <!-- Sin movimientos pendientes -->
          <div v-if="datos.movimientos.length === 0" class="rc-all-ok">
            <div class="all-ok-circle">
              <v-icon size="40" color="#10b981">mdi-check-circle-outline</v-icon>
            </div>
            <div class="all-ok-title">¡Todo Conciliado!</div>
            <div class="all-ok-sub">No hay movimientos pendientes de conciliar en esta cuenta.</div>
          </div>

          <!-- Tabla -->
          <div v-else class="rc-tabla-wrap">
            <table class="rc-tabla">
              <thead>
                <tr>
                  <th style="width:100px">FECHA</th>
                  <th>CONCEPTO</th>
                  <th>BENEFICIARIO</th>
                  <th class="col-right" style="width:150px">INGRESO</th>
                  <th class="col-right" style="width:150px">EGRESO</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(mov, idx) in datos.movimientos" :key="mov.numero || idx" :class="idx % 2 === 0 ? 'tr-even' : 'tr-odd'">
                  <td class="td-fecha">{{ fmtFecha(mov.fecha) }}</td>
                  <td class="td-concepto">{{ mov.concepto || '—' }}</td>
                  <td class="td-beneficiario">{{ mov.beneficiario || '—' }}</td>
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
                  <td colspan="3" class="foot-label">TOTALES PENDIENTES</td>
                  <td class="col-right foot-monto monto-ing">{{ fmt(datos.totalIngresosPend) }}</td>
                  <td class="col-right foot-monto monto-egr">{{ fmt(datos.totalEgresosPend) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>

      </div><!-- /rc-contenido -->

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const authStore = useAuthStore()

const cuentas            = ref([])
const bancoSeleccionado  = ref('')
const datos              = ref(null)
const cargando           = ref(false)
const errorMsg           = ref('')
const generandoPDF       = ref(false)

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

const datosReady = computed(() => datos.value !== null)

const countIngresos = computed(() =>
  (datos.value?.movimientos || []).filter(m => Number(m.ingreso) > 0).length
)
const countEgresos = computed(() =>
  (datos.value?.movimientos || []).filter(m => Number(m.egreso) > 0).length
)

const porcentajeConciliado = computed(() => {
  if (!datos.value) return 0
  const total = Math.abs(datos.value.saldoConciliado) + Math.abs(datos.value.totalIngresosPend) + Math.abs(datos.value.totalEgresosPend)
  if (total === 0) return 100
  return Math.min(100, Math.round((Math.abs(datos.value.saldoConciliado) / total) * 100))
})

function fmt(val) {
  const n = parseFloat(val || 0)
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(n)
}

function fmtFecha(f) {
  if (!f) return '—'
  try {
    const d = new Date(f)
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return String(f) }
}

// ─── API calls ────────────────────────────────────────────────────────────────
async function cargarCuentas() {
  try {
    const empresa = getEmpresa()
    const res = await api.get('/contabilidad/cuentas-bancarias', {
      params: { empresa, estado: 'ACTIVA' }
    })
    cuentas.value = res.data?.data || res.data || []
  } catch (e) {
    console.error('Error cuentas bancarias:', e)
  }
}

async function cargarDatos() {
  if (!bancoSeleccionado.value) return
  const empresa = getEmpresa()
  errorMsg.value = ''
  datos.value = null
  cargando.value = true

  console.log('[Conciliación] Cargando — banco:', bancoSeleccionado.value, '| empresa:', empresa)

  try {
    const res = await api.get('/tesoreria/conciliacion', {
      params: { banco: bancoSeleccionado.value, empresa }
    })
    console.log('[Conciliación] Respuesta:', res.data)
    if (res.data?.success) {
      datos.value = res.data.data
    } else {
      errorMsg.value = res.data?.error || 'Error desconocido del servidor'
    }
  } catch (e) {
    console.error('[Conciliación] Error:', e)
    errorMsg.value = e?.response?.data?.error
      || e?.response?.statusText
      || e?.message
      || 'No se pudo conectar con el servidor'
  } finally {
    cargando.value = false
  }
}

function onCuentaChange() {
  errorMsg.value = ''
  datos.value = null
  if (bancoSeleccionado.value) {
    cargarDatos()
  }
}

// También disparar con watch por si @change no funciona en todos los browsers
watch(bancoSeleccionado, (val) => {
  if (val) cargarDatos()
  else { datos.value = null; errorMsg.value = '' }
})

onMounted(cargarCuentas)

// ─── PDF Export ───────────────────────────────────────────────────────────────
function exportarPDF() {
  if (!datos.value) return
  generandoPDF.value = true

  const nombreCuenta = cuentaNombre.value || bancoSeleccionado.value
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()

  // Encabezado azul
  doc.setFillColor(6, 182, 212)
  doc.rect(0, 0, pageW, 32, 'F')
  doc.setFontSize(17)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('CONCILIACIÓN BANCARIA', 14, 14)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Cuenta: ${nombreCuenta}`, 14, 22)
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 14, 28)

  // KPIs
  autoTable(doc, {
    startY: 38,
    head: [['Saldo Conciliado', 'Ingresos Pendientes', 'Egresos Pendientes', 'Saldo Proyectado']],
    body: [[
      fmt(datos.value.saldoConciliado),
      fmt(datos.value.totalIngresosPend),
      fmt(datos.value.totalEgresosPend),
      fmt(datos.value.saldoProyectado)
    ]],
    styles: { fontSize: 9, halign: 'right' },
    headStyles: { fillColor: [30, 58, 138], textColor: 255, halign: 'center', fontSize: 8 },
    bodyStyles: { fontStyle: 'bold' },
    theme: 'grid'
  })

  // Tabla movimientos
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Fecha', 'Concepto', 'Beneficiario', 'Ingreso', 'Egreso']],
    body: datos.value.movimientos.map(m => [
      fmtFecha(m.fecha),
      m.concepto || '',
      m.beneficiario || '—',
      Number(m.ingreso) > 0 ? fmt(m.ingreso) : '—',
      Number(m.egreso)  > 0 ? fmt(m.egreso)  : '—'
    ]),
    foot: [['', '', 'TOTALES', fmt(datos.value.totalIngresosPend), fmt(datos.value.totalEgresosPend)]],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [6, 182, 212], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: 30, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 24 },
      3: { halign: 'right', cellWidth: 34 },
      4: { halign: 'right', cellWidth: 34 }
    },
    theme: 'striped',
    alternateRowStyles: { fillColor: [248, 250, 252] }
  })

  doc.save(`conciliacion-${nombreCuenta.replace(/\s+/g, '-')}.pdf`)
  generandoPDF.value = false
}
</script>

<style scoped>
/* ── Wrapper ─────────────────────────────────────────────────── */
.rc-wrap {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100%;
}

/* ── Breadcrumb ──────────────────────────────────────────────── */
.breadcrumb {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 20px;
}
.bc-root { font-size: 11px; font-weight: 700; color: #06b6d4; text-transform: uppercase; letter-spacing: 0.5px; }
.bc-cat  { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.4); }
.bc-cur  { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.7); font-weight: 600; }

/* ── Header ──────────────────────────────────────────────────── */
.rc-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px; gap: 16px; flex-wrap: wrap;
}
.rc-header-left { display: flex; align-items: center; gap: 16px; }
.rc-icon-wrap {
  width: 52px; height: 52px; border-radius: 16px;
  background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 20px rgba(6,182,212,0.38);
  flex-shrink: 0;
}
.rc-title {
  font-size: 21px; font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
  letter-spacing: 0.4px; margin: 0;
}
.rc-sub {
  font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.45);
  margin: 3px 0 0;
}
.btn-pdf { font-weight: 700 !important; }

/* ── Selector Panel ──────────────────────────────────────────── */
.rc-selector-panel {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  border-radius: 14px;
  padding: 16px 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.rc-selector-left {
  display: flex; align-items: center; gap: 12px; flex: 1; min-width: 220px;
}
.rc-selector-icon {
  width: 38px; height: 38px; border-radius: 10px;
  background: rgba(6,182,212,0.1);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.rc-selector-content { display: flex; flex-direction: column; gap: 3px; flex: 1; }
.rc-selector-label {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.5);
}
.rc-select {
  width: 100%; max-width: 420px;
  height: 38px; padding: 0 12px;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.18);
  border-radius: 8px;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-surface));
  font-size: 13px; font-family: inherit; font-weight: 500;
  cursor: pointer; outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.rc-select:focus { border-color: #06b6d4; box-shadow: 0 0 0 3px rgba(6,182,212,0.15); }
.rc-selector-right { flex-shrink: 0; }
.rc-cuenta-badge {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; color: #10b981;
  background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2);
  border-radius: 20px; padding: 3px 10px;
  white-space: nowrap;
}

/* ── Estado inicial ──────────────────────────────────────────── */
.rc-estado-inicial {
  display: flex; align-items: center; justify-content: center;
  padding: 72px 24px;
}
.estado-inicial-inner {
  text-align: center; max-width: 400px;
}
.estado-inicial-icon {
  width: 90px; height: 90px; border-radius: 24px;
  background: rgba(6,182,212,0.08); border: 2px dashed rgba(6,182,212,0.3);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
}
.estado-inicial-title {
  font-size: 18px; font-weight: 700;
  color: rgb(var(--v-theme-on-surface)); margin: 0 0 8px;
}
.estado-inicial-sub {
  font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.45); line-height: 1.6; margin: 0;
}

/* ── Error panel ─────────────────────────────────────────────── */
.rc-error-panel {
  display: flex; align-items: flex-start; gap: 14px;
  background: rgba(239,68,68,0.06);
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;
}
.error-title { font-size: 13px; font-weight: 700; color: #ef4444; }
.error-detail { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.6); margin-top: 2px; }

/* ── Loading ─────────────────────────────────────────────────── */
.rc-loading {
  display: flex; align-items: center; gap: 20px;
  padding: 60px 0; justify-content: center;
}
.loading-title { font-size: 14px; font-weight: 600; color: rgb(var(--v-theme-on-surface)); }
.loading-sub   { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.45); margin-top: 3px; }

/* ── Contenido ───────────────────────────────────────────────── */
.rc-contenido { display: flex; flex-direction: column; gap: 20px; }

/* ── KPI Cards ───────────────────────────────────────────────── */
.rc-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
@media (max-width: 960px) { .rc-kpis { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .rc-kpis { grid-template-columns: 1fr; } }

.kpi-card {
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: box-shadow 0.2s, transform 0.2s;
}
.kpi-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.09); transform: translateY(-2px); }

.kpi-decoration {
  position: absolute; top: 0; right: 0;
  width: 80px; height: 80px; border-radius: 0 14px 0 80px;
  opacity: 0.07;
}
.kpi-conciliado .kpi-decoration { background: #3b82f6; }
.kpi-ingresos   .kpi-decoration { background: #10b981; }
.kpi-egresos    .kpi-decoration { background: #ef4444; }
.kpi-proyectado .kpi-decoration { background: #8b5cf6; }

.kpi-inner { padding: 18px 18px 14px; }
.kpi-top {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}
.kpi-icon-wrap {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}
.kpi-icon-blue   { background: linear-gradient(135deg,#3b82f6,#2563eb); }
.kpi-icon-green  { background: linear-gradient(135deg,#10b981,#059669); }
.kpi-icon-red    { background: linear-gradient(135deg,#ef4444,#dc2626); }
.kpi-icon-purple { background: linear-gradient(135deg,#8b5cf6,#7c3aed); }

.kpi-trend {
  font-size: 9.5px; font-weight: 700;
  display: flex; align-items: center; gap: 3px;
  border-radius: 20px; padding: 3px 8px;
  text-transform: uppercase; letter-spacing: 0.3px;
}
.kpi-trend-blue   { background: rgba(59,130,246,0.1);  color: #3b82f6; }
.kpi-trend-green  { background: rgba(16,185,129,0.1);  color: #10b981; }
.kpi-trend-red    { background: rgba(239,68,68,0.1);   color: #ef4444; }
.kpi-trend-purple { background: rgba(139,92,246,0.1);  color: #8b5cf6; }

.kpi-value {
  font-size: 20px; font-weight: 800; line-height: 1;
  margin-bottom: 4px; font-family: 'Courier New', monospace;
}
.kpi-val-blue   { color: #3b82f6; }
.kpi-val-green  { color: #10b981; }
.kpi-val-red    { color: #ef4444; }
.kpi-val-purple { color: #8b5cf6; }

.kpi-label {
  font-size: 10px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.5);
  margin-bottom: 10px;
}
.kpi-sub-info {
  font-size: 10.5px; color: rgba(var(--v-theme-on-surface), 0.4);
}

.kpi-bar {
  height: 4px; border-radius: 2px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  overflow: hidden; margin-top: 10px;
}
.kpi-bar-fill {
  height: 100%; border-radius: 2px;
  transition: width 0.8s ease;
}
.kpi-bar-blue { background: linear-gradient(90deg, #3b82f6, #06b6d4); }

/* ── Fórmula bar ─────────────────────────────────────────────── */
.rc-formula-bar {
  display: flex; align-items: center; gap: 0; flex-wrap: wrap;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 14px; padding: 16px 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.18);
}
.formula-item {
  display: flex; flex-direction: column; gap: 3px;
  flex: 1; min-width: 100px; padding: 0 12px;
}
.formula-result {
  border-left: 1px solid rgba(255,255,255,0.15);
}
.formula-label {
  font-size: 9.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: rgba(255,255,255,0.4);
}
.formula-label-white { color: rgba(255,255,255,0.7); }
.formula-value {
  font-size: 15px; font-weight: 800;
  font-family: 'Courier New', monospace;
}
.formula-blue   { color: #60a5fa; }
.formula-green  { color: #34d399; }
.formula-red    { color: #f87171; }
.formula-white  { color: #fff; }

.formula-op {
  flex-shrink: 0; width: 30px;
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.3);
}
.formula-equals {
  flex-shrink: 0; width: 36px;
  display: flex; align-items: center; justify-content: center;
}

/* ── Table Card ──────────────────────────────────────────────── */
.rc-table-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 14px; overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.rc-table-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; flex-wrap: wrap; gap: 10px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07);
}
.rc-table-title-group { display: flex; align-items: center; gap: 12px; }
.rc-table-icon {
  width: 34px; height: 34px; border-radius: 9px;
  background: rgba(245,158,11,0.12);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.rc-table-title {
  font-size: 13px; font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  text-transform: uppercase; letter-spacing: 0.4px;
}
.rc-table-sub {
  font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.45); margin-top: 2px;
}
.rc-table-chips { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }

.chip {
  font-size: 10px; font-weight: 700;
  display: flex; align-items: center; gap: 3px;
  border-radius: 20px; padding: 3px 9px;
  text-transform: uppercase; letter-spacing: 0.3px;
}
.chip-green { background: rgba(16,185,129,0.1);  color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
.chip-red   { background: rgba(239,68,68,0.1);   color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
.chip-gray  { background: rgba(var(--v-theme-on-surface),0.06); color: rgba(var(--v-theme-on-surface),0.5); border: 1px solid rgba(var(--v-theme-on-surface),0.1); }

/* ── Todo OK ─────────────────────────────────────────────────── */
.rc-all-ok {
  text-align: center; padding: 56px 24px;
}
.all-ok-circle {
  width: 80px; height: 80px; border-radius: 50%;
  background: rgba(16,185,129,0.1);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px; border: 2px solid rgba(16,185,129,0.2);
}
.all-ok-title { font-size: 17px; font-weight: 700; color: #10b981; margin-bottom: 6px; }
.all-ok-sub   { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.45); }

/* ── Tabla ───────────────────────────────────────────────────── */
.rc-tabla-wrap { overflow-x: auto; }
.rc-tabla {
  width: 100%; border-collapse: collapse; font-size: 13px;
}
.rc-tabla thead tr {
  background: rgba(var(--v-theme-on-surface), 0.04);
}
.rc-tabla thead th {
  padding: 11px 14px; text-align: left;
  font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
  text-transform: uppercase; color: rgba(var(--v-theme-on-surface), 0.5);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  white-space: nowrap;
}
.rc-tabla tbody td { padding: 10px 14px; }
.tr-even { background: rgb(var(--v-theme-surface)); }
.tr-odd  { background: rgba(var(--v-theme-on-surface), 0.022); }
.rc-tabla tbody tr {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  transition: background 0.12s;
}
.rc-tabla tbody tr:hover { background: rgba(6,182,212,0.05) !important; }

.col-right { text-align: right !important; }

.td-fecha        { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.6); white-space: nowrap; }
.td-concepto     { color: rgb(var(--v-theme-on-surface)); }
.td-beneficiario { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.65); }
.td-monto        { font-family: 'Courier New', monospace; font-weight: 600; font-size: 12px; }

.tipo-ing {
  background: rgba(16,185,129,0.12); color: #10b981;
  padding: 3px 8px; border-radius: 4px; font-size: 10.5px; font-weight: 800;
  letter-spacing: 0.3px;
}
.tipo-egr {
  background: rgba(239,68,68,0.1); color: #ef4444;
  padding: 3px 8px; border-radius: 4px; font-size: 10.5px; font-weight: 800;
  letter-spacing: 0.3px;
}

.monto-ing  { color: #10b981; }
.monto-egr  { color: #ef4444; }
.monto-dash { color: rgba(var(--v-theme-on-surface), 0.2); }

/* ── Tfoot ───────────────────────────────────────────────────── */
.tr-foot {
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-top: 2px solid rgba(var(--v-theme-on-surface), 0.1);
}
.tr-foot td { padding: 11px 14px; }
.foot-label {
  font-size: 11px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.6);
}
.foot-monto { font-size: 13px; font-weight: 800; font-family: 'Courier New', monospace; }
</style>
