<template>
  <MainLayout>
    <div class="rn-container">

      <!-- BREADCRUMB -->
      <div class="rn-breadcrumb">
        <span class="bc-root">NÓMINA</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Reporte de Nómina</span>
      </div>

      <!-- HEADER -->
      <div class="rn-header">
        <div class="rn-header-left">
          <div class="rn-icon-wrap"><v-icon size="22" color="white">mdi-chart-bar</v-icon></div>
          <div>
            <h1 class="rn-title">REPORTE DE NÓMINA</h1>
            <p class="rn-sub">Análisis de costos por período, empleado, centro de costo e impuestos</p>
          </div>
        </div>
      </div>

      <!-- FILTROS -->
      <div class="rn-filters-card">
        <div class="rn-filters-row">
          <div class="filter-group">
            <div class="filter-label">FECHA INICIO</div>
            <v-text-field v-model="filtros.fechaInicio" type="date" variant="outlined" density="compact"
              hide-details style="min-width:160px" />
          </div>
          <div class="filter-group">
            <div class="filter-label">FECHA FIN</div>
            <v-text-field v-model="filtros.fechaFin" type="date" variant="outlined" density="compact"
              hide-details style="min-width:160px" />
          </div>
          <v-btn color="#ec4899" variant="flat" rounded="lg" :loading="cargando" @click="cargar" height="40">
            <v-icon start>mdi-magnify</v-icon>Generar Reporte
          </v-btn>
          <v-spacer />
          <v-btn v-if="datos.length" variant="tonal" color="#ec4899" rounded="lg" height="40" @click="exportarCSV">
            <v-icon start>mdi-download</v-icon>CSV
          </v-btn>
        </div>
      </div>

      <v-progress-linear v-if="cargando" indeterminate color="#ec4899" height="3" class="mb-4" />

      <!-- KPIs -->
      <div v-if="kpis" class="rn-kpi-grid">
        <div class="rn-kpi" style="--kc:#ec4899">
          <div class="kpi-icon"><v-icon size="18" color="#ec4899">mdi-cash-multiple</v-icon></div>
          <div class="kpi-body">
            <div class="kpi-lbl">BRUTO PAGADO</div>
            <div class="kpi-val">{{ fmt(kpis.total_bruto) }}</div>
          </div>
        </div>
        <div class="rn-kpi" style="--kc:#ef4444">
          <div class="kpi-icon"><v-icon size="18" color="#ef4444">mdi-minus-circle-outline</v-icon></div>
          <div class="kpi-body">
            <div class="kpi-lbl">DEDUCCIONES EMP.</div>
            <div class="kpi-val" style="color:#ef4444">{{ fmt(kpis.total_deducciones) }}</div>
          </div>
        </div>
        <div class="rn-kpi" style="--kc:#22c55e">
          <div class="kpi-icon"><v-icon size="18" color="#22c55e">mdi-bank-transfer-out</v-icon></div>
          <div class="kpi-body">
            <div class="kpi-lbl">NETO PAGADO</div>
            <div class="kpi-val" style="color:#22c55e">{{ fmt(kpis.total_neto) }}</div>
          </div>
        </div>
        <div class="rn-kpi" style="--kc:#f59e0b">
          <div class="kpi-icon"><v-icon size="18" color="#f59e0b">mdi-office-building-outline</v-icon></div>
          <div class="kpi-body">
            <div class="kpi-lbl">APORTES EMPLEADOR</div>
            <div class="kpi-val" style="color:#f59e0b">{{ fmt(kpis.total_aportes_er) }}</div>
          </div>
        </div>
        <div class="rn-kpi" style="--kc:#8b5cf6">
          <div class="kpi-icon"><v-icon size="18" color="#8b5cf6">mdi-domain</v-icon></div>
          <div class="kpi-body">
            <div class="kpi-lbl">COSTO TOTAL EMPRESA</div>
            <div class="kpi-val" style="color:#8b5cf6">{{ fmt(kpis.costo_total_empresa) }}</div>
          </div>
        </div>
        <div class="rn-kpi" style="--kc:#06b6d4">
          <div class="kpi-icon"><v-icon size="18" color="#06b6d4">mdi-account-group-outline</v-icon></div>
          <div class="kpi-body">
            <div class="kpi-lbl">NÓMINAS / EMPLEADOS</div>
            <div class="kpi-val" style="color:#06b6d4">{{ kpis.total_nominas }} / {{ kpis.total_empleados }}</div>
          </div>
        </div>
      </div>

      <!-- TABS DE VISTA -->
      <div v-if="kpis || datos.length" class="rn-tabs-card">
        <div class="rn-tabs-header">
          <button v-for="t in tabs" :key="t.val"
            class="rn-tab" :class="{ 'rn-tab--active': vistaActiva === t.val }"
            @click="cambiarVista(t.val)">
            <v-icon size="15" class="mr-1">{{ t.icon }}</v-icon>{{ t.label }}
          </button>
        </div>

        <!-- ESTADO VACÍO -->
        <div v-if="!cargando && datos.length === 0" class="rn-empty">
          <v-icon size="40" color="rgba(var(--v-theme-on-surface),.15)" class="mb-2">mdi-file-search-outline</v-icon>
          <div>No hay nóminas aprobadas en el período seleccionado</div>
        </div>

        <!-- VISTA: POR PERÍODO -->
        <div v-else-if="vistaActiva === 'periodo' && datos.length" class="rn-table-wrap">
          <table class="rn-table">
            <thead>
              <tr>
                <th>PERÍODO</th>
                <th class="ta-r">EMPLEADOS</th>
                <th class="ta-r">BRUTO</th>
                <th class="ta-r">DEDUCCIONES</th>
                <th class="ta-r">APORTES ER</th>
                <th class="ta-r">NETO</th>
                <th class="ta-r">COSTO EMPRESA</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in datos" :key="r.id">
                <td>
                  <div class="periodo-label">{{ fmtFecha(r.semana_inicio) }}</div>
                  <div class="periodo-sub">al {{ fmtFecha(r.semana_fin) }}</div>
                </td>
                <td class="ta-r">{{ r.empleados }}</td>
                <td class="ta-r font-mono">{{ fmt(r.total_bruto) }}</td>
                <td class="ta-r font-mono text-error">{{ fmt(r.total_deducciones) }}</td>
                <td class="ta-r font-mono text-warning">{{ fmt(r.total_aportes_er) }}</td>
                <td class="ta-r font-mono text-success">{{ fmt(r.total_neto) }}</td>
                <td class="ta-r font-mono text-purple">{{ fmt(r.costo_empresa) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="rn-tfoot">
                <td><strong>TOTAL</strong></td>
                <td class="ta-r">{{ kpis.total_empleados }}</td>
                <td class="ta-r font-mono">{{ fmt(kpis.total_bruto) }}</td>
                <td class="ta-r font-mono text-error">{{ fmt(kpis.total_deducciones) }}</td>
                <td class="ta-r font-mono text-warning">{{ fmt(kpis.total_aportes_er) }}</td>
                <td class="ta-r font-mono text-success">{{ fmt(kpis.total_neto) }}</td>
                <td class="ta-r font-mono text-purple">{{ fmt(kpis.costo_total_empresa) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- VISTA: POR EMPLEADO -->
        <div v-else-if="vistaActiva === 'empleado' && datos.length" class="rn-table-wrap">
          <table class="rn-table">
            <thead>
              <tr>
                <th>EMPLEADO</th>
                <th class="ta-c">TIPO</th>
                <th class="ta-r">NÓMINAS</th>
                <th class="ta-r">HRS REG</th>
                <th class="ta-r">HRS OT</th>
                <th class="ta-r">BRUTO</th>
                <th class="ta-r">DEDUCCIONES</th>
                <th class="ta-r">APORTES ER</th>
                <th class="ta-r">NETO</th>
                <th class="ta-r">COSTO EMP.</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in datos" :key="r.empleado_id">
                <td class="font-weight-medium">{{ r.nombre }}</td>
                <td class="ta-c">
                  <span :class="r.tipo_empleado === 'W2' ? 'badge-w2' : 'badge-1099'">{{ r.tipo_empleado }}</span>
                </td>
                <td class="ta-r">{{ r.total_nominas }}</td>
                <td class="ta-r font-mono">{{ fmtNum(r.horas_regulares) }}</td>
                <td class="ta-r font-mono">{{ fmtNum(r.horas_overtime) }}</td>
                <td class="ta-r font-mono">{{ fmt(r.total_bruto) }}</td>
                <td class="ta-r font-mono text-error">{{ fmt(r.total_deducciones) }}</td>
                <td class="ta-r font-mono text-warning">{{ fmt(r.total_aportes_er) }}</td>
                <td class="ta-r font-mono text-success">{{ fmt(r.total_neto) }}</td>
                <td class="ta-r font-mono text-purple">{{ fmt(r.costo_empresa) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="rn-tfoot">
                <td colspan="5"><strong>TOTAL</strong></td>
                <td class="ta-r font-mono">{{ fmt(kpis.total_bruto) }}</td>
                <td class="ta-r font-mono text-error">{{ fmt(kpis.total_deducciones) }}</td>
                <td class="ta-r font-mono text-warning">{{ fmt(kpis.total_aportes_er) }}</td>
                <td class="ta-r font-mono text-success">{{ fmt(kpis.total_neto) }}</td>
                <td class="ta-r font-mono text-purple">{{ fmt(kpis.costo_total_empresa) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- VISTA: POR CENTRO DE COSTO -->
        <div v-else-if="vistaActiva === 'ccosto' && datos.length" class="rn-table-wrap">
          <table class="rn-table">
            <thead>
              <tr>
                <th>CENTRO DE COSTO</th>
                <th class="ta-c">CÓD.</th>
                <th class="ta-r">EMPLEADOS</th>
                <th class="ta-r">HORAS</th>
                <th class="ta-r">COSTO BRUTO</th>
                <th class="ta-r">COSTO TOTAL</th>
                <th class="ta-r">% DEL TOTAL</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in datos" :key="r.ccosto">
                <td class="font-weight-medium">{{ r.ccosto_nombre }}</td>
                <td class="ta-c text-caption font-mono" style="color:rgba(var(--v-theme-on-surface),.5)">{{ r.ccosto }}</td>
                <td class="ta-r">{{ r.empleados }}</td>
                <td class="ta-r font-mono">{{ fmtNum(r.horas) }}</td>
                <td class="ta-r font-mono">{{ fmt(r.costo_bruto) }}</td>
                <td class="ta-r font-mono text-purple">{{ fmt(r.costo_total) }}</td>
                <td class="ta-r">
                  <div class="pct-bar-wrap">
                    <div class="pct-bar" :style="{ width: pctCcosto(r.costo_total) + '%' }"></div>
                    <span class="pct-label">{{ pctCcosto(r.costo_total).toFixed(1) }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="rn-tfoot">
                <td colspan="4"><strong>TOTAL</strong></td>
                <td class="ta-r font-mono">{{ fmt(totalCcostoBruto) }}</td>
                <td class="ta-r font-mono text-purple">{{ fmt(totalCcostoTotal) }}</td>
                <td class="ta-r">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- VISTA: IMPUESTOS -->
        <div v-else-if="vistaActiva === 'impuestos' && datos.length" class="rn-table-wrap">
          <table class="rn-table">
            <thead>
              <tr>
                <th>PERÍODO</th>
                <th class="ta-r">FED. INC. TAX</th>
                <th class="ta-r">SS EMP.</th>
                <th class="ta-r">SS ER</th>
                <th class="ta-r">MEDICARE EMP.</th>
                <th class="ta-r">MEDICARE ER</th>
                <th class="ta-r">FUTA</th>
                <th class="ta-r">SUTA</th>
                <th class="ta-r">W.COMP</th>
                <th class="ta-r text-error">TOTAL IMP.</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in datos" :key="r.semana_inicio">
                <td>
                  <div class="periodo-label">{{ fmtFecha(r.semana_inicio) }}</div>
                  <div class="periodo-sub">al {{ fmtFecha(r.semana_fin) }}</div>
                </td>
                <td class="ta-r font-mono">{{ fmt(r.federal_income_tax) }}</td>
                <td class="ta-r font-mono">{{ fmt(r.ss_emp) }}</td>
                <td class="ta-r font-mono">{{ fmt(r.ss_er) }}</td>
                <td class="ta-r font-mono">{{ fmt(r.medicare_emp) }}</td>
                <td class="ta-r font-mono">{{ fmt(r.medicare_er) }}</td>
                <td class="ta-r font-mono">{{ fmt(r.futa) }}</td>
                <td class="ta-r font-mono">{{ fmt(r.suta) }}</td>
                <td class="ta-r font-mono">{{ fmt(r.workers_comp) }}</td>
                <td class="ta-r font-mono text-error font-weight-bold">{{ fmt(r.total_impuestos) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="rn-tfoot">
                <td><strong>TOTAL</strong></td>
                <td class="ta-r font-mono">{{ fmt(kpis.federal_income_tax) }}</td>
                <td class="ta-r font-mono">{{ fmt(kpis.social_security_emp) }}</td>
                <td class="ta-r font-mono">{{ fmt(kpis.social_security_er) }}</td>
                <td class="ta-r font-mono">{{ fmt(kpis.medicare_emp) }}</td>
                <td class="ta-r font-mono">{{ fmt(kpis.medicare_er) }}</td>
                <td class="ta-r font-mono">{{ fmt(kpis.futa) }}</td>
                <td class="ta-r font-mono">{{ fmt(kpis.suta) }}</td>
                <td class="ta-r font-mono">{{ fmt(kpis.workers_comp) }}</td>
                <td class="ta-r font-mono text-error font-weight-bold">
                  {{ fmt(+kpis.federal_income_tax + +kpis.social_security_emp + +kpis.social_security_er + +kpis.medicare_emp + +kpis.medicare_er + +kpis.futa + +kpis.suta + +kpis.workers_comp) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { API_BASE } from '../../utils/constants.js'
import { useAuthStore } from '../../stores/auth.js'

const authStore = useAuthStore()
const getEmpresa = () => authStore.empresaCodigo || authStore.empresa || localStorage.getItem('empresaActual')

const cargando = ref(false)
const kpis = ref(null)
const datos = ref([])
const vistaActiva = ref('periodo')

// Período por defecto: año actual
const hoy = new Date()
const anoActual = hoy.getFullYear()
const filtros = ref({
  fechaInicio: `${anoActual}-01-01`,
  fechaFin: `${anoActual}-12-31`,
})

const tabs = [
  { val: 'periodo',   label: 'Por Período',         icon: 'mdi-calendar-range-outline' },
  { val: 'empleado',  label: 'Por Empleado',         icon: 'mdi-account-group-outline' },
  { val: 'ccosto',    label: 'Por Centro de Costo',  icon: 'mdi-sitemap-outline' },
  { val: 'impuestos', label: 'Impuestos y Taxes',    icon: 'mdi-receipt-text-outline' },
]

const totalCcostoBruto = computed(() => datos.value.reduce((s, r) => s + parseFloat(r.costo_bruto || 0), 0))
const totalCcostoTotal = computed(() => datos.value.reduce((s, r) => s + parseFloat(r.costo_total || 0), 0))

function pctCcosto(val) {
  const tot = totalCcostoTotal.value
  return tot > 0 ? (parseFloat(val) / tot * 100) : 0
}

async function cargar() {
  cargando.value = true
  try {
    const empresa = getEmpresa()
    const params = new URLSearchParams({
      empresa,
      fechaInicio: filtros.value.fechaInicio,
      fechaFin:    filtros.value.fechaFin,
      vista:       vistaActiva.value,
    })
    const r = await fetch(`${API_BASE}/nomina/reporte?${params}`)
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    kpis.value  = j.kpis
    datos.value = j.data || []
  } catch (e) {
    console.error(e)
  } finally {
    cargando.value = false
  }
}

async function cambiarVista(v) {
  vistaActiva.value = v
  await cargar()
}

function fmt(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtNum(v) {
  return (parseFloat(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtFecha(s) {
  if (!s) return '—'
  const d = new Date(s + 'T00:00:00')
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
}

function exportarCSV() {
  if (!datos.value.length) return
  const cols = Object.keys(datos.value[0])
  const lines = [cols.join(','), ...datos.value.map(r => cols.map(c => `"${r[c] ?? ''}"`).join(','))]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `reporte-nomina-${vistaActiva.value}-${filtros.value.fechaInicio}.csv`
  a.click()
}

onMounted(cargar)
</script>

<style scoped>
.rn-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
.rn-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 12px; font-weight: 700; color: #ec4899; text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.3); }
.bc-cat { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.8); font-weight: 500; }

.rn-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.rn-header-left { display: flex; align-items: center; gap: 16px; }
.rn-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#ec4899,#be185d); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(236,72,153,.35); }
.rn-title { font-size: 20px; font-weight: 800; margin: 0; }
.rn-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 2px 0 0; }

.rn-filters-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 14px; padding: 16px 20px; margin-bottom: 20px; }
.rn-filters-row { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
.filter-group { display: flex; flex-direction: column; gap: 4px; }
.filter-label { font-size: 10px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.4); }

/* KPIs */
.rn-kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px,1fr)); gap: 12px; margin-bottom: 20px; }
.rn-kpi { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 12px; border-left: 3px solid var(--kc); }
.kpi-icon { width: 36px; height: 36px; border-radius: 9px; background: rgba(var(--v-theme-on-surface),.05); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.kpi-lbl { font-size: 10px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.45); margin-bottom: 2px; }
.kpi-val { font-size: 16px; font-weight: 800; font-family: monospace; color: rgb(var(--v-theme-on-surface)); }

/* Tabs */
.rn-tabs-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 14px; overflow: hidden; }
.rn-tabs-header { display: flex; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); overflow-x: auto; }
.rn-tab { display: flex; align-items: center; padding: 12px 18px; font-size: 12px; font-weight: 600; color: rgba(var(--v-theme-on-surface),.5); background: none; border: none; cursor: pointer; white-space: nowrap; border-bottom: 2px solid transparent; transition: all .15s; }
.rn-tab:hover { color: #ec4899; background: rgba(236,72,153,.04); }
.rn-tab--active { color: #ec4899; border-bottom-color: #ec4899; background: rgba(236,72,153,.05); }

.rn-empty { padding: 48px 24px; text-align: center; color: rgba(var(--v-theme-on-surface),.4); font-size: 13px; display: flex; flex-direction: column; align-items: center; }

/* Tabla */
.rn-table-wrap { overflow-x: auto; }
.rn-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.rn-table th { padding: 10px 14px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.45); background: rgba(var(--v-theme-on-surface),.03); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); white-space: nowrap; }
.rn-table td { padding: 10px 14px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); }
.rn-table tbody tr:hover { background: rgba(var(--v-theme-on-surface),.03); }
.rn-tfoot td { padding: 10px 14px; background: rgba(var(--v-theme-on-surface),.04); border-top: 2px solid rgba(var(--v-theme-on-surface),.12); font-size: 13px; }
.ta-r { text-align: right; }
.ta-c { text-align: center; }
.font-mono { font-family: 'Courier New', monospace; }
.font-weight-medium { font-weight: 500; }
.font-weight-bold { font-weight: 700; }
.text-error { color: #ef4444; }
.text-success { color: #22c55e; }
.text-warning { color: #f59e0b; }
.text-purple { color: #8b5cf6; }

.periodo-label { font-weight: 600; font-size: 12px; }
.periodo-sub { font-size: 11px; color: rgba(var(--v-theme-on-surface),.45); }

.badge-w2 { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: rgba(139,92,246,.12); color: #7c3aed; }
.badge-1099 { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: rgba(245,158,11,.12); color: #b45309; }

.pct-bar-wrap { display: flex; align-items: center; gap: 6px; }
.pct-bar { height: 6px; border-radius: 3px; background: linear-gradient(90deg, #ec4899, #8b5cf6); min-width: 2px; }
.pct-label { font-size: 11px; color: rgba(var(--v-theme-on-surface),.6); white-space: nowrap; }
</style>
