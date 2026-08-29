<template>
  <MainLayout>
    <div class="nom-wrap">

      <PageHeader
        title="Reporte de Propinas Pagadas"
        description="Propinas pagadas a empleados por período o rango de tiempo"
        :crumbs="['Nómina', 'Reportes', 'Reporte de Propinas']"
      />

      <!-- ── FILTROS ── -->
      <div class="nom-card" style="padding:14px 18px">
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">
          <div class="drw-field" style="width:160px">
            <label>Fecha Inicio</label>
            <input v-model="filtros.fechaInicio" type="date" class="drw-input" />
          </div>
          <div class="drw-field" style="width:160px">
            <label>Fecha Fin</label>
            <input v-model="filtros.fechaFin" type="date" class="drw-input" />
          </div>
          <div class="drw-field" style="width:230px">
            <label>Empleado (opcional)</label>
            <select v-model="filtros.empleadoId" class="drw-select" style="width:100%">
              <option value="">— Todos los empleados —</option>
              <option v-for="e in empleados" :key="e.id" :value="e.id">{{ e.apellido }}, {{ e.nombre }}</option>
            </select>
          </div>
          <v-btn size="small" color="secondary" variant="flat" :loading="cargando" @click="cargar">
            <v-icon size="14" class="mr-1">mdi-magnify</v-icon> Generar Reporte
          </v-btn>
          <v-spacer />
          <v-btn v-if="empleadosAgrupados.length" size="small" color="secondary" variant="outlined" @click="imprimirTodos">
            <v-icon size="14" class="mr-1">mdi-printer</v-icon> Imprimir Todos
          </v-btn>
        </div>
      </div>

      <!-- ── KPIs ── -->
      <div v-if="cargado" class="kpi-grid">
        <KpiCard :index="0" label="Total Propinas Pagadas" :value="fmtMoney(totalGeneral)" icon="mdi-cash-multiple" color="var(--success)" />
        <KpiCard :index="1" label="Total Horas" :value="fmtNum(totalHorasGeneral) + 'h'" icon="mdi-clock-outline" color="var(--indigo)" />
        <KpiCard :index="2" label="Empleados" :value="String(empleadosAgrupados.length)" icon="mdi-account-group" color="var(--indigo)" />
      </div>

      <!-- ── TABLA POR EMPLEADO ── -->
      <div v-if="empleadosAgrupados.length" class="nom-card" style="overflow-x:auto">
        <table class="nom-table">
          <thead>
            <tr>
              <th style="width:28px"></th>
              <th>EMPLEADO</th>
              <th class="ta-r">MESES INCLUIDOS</th>
              <th class="ta-r">HORAS TOTALES</th>
              <th class="ta-r">TOTAL PROPINAS</th>
              <th style="width:36px"></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="emp in empleadosAgrupados" :key="emp.empleado_id">
              <tr class="nom-row" style="cursor:pointer" @click="toggleExpand(emp.empleado_id)">
                <td class="ta-c">
                  <v-icon size="14" style="color:rgba(var(--v-theme-on-surface),0.3)">
                    {{ expandido.has(emp.empleado_id) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                  </v-icon>
                </td>
                <td style="font-weight:700;font-size:12px">{{ emp.empleado_nombre }}</td>
                <td class="ta-r">{{ emp.periodos.length }}</td>
                <td class="ta-r">{{ fmtNum(emp.total_horas) }}h</td>
                <td class="ta-r bold" style="color:var(--success)">{{ fmtMoney(emp.total_propinas) }}</td>
                <td class="ta-c">
                  <v-btn size="x-small" icon="mdi-printer" variant="text" color="secondary"
                         title="Imprimir reporte de este empleado" @click.stop="imprimirEmpleado(emp)" />
                </td>
              </tr>
              <tr v-if="expandido.has(emp.empleado_id)" class="expand-row">
                <td colspan="6">
                  <div style="padding:10px 20px">
                    <table class="nom-table" style="background:transparent">
                      <thead>
                        <tr>
                          <th>PERÍODO</th>
                          <th>CENTRO DE COSTO</th>
                          <th class="ta-r">HORAS</th>
                          <th class="ta-r">PROPINA ASIGNADA</th>
                          <th>ESTADO</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(p, i) in emp.periodos" :key="i" class="nom-row">
                          <td>{{ nombreMes(p.mes) }} {{ p.anio }}</td>
                          <td class="dim">{{ p.ccosto_nombre }}</td>
                          <td class="ta-r">{{ fmtNum(p.horas) }}h</td>
                          <td class="ta-r neto">{{ fmtMoney(p.valor_asignado) }}</td>
                          <td><span class="estado-badge" :class="`estado-${p.estado?.toLowerCase()}`">{{ p.estado }}</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
          <tfoot>
            <tr class="footer-row">
              <td colspan="3" style="font-weight:800;font-size:12px">TOTAL GENERAL</td>
              <td class="ta-r bold">{{ fmtNum(totalHorasGeneral) }}h</td>
              <td class="ta-r bold" style="color:var(--success)">{{ fmtMoney(totalGeneral) }}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- ── ESTADO VACÍO ── -->
      <div v-else-if="cargado && !cargando" class="nom-card estado-vacio">
        <v-icon size="48" color="rgba(var(--v-theme-on-surface),0.15)">mdi-cash-fast</v-icon>
        <div style="margin-top:12px;font-weight:700">Sin resultados</div>
        <div style="font-size:12px;color:rgba(var(--v-theme-on-surface),0.4);margin-top:4px">
          No hay propinas registradas para el rango y filtro seleccionado.
        </div>
      </div>
      <div v-else-if="!cargado" class="nom-card estado-vacio">
        <v-icon size="48" color="rgba(var(--v-theme-on-surface),0.15)">mdi-filter-outline</v-icon>
        <div style="margin-top:12px;font-weight:700">Selecciona un rango de fechas</div>
        <div style="font-size:12px;color:rgba(var(--v-theme-on-surface),0.4);margin-top:4px">
          Elige fecha inicio y fin, y opcionalmente un empleado, luego haz clic en <strong>"Generar Reporte"</strong>.
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import KpiCard from '../../components/common/KpiCard.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const empresa = computed(() => authStore.empresa || authStore.user?.empresa || localStorage.getItem('empresaActual') || '')
const empresaNombre = computed(() => authStore.empresaNombre || authStore.user?.empresaNombre || 'Mi Empresa')

const hoy = new Date()
const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]
const hoyStr = hoy.toISOString().split('T')[0]

const filtros = ref({
  fechaInicio: primerDiaMes,
  fechaFin: hoyStr,
  empleadoId: ''
})

const empleados = ref([])
const filas = ref([])
const cargando = ref(false)
const cargado  = ref(false)
const expandido = ref(new Set())

function toggleExpand(id) {
  if (expandido.value.has(id)) expandido.value.delete(id)
  else expandido.value.add(id)
  expandido.value = new Set(expandido.value)
}

const empleadosAgrupados = computed(() => {
  const grupos = {}
  for (const f of filas.value) {
    if (!grupos[f.empleado_id]) {
      grupos[f.empleado_id] = { empleado_id: f.empleado_id, empleado_nombre: f.empleado_nombre, total_horas: 0, total_propinas: 0, periodos: [] }
    }
    const g = grupos[f.empleado_id]
    g.total_horas += parseFloat(f.horas) || 0
    g.total_propinas += parseFloat(f.valor_asignado) || 0
    g.periodos.push(f)
  }
  return Object.values(grupos).sort((a, b) => a.empleado_nombre.localeCompare(b.empleado_nombre))
})

const totalGeneral = computed(() => empleadosAgrupados.value.reduce((s, e) => s + e.total_propinas, 0))
const totalHorasGeneral = computed(() => empleadosAgrupados.value.reduce((s, e) => s + e.total_horas, 0))

async function cargarEmpleados() {
  try {
    const r = await api.get('/nomina/empleados', { params: { empresa: empresa.value, estado: 'TODOS' } })
    empleados.value = r.data?.data || []
  } catch(e) { empleados.value = [] }
}

async function cargar() {
  if (!filtros.value.fechaInicio || !filtros.value.fechaFin) return
  cargando.value = true
  try {
    const r = await api.get('/nomina/propinas/reporte', {
      params: {
        empresa: empresa.value,
        fechaInicio: filtros.value.fechaInicio,
        fechaFin: filtros.value.fechaFin,
        empleadoId: filtros.value.empleadoId || undefined
      }
    })
    filas.value = r.data?.data || []
    cargado.value = true
    expandido.value = new Set()
  } catch(e) { alert('❌ ' + (e?.response?.data?.error || e.message)) }
  finally { cargando.value = false }
}

function nombreMes(m) {
  const meses = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return meses[m] || ''
}
function fmtMoney(v) {
  return '$' + parseFloat(v||0).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })
}
function fmtNum(v) { return parseFloat(v||0).toFixed(1) }
function fmtFechaRango() {
  const [yi,mi,di] = filtros.value.fechaInicio.split('-')
  const [yf,mf,df] = filtros.value.fechaFin.split('-')
  return `${mi}/${di}/${yi} — ${mf}/${df}/${yf}`
}

const ESTILOS_REPORTE = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; background: white; color: #111; padding: 16px; }
  .rep-header { background: #065f46; padding: 14px 18px; border-radius: 8px 8px 0 0; }
  .rep-empresa { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.65); text-transform: uppercase; letter-spacing: 0.8px; }
  .rep-titulo  { font-size: 16px; font-weight: 800; color: white; margin: 2px 0; }
  .rep-periodo { font-size: 11px; color: rgba(255,255,255,0.6); }
  .rep-body { border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; padding: 14px 18px; margin-bottom: 18px; page-break-inside: avoid; }
  .rep-emp-nombre { font-size: 14px; font-weight: 700; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 8px; }
  th { padding: 5px 8px; text-align: left; font-size: 9px; font-weight: 800; color: #999; text-transform: uppercase; background: #f9f9f9; }
  th.ta-r { text-align: right; }
  td { padding: 5px 8px; border-bottom: 1px solid #f0f0f0; }
  td.ta-r { text-align: right; }
  tr.total td { background: #f5f5f5; font-weight: 700; }
  .rep-total-emp { display: flex; justify-content: space-between; align-items: center; padding: 8px 0 0; font-size: 13px; font-weight: 800; color: #059669; }
  @media print { .rep-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .rep-body { page-break-after: always; } }
`

function htmlReporteEmpleado(emp, periodo) {
  const filasHtml = emp.periodos.map(p => `
    <tr>
      <td>${nombreMes(p.mes)} ${p.anio}</td>
      <td>${p.ccosto_nombre}</td>
      <td class="ta-r">${fmtNum(p.horas)}h</td>
      <td class="ta-r">${fmtMoney(p.valor_asignado)}</td>
      <td>${p.estado}</td>
    </tr>`).join('')

  return `
    <div class="rep-header">
      <div class="rep-empresa">${empresaNombre.value}</div>
      <div class="rep-titulo">REPORTE DE PROPINAS PAGADAS</div>
      <div class="rep-periodo">${periodo}</div>
    </div>
    <div class="rep-body">
      <div class="rep-emp-nombre">${emp.empleado_nombre}</div>
      <table>
        <thead><tr><th>PERÍODO</th><th>CENTRO DE COSTO</th><th class="ta-r">HORAS</th><th class="ta-r">PROPINA</th><th>ESTADO</th></tr></thead>
        <tbody>${filasHtml}
        <tr class="total"><td colspan="2">TOTAL</td><td class="ta-r">${fmtNum(emp.total_horas)}h</td><td class="ta-r">${fmtMoney(emp.total_propinas)}</td><td></td></tr>
        </tbody>
      </table>
      <div class="rep-total-emp"><span>TOTAL PAGADO A ${emp.empleado_nombre}</span><span>${fmtMoney(emp.total_propinas)}</span></div>
    </div>`
}

function imprimirEmpleado(emp) {
  const ventana = window.open('', '_blank')
  if (!ventana) { alert('Activa los pop-ups para imprimir el reporte'); return }
  const periodo = fmtFechaRango()
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Reporte de Propinas — ${emp.empleado_nombre}</title>
    <style>${ESTILOS_REPORTE}</style></head>
    <body>${htmlReporteEmpleado(emp, periodo)}</body></html>`
  ventana.document.write(html)
  ventana.document.close()
  ventana.focus()
}

function imprimirTodos() {
  if (!empleadosAgrupados.value.length) return
  const ventana = window.open('', '_blank')
  if (!ventana) { alert('Activa los pop-ups para imprimir el reporte'); return }
  const periodo = fmtFechaRango()
  const cuerpo = empleadosAgrupados.value.map(emp => htmlReporteEmpleado(emp, periodo)).join('')
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Reporte de Propinas Pagadas — ${periodo}</title>
    <style>${ESTILOS_REPORTE}</style></head>
    <body>${cuerpo}</body></html>`
  ventana.document.write(html)
  ventana.document.close()
  ventana.focus()
}

cargarEmpleados()
</script>

<style scoped>
.nom-wrap { display: flex; flex-direction: column; gap: 14px; }
.flex-1 { flex: 1; }
.nom-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),0.07); border-radius: 14px; }

.kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }

.nom-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.nom-table thead { background: rgba(var(--v-theme-on-surface),0.04); }
.nom-table th { padding: 9px 10px; text-align: left; font-size: 9px; font-weight: 800; letter-spacing: 0.8px; color: rgba(var(--v-theme-on-surface),0.4); text-transform: uppercase; border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.08); white-space: nowrap; }
.nom-row td { padding: 10px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.05); transition: background 0.1s; }
.nom-row:hover td { background: color-mix(in srgb, var(--indigo) 4%, transparent); }
.ta-r { text-align: right !important; }
.ta-c { text-align: center !important; }
.bold { font-weight: 700; }
.dim  { color: rgba(var(--v-theme-on-surface),0.5); }
.neto { color: var(--success); font-weight: 800; }
.footer-row td { background: rgba(var(--v-theme-on-surface),0.04); border-top: 2px solid rgba(var(--v-theme-on-surface),0.1); padding: 8px 10px; }

.expand-row td { padding: 0; background: rgba(var(--v-theme-on-surface),0.02); border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.06); }

.estado-badge { font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 4px; }
.estado-borrador { background: rgba(148,163,184,0.15); color: #94a3b8; }
.estado-pagado   { background: color-mix(in srgb, var(--success) 15%, transparent); color: var(--success); }

.estado-vacio { padding: 48px; text-align: center; display: flex; flex-direction: column; align-items: center; }

.drw-select { height: 34px; padding: 0 8px; border-radius: 7px; border: 1px solid rgba(var(--v-theme-on-surface),0.15); background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); font-size: 12px; outline: none; }
.drw-field { display: flex; flex-direction: column; gap: 4px; }
.drw-field label { font-size: 10px; font-weight: 700; color: rgba(var(--v-theme-on-surface),0.5); text-transform: uppercase; }
.drw-input { height: 34px; padding: 0 8px; border-radius: 7px; border: 1px solid rgba(var(--v-theme-on-surface),0.15); background: rgba(var(--v-theme-on-surface),0.03); color: rgb(var(--v-theme-on-surface)); font-size: 12px; outline: none; width: 100%; box-sizing: border-box; }
</style>
