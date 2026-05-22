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
          <div class="rc-icon">
            <v-icon size="24" color="white">mdi-bank-check</v-icon>
          </div>
          <div>
            <h1 class="rc-title">CONCILIACIÓN BANCARIA</h1>
            <p class="rc-sub">Movimientos pendientes de conciliar por cuenta</p>
          </div>
        </div>
        <v-btn
          v-if="datos"
          color="error"
          variant="outlined"
          prepend-icon="mdi-file-pdf-box"
          size="small"
          @click="exportarPDF"
          :loading="generandoPDF"
        >PDF</v-btn>
      </div>

      <!-- FILTRO -->
      <div class="rc-filtro">
        <div class="rc-filtro-inner">
          <v-icon size="18" color="#94a3b8" class="mr-2">mdi-bank-outline</v-icon>
          <span class="rc-filtro-label">Cuenta bancaria:</span>
          <select v-model="bancoSeleccionado" @change="cargarDatos" class="rc-select">
            <option value="">— Selecciona una cuenta —</option>
            <option
              v-for="c in cuentas"
              :key="c.codigo"
              :value="c.codigo"
            >{{ c.nombre_cta }}</option>
          </select>
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="cargando" class="rc-loading">
        <v-progress-circular indeterminate color="cyan" size="36" />
        <span>Cargando reporte...</span>
      </div>

      <!-- EMPTY -->
      <div v-else-if="!bancoSeleccionado" class="rc-empty">
        <v-icon size="56" color="#334155">mdi-bank-outline</v-icon>
        <p>Selecciona una cuenta bancaria para ver el reporte</p>
      </div>

      <!-- CONTENIDO -->
      <div v-else-if="datos" id="rc-contenido">

        <!-- KPIs -->
        <div class="rc-kpis">
          <div class="kpi kpi-blue">
            <div class="kpi-icon"><v-icon size="22" color="white">mdi-check-circle-outline</v-icon></div>
            <div class="kpi-info">
              <div class="kpi-label">SALDO CONCILIADO</div>
              <div class="kpi-val">{{ fmt(datos.saldoConciliado) }}</div>
            </div>
          </div>

          <div class="kpi kpi-green">
            <div class="kpi-icon"><v-icon size="22" color="white">mdi-arrow-down-circle-outline</v-icon></div>
            <div class="kpi-info">
              <div class="kpi-label">INGRESOS PENDIENTES</div>
              <div class="kpi-val">{{ fmt(datos.totalIngresosPend) }}</div>
            </div>
          </div>

          <div class="kpi kpi-red">
            <div class="kpi-icon"><v-icon size="22" color="white">mdi-arrow-up-circle-outline</v-icon></div>
            <div class="kpi-info">
              <div class="kpi-label">EGRESOS PENDIENTES</div>
              <div class="kpi-val">{{ fmt(datos.totalEgresosPend) }}</div>
            </div>
          </div>

          <div class="kpi kpi-purple">
            <div class="kpi-icon"><v-icon size="22" color="white">mdi-calculator-variant</v-icon></div>
            <div class="kpi-info">
              <div class="kpi-label">SALDO PROYECTADO</div>
              <div class="kpi-val">{{ fmt(datos.saldoProyectado) }}</div>
            </div>
          </div>
        </div>

        <!-- BARRA DE CÁLCULO -->
        <div class="rc-formula">
          <div class="fml-item">
            <span class="fml-lbl">Saldo Conciliado</span>
            <span class="fml-val fml-blue">{{ fmt(datos.saldoConciliado) }}</span>
          </div>
          <span class="fml-op">+</span>
          <div class="fml-item">
            <span class="fml-lbl">Ingresos Pend.</span>
            <span class="fml-val fml-green">{{ fmt(datos.totalIngresosPend) }}</span>
          </div>
          <span class="fml-op">−</span>
          <div class="fml-item">
            <span class="fml-lbl">Egresos Pend.</span>
            <span class="fml-val fml-red">{{ fmt(datos.totalEgresosPend) }}</span>
          </div>
          <span class="fml-op">=</span>
          <div class="fml-item fml-result">
            <span class="fml-lbl">Saldo Proyectado</span>
            <span class="fml-val fml-purple">{{ fmt(datos.saldoProyectado) }}</span>
          </div>
        </div>

        <!-- TABLA -->
        <div class="rc-card">
          <div class="rc-card-header">
            <div class="rc-card-title">
              <v-icon size="16" color="#f59e0b" class="mr-1">mdi-clock-alert-outline</v-icon>
              Movimientos Pendientes de Conciliar
              <v-chip size="x-small" color="warning" variant="flat" class="ml-2">
                {{ datos.movimientos.length }}
              </v-chip>
            </div>
          </div>

          <div v-if="datos.movimientos.length === 0" class="rc-no-mov">
            <v-icon size="36" color="#10b981">mdi-check-circle-outline</v-icon>
            <p>¡Todo conciliado! No hay movimientos pendientes.</p>
          </div>

          <div v-else class="rc-tabla-wrap">
            <table class="rc-tabla">
              <thead>
                <tr>
                  <th>FECHA</th>
                  <th>NÚMERO</th>
                  <th>TIPO</th>
                  <th>CONCEPTO</th>
                  <th class="text-right">INGRESO</th>
                  <th class="text-right">EGRESO</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="mov in datos.movimientos" :key="mov.id">
                  <td class="td-fecha">{{ fmtFecha(mov.fecha) }}</td>
                  <td class="td-num">{{ mov.numero }}</td>
                  <td class="td-tipo">
                    <span :class="mov.tipo === 'ING' ? 'badge-ing' : 'badge-egr'">
                      {{ mov.tipo }}
                    </span>
                  </td>
                  <td class="td-concepto">{{ mov.concepto }}</td>
                  <td class="td-monto text-right">
                    <span v-if="mov.ingreso > 0" class="monto-ing">{{ fmt(mov.ingreso) }}</span>
                    <span v-else class="monto-zero">—</span>
                  </td>
                  <td class="td-monto text-right">
                    <span v-if="mov.egreso > 0" class="monto-egr">{{ fmt(mov.egreso) }}</span>
                    <span v-else class="monto-zero">—</span>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="rc-foot">
                  <td colspan="4" class="foot-lbl">TOTALES PENDIENTES</td>
                  <td class="text-right monto-ing foot-val">{{ fmt(datos.totalIngresosPend) }}</td>
                  <td class="text-right monto-egr foot-val">{{ fmt(datos.totalEgresosPend) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const authStore = useAuthStore()

const cuentas          = ref([])
const bancoSeleccionado = ref('')
const datos            = ref(null)
const cargando         = ref(false)
const generandoPDF     = ref(false)

function getEmpresa() {
  return authStore.empresa || localStorage.getItem('empresaActual') || ''
}

function fmt(val) {
  const n = parseFloat(val || 0)
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2 }).format(n)
}

function fmtFecha(f) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

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
  if (!bancoSeleccionado.value) { datos.value = null; return }
  cargando.value = true
  datos.value = null
  try {
    const res = await api.get('/tesoreria/conciliacion', {
      params: { banco: bancoSeleccionado.value, empresa: getEmpresa() }
    })
    datos.value = res.data?.data || null
  } catch (e) {
    console.error('Error reporte:', e)
  } finally {
    cargando.value = false
  }
}

function exportarPDF() {
  if (!datos.value) return
  generandoPDF.value = true

  const cuenta = cuentas.value.find(c => String(c.codigo) === String(bancoSeleccionado.value))
  const nombreCuenta = cuenta?.nombre_cta || bancoSeleccionado.value

  const doc = new jsPDF()

  // Título
  doc.setFontSize(16)
  doc.setTextColor(15, 23, 42)
  doc.text('CONCILIACIÓN BANCARIA', 14, 18)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Cuenta: ${nombreCuenta}`, 14, 26)
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 14, 32)

  // KPIs como tabla
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
    headStyles: { fillColor: [30, 58, 138], textColor: 255, halign: 'center' },
    theme: 'grid'
  })

  // Tabla de movimientos
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Fecha', 'Número', 'Tipo', 'Concepto', 'Ingreso', 'Egreso']],
    body: datos.value.movimientos.map(m => [
      fmtFecha(m.fecha),
      m.numero,
      m.tipo,
      m.concepto,
      m.ingreso > 0 ? fmt(m.ingreso) : '—',
      m.egreso  > 0 ? fmt(m.egreso)  : '—'
    ]),
    foot: [['', '', '', 'TOTALES', fmt(datos.value.totalIngresosPend), fmt(datos.value.totalEgresosPend)]],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [6, 182, 212], textColor: 255 },
    footStyles: { fillColor: [241, 245, 249], textColor: 30, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 22 },
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 'auto' },
      4: { halign: 'right', cellWidth: 30 },
      5: { halign: 'right', cellWidth: 30 }
    },
    theme: 'striped'
  })

  doc.save(`conciliacion-${nombreCuenta}.pdf`)
  generandoPDF.value = false
}

onMounted(cargarCuentas)
</script>

<style scoped>
.rc-wrap {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Breadcrumb */
.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 11px; font-weight: 700; color: #06b6d4; text-transform: uppercase; letter-spacing: 0.5px; }
.bc-cat  { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.45); }
.bc-cur  { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.75); font-weight: 500; }

/* Header */
.rc-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px;
}
.rc-header-left { display: flex; align-items: center; gap: 16px; }
.rc-icon {
  width: 50px; height: 50px; border-radius: 14px;
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 14px rgba(6,182,212,0.35);
  flex-shrink: 0;
}
.rc-title { font-size: 20px; font-weight: 800; letter-spacing: 0.5px; margin: 0; color: rgb(var(--v-theme-on-surface)); }
.rc-sub   { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.45); margin: 2px 0 0; }

/* Filtro */
.rc-filtro {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;
}
.rc-filtro-inner { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.rc-filtro-label { font-size: 12px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.6); white-space: nowrap; }
.mr-2 { margin-right: 4px; }
.rc-select {
  flex: 1;
  min-width: 260px;
  max-width: 480px;
  height: 40px;
  padding: 0 12px;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 8px;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-surface));
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}
.rc-select:focus { border-color: #06b6d4; }

/* Loading / Empty */
.rc-loading { display: flex; align-items: center; gap: 12px; padding: 60px 0; justify-content: center; color: rgba(var(--v-theme-on-surface), 0.5); font-size: 13px; }
.rc-empty   { text-align: center; padding: 80px 24px; color: rgba(var(--v-theme-on-surface), 0.35); font-size: 13px; }
.rc-empty p { margin-top: 12px; }

/* KPIs */
.rc-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 16px;
}
@media (max-width: 900px) { .rc-kpis { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 500px) { .rc-kpis { grid-template-columns: 1fr; } }

.kpi {
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.kpi-blue   { background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(37,99,235,0.06)); border: 1px solid rgba(59,130,246,0.2); }
.kpi-green  { background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.06)); border: 1px solid rgba(16,185,129,0.2); }
.kpi-red    { background: linear-gradient(135deg, rgba(239,68,68,0.10), rgba(220,38,38,0.05)); border: 1px solid rgba(239,68,68,0.2); }
.kpi-purple { background: linear-gradient(135deg, rgba(139,92,246,0.12), rgba(109,40,217,0.06)); border: 1px solid rgba(139,92,246,0.2); }

.kpi-icon {
  width: 44px; height: 44px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.kpi-blue   .kpi-icon { background: linear-gradient(135deg,#3b82f6,#2563eb); }
.kpi-green  .kpi-icon { background: linear-gradient(135deg,#10b981,#059669); }
.kpi-red    .kpi-icon { background: linear-gradient(135deg,#ef4444,#dc2626); }
.kpi-purple .kpi-icon { background: linear-gradient(135deg,#8b5cf6,#6d28d9); }

.kpi-label { font-size: 10px; font-weight: 700; color: rgba(var(--v-theme-on-surface), 0.5); text-transform: uppercase; letter-spacing: 0.5px; }
.kpi-val   { font-size: 18px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); margin-top: 2px; }

/* Fórmula */
.rc-formula {
  display: flex; align-items: center; gap: 8px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  border-radius: 12px;
  padding: 14px 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.fml-item    { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 120px; }
.fml-result  { border-left: 2px solid rgba(var(--v-theme-on-surface), 0.15); padding-left: 12px; }
.fml-lbl     { font-size: 10px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); text-transform: uppercase; letter-spacing: 0.4px; }
.fml-val     { font-size: 16px; font-weight: 700; font-family: 'Courier New', monospace; }
.fml-blue    { color: #3b82f6; }
.fml-green   { color: #10b981; }
.fml-red     { color: #ef4444; }
.fml-purple  { color: #8b5cf6; }
.fml-op      { font-size: 20px; font-weight: 700; color: rgba(var(--v-theme-on-surface), 0.3); flex-shrink: 0; }

/* Card tabla */
.rc-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  overflow: hidden;
}
.rc-card-header {
  padding: 14px 20px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07);
}
.rc-card-title {
  font-size: 12px; font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.7);
  text-transform: uppercase; letter-spacing: 0.5px;
  display: flex; align-items: center;
}
.ml-2 { margin-left: 6px; }
.mr-1 { margin-right: 4px; }

.rc-no-mov {
  text-align: center; padding: 48px;
  color: rgba(var(--v-theme-on-surface), 0.4);
}
.rc-no-mov p { margin-top: 10px; font-size: 13px; }

/* Tabla */
.rc-tabla-wrap { overflow-x: auto; }
.rc-tabla { width: 100%; border-collapse: collapse; font-size: 13px; }
.rc-tabla thead tr { background: rgba(var(--v-theme-on-surface), 0.04); }
.rc-tabla thead th {
  padding: 10px 14px; text-align: left;
  font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
  text-transform: uppercase; color: rgba(var(--v-theme-on-surface), 0.5);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  white-space: nowrap;
}
.rc-tabla tbody tr { border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); transition: background 0.15s; }
.rc-tabla tbody tr:hover { background: rgba(var(--v-theme-on-surface), 0.025); }
.rc-tabla tbody td { padding: 10px 14px; color: rgb(var(--v-theme-on-surface)); }

.td-fecha   { white-space: nowrap; font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.6); }
.td-num     { font-family: 'Courier New', monospace; font-size: 12px; }
.td-tipo    { }
.td-concepto { max-width: 320px; }
.td-monto   { font-family: 'Courier New', monospace; font-size: 12px; font-weight: 600; }
.text-right { text-align: right !important; }

.badge-ing { background: rgba(16,185,129,0.15); color: #10b981; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
.badge-egr { background: rgba(239,68,68,0.12);  color: #ef4444; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }

.monto-ing  { color: #10b981; }
.monto-egr  { color: #ef4444; }
.monto-zero { color: rgba(var(--v-theme-on-surface), 0.25); }

/* Tfoot */
.rc-foot { background: rgba(var(--v-theme-on-surface), 0.04); }
.rc-foot td { padding: 10px 14px; }
.foot-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.6); }
.foot-val { font-size: 13px; font-weight: 800; font-family: 'Courier New', monospace; }
</style>
