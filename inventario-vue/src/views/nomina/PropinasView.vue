<template>
  <MainLayout>
    <div class="nom-wrap">

      <!-- ── HEADER ── -->
      <div class="nom-header">
        <div class="nom-header-icon"><v-icon size="20" color="white">mdi-cash-fast</v-icon></div>
        <div class="flex-1">
          <h1 class="nom-title">GESTIÓN DE PROPINAS</h1>
          <p class="nom-sub">
            Reparto proporcional a horas trabajadas por centro de costo
            <span v-if="registro" class="estado-badge" :class="`estado-${registro.estado?.toLowerCase()}`">{{ registro.estado }}</span>
          </p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <select v-model.number="mesSel" class="drw-select" style="width:150px" @change="cargar">
            <option v-for="m in 12" :key="m" :value="m">{{ nombreMes(m) }}</option>
          </select>
          <select v-model.number="anioSel" class="drw-select" style="width:100px" @change="cargar">
            <option v-for="a in anios" :key="a" :value="a">{{ a }}</option>
          </select>
          <v-btn v-if="!registro || registro.estado==='BORRADOR'" size="small" color="#8b5cf6" variant="flat"
                 :loading="generando" @click="generar">
            <v-icon size="14" class="mr-1">mdi-calculator</v-icon> {{ registro ? 'Recalcular' : 'Generar' }}
          </v-btn>
          <v-btn v-if="registro && empleadosParaImprimir.length" size="small" color="#06b6d4" variant="outlined" @click="imprimirTodos">
            <v-icon size="14" class="mr-1">mdi-printer</v-icon> Imprimir Volantes
          </v-btn>
          <v-btn v-if="registro?.estado==='BORRADOR'" size="small" color="#10b981" variant="flat" @click="dlgPagar=true">
            <v-icon size="14" class="mr-1">mdi-check-circle</v-icon> Marcar Pagado
          </v-btn>
          <v-btn v-if="registro?.estado==='BORRADOR'" size="small" color="#ef4444" variant="text"
                 :loading="borrando" @click="borrar">
            <v-icon size="14">mdi-trash-can</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- ── KPI CARDS ── -->
      <div v-if="registro" class="liq-kpis">
        <div class="lkpi">
          <div class="lkpi-icon" style="background:rgba(16,185,129,0.1)"><v-icon size="18" color="#10b981">mdi-cash-multiple</v-icon></div>
          <div>
            <div class="lkpi-label">Total Propinas del Mes</div>
            <div class="lkpi-val" style="color:#10b981">{{ fmtMoney(registro.total_propinas) }}</div>
          </div>
        </div>
        <div class="lkpi">
          <div class="lkpi-icon" style="background:rgba(6,182,212,0.1)"><v-icon size="18" color="#06b6d4">mdi-clock-outline</v-icon></div>
          <div>
            <div class="lkpi-label">Total Horas Trabajadas</div>
            <div class="lkpi-val" style="color:#06b6d4">{{ fmtNum(registro.total_horas) }}h</div>
          </div>
        </div>
        <div class="lkpi">
          <div class="lkpi-icon" style="background:rgba(139,92,246,0.1)"><v-icon size="18" color="#8b5cf6">mdi-account-group</v-icon></div>
          <div>
            <div class="lkpi-label">Empleados</div>
            <div class="lkpi-val" style="color:#8b5cf6">{{ empleadosUnicos }}</div>
          </div>
        </div>
        <div class="lkpi">
          <div class="lkpi-icon" style="background:rgba(245,158,11,0.1)"><v-icon size="18" color="#f59e0b">mdi-office-building</v-icon></div>
          <div>
            <div class="lkpi-label">Centros de Costo</div>
            <div class="lkpi-val" style="color:#f59e0b">{{ ccostosAgrupados.length }}</div>
          </div>
        </div>
      </div>

      <!-- ── AVISO CCOSTOS SIN REPARTIR ── -->
      <div v-if="ccostosSinRepartir.length" class="aviso-sin-repartir">
        <v-icon size="16" color="#f59e0b">mdi-alert</v-icon>
        <span>
          Hay propinas de <strong>{{ ccostosSinRepartir.map(c => c.ccosto_nombre).join(', ') }}</strong>
          que no se pudieron repartir porque no hay horas registradas en ese centro de costo para este mes.
        </span>
      </div>

      <!-- ── TABLA POR CENTRO DE COSTO ── -->
      <div v-if="ccostosAgrupados.length" class="nom-card" style="overflow-x:auto">
        <table class="nom-table">
          <thead>
            <tr>
              <th style="width:28px"></th>
              <th>CENTRO DE COSTO</th>
              <th class="ta-r">PROPINAS DEL MES</th>
              <th class="ta-r">HORAS TOTALES</th>
              <th class="ta-r">$ / HORA</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="cc in ccostosAgrupados" :key="cc.ccosto || 'sin-cc'">
              <tr class="nom-row" style="cursor:pointer" @click="toggleExpand(cc.ccosto)">
                <td class="ta-c">
                  <v-icon size="14" style="color:rgba(var(--v-theme-on-surface),0.3)">
                    {{ expandido.has(cc.ccosto) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                  </v-icon>
                </td>
                <td style="font-weight:700;font-size:12px">{{ cc.ccosto_nombre }}</td>
                <td class="ta-r bold" style="color:#10b981">{{ fmtMoney(cc.total_propinas_ccosto) }}</td>
                <td class="ta-r">{{ fmtNum(cc.total_horas_ccosto) }}h</td>
                <td class="ta-r dim">{{ cc.total_horas_ccosto > 0 ? fmtMoney(cc.total_propinas_ccosto / cc.total_horas_ccosto) : '—' }}</td>
              </tr>
              <tr v-if="expandido.has(cc.ccosto)" class="expand-row">
                <td colspan="5">
                  <div style="padding:10px 20px">
                    <table class="nom-table" style="background:transparent">
                      <thead>
                        <tr>
                          <th>EMPLEADO</th>
                          <th class="ta-r">HORAS</th>
                          <th class="ta-r">% DEL TOTAL</th>
                          <th class="ta-r">PROPINA ASIGNADA</th>
                          <th style="width:36px"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="emp in cc.empleados" :key="emp.empleado_id ?? emp.empleado_nombre" class="nom-row">
                          <td>{{ emp.empleado_nombre }}</td>
                          <td class="ta-r">{{ emp.empleado_id ? fmtNum(emp.horas) + 'h' : '—' }}</td>
                          <td class="ta-r dim">{{ cc.total_horas_ccosto > 0 && emp.empleado_id ? ((emp.horas / cc.total_horas_ccosto) * 100).toFixed(1) + '%' : '—' }}</td>
                          <td class="ta-r neto">{{ fmtMoney(emp.valor_asignado) }}</td>
                          <td class="ta-c">
                            <v-btn v-if="emp.empleado_id" size="x-small" icon="mdi-printer" variant="text" color="#06b6d4"
                                   title="Imprimir volante" @click="imprimirVolante(emp, cc)" />
                          </td>
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
              <td colspan="2" style="font-weight:800;font-size:12px">TOTAL GENERAL</td>
              <td class="ta-r bold" style="color:#10b981">{{ fmtMoney(registro.total_propinas) }}</td>
              <td class="ta-r bold">{{ fmtNum(registro.total_horas) }}h</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- ── ESTADO VACÍO ── -->
      <div v-else-if="!cargando" class="nom-card estado-vacio">
        <v-icon size="48" color="rgba(var(--v-theme-on-surface),0.15)">mdi-cash-fast</v-icon>
        <div style="margin-top:12px;font-weight:700">Sin distribución generada</div>
        <div style="font-size:12px;color:rgba(var(--v-theme-on-surface),0.4);margin-top:4px">
          Selecciona el mes y haz clic en <strong>"Generar"</strong> para repartir las propinas de {{ nombreMes(mesSel) }} {{ anioSel }}
          entre los empleados según las horas trabajadas.
        </div>
      </div>

      <!-- ── HISTORIAL ── -->
      <div v-if="historial.length" class="nom-card" style="padding:14px 18px;margin-top:4px">
        <div class="expand-titulo" style="margin-bottom:10px">HISTORIAL DE MESES GENERADOS</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          <div v-for="h in historial" :key="h.id" class="historial-chip"
               :class="{ activo: h.anio===anioSel && h.mes===mesSel }"
               @click="anioSel=h.anio; mesSel=h.mes; cargar()">
            {{ nombreMes(h.mes) }} {{ h.anio }}
            <span class="estado-badge" :class="`estado-${h.estado?.toLowerCase()}`">{{ h.estado }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── DIALOG MARCAR PAGADO ── -->
    <v-dialog v-model="dlgPagar" max-width="440">
      <v-card rounded="lg">
        <v-card-title class="pa-4 pb-2" style="font-size:15px;font-weight:700">
          <v-icon size="18" color="#10b981" class="mr-2">mdi-check-circle</v-icon>
          Marcar Propinas como Pagadas
        </v-card-title>
        <v-card-text class="pa-4 pt-0">
          <p style="font-size:12px;color:rgba(var(--v-theme-on-surface),0.6)">
            Vas a marcar como <strong>PAGADO</strong> el reparto de propinas de <strong>{{ nombreMes(mesSel) }} {{ anioSel }}</strong>
            por un total de <strong style="color:#10b981">{{ fmtMoney(registro?.total_propinas) }}</strong>.
          </p>
          <div class="aviso-sin-repartir mt-3" style="margin:0">
            <v-icon size="14" color="#f59e0b">mdi-information</v-icon>
            <span>Una vez pagado, no se podrá regenerar ni eliminar este mes.</span>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn size="small" variant="text" @click="dlgPagar=false">Cancelar</v-btn>
          <v-btn size="small" color="#10b981" variant="flat" :loading="pagando" @click="confirmarPagar">Confirmar Pago</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const empresa = computed(() => authStore.empresa || authStore.user?.empresa || localStorage.getItem('empresaActual') || '')
const empresaNombre = computed(() => authStore.empresaNombre || authStore.user?.empresaNombre || 'Mi Empresa')

const hoy = new Date()
const mesSel  = ref(hoy.getMonth() + 1)
const anioSel = ref(hoy.getFullYear())
const anios = computed(() => {
  const base = hoy.getFullYear()
  return [base, base - 1, base - 2]
})

const registro   = ref(null)
const historial  = ref([])
const cargando   = ref(false)
const generando  = ref(false)
const borrando   = ref(false)
const pagando    = ref(false)
const dlgPagar   = ref(false)
const expandido  = ref(new Set())

function toggleExpand(ccosto) {
  if (expandido.value.has(ccosto)) expandido.value.delete(ccosto)
  else expandido.value.add(ccosto)
  expandido.value = new Set(expandido.value)
}

const ccostosAgrupados = computed(() => {
  if (!registro.value?.detalle?.length) return []
  const grupos = {}
  for (const d of registro.value.detalle) {
    const key = d.ccosto || 'SIN CC'
    if (!grupos[key]) {
      grupos[key] = {
        ccosto: d.ccosto, ccosto_nombre: d.ccosto_nombre,
        total_propinas_ccosto: parseFloat(d.total_propinas_ccosto) || 0,
        total_horas_ccosto: parseFloat(d.total_horas_ccosto) || 0,
        empleados: []
      }
    }
    grupos[key].empleados.push(d)
  }
  return Object.values(grupos).sort((a, b) => (a.ccosto_nombre || '').localeCompare(b.ccosto_nombre || ''))
})

const ccostosSinRepartir = computed(() => ccostosAgrupados.value.filter(c => c.total_horas_ccosto <= 0))

const empleadosUnicos = computed(() => {
  if (!registro.value?.detalle?.length) return 0
  const ids = new Set(registro.value.detalle.filter(d => d.empleado_id).map(d => d.empleado_id))
  return ids.size
})

// Lista plana de empleados con propina asignada (para imprimir), con el % ya calculado
const empleadosParaImprimir = computed(() => {
  const out = []
  for (const cc of ccostosAgrupados.value) {
    for (const emp of cc.empleados) {
      if (!emp.empleado_id) continue
      out.push({
        ...emp,
        ccosto_nombre: cc.ccosto_nombre,
        porcentaje: cc.total_horas_ccosto > 0 ? (emp.horas / cc.total_horas_ccosto) * 100 : 0
      })
    }
  }
  return out
})

async function cargar() {
  cargando.value = true
  try {
    const [r, h] = await Promise.all([
      api.get('/nomina/propinas', { params: { empresa: empresa.value, anio: anioSel.value, mes: mesSel.value } }),
      api.get('/nomina/propinas/historial', { params: { empresa: empresa.value } }),
    ])
    registro.value = r.data?.data || null
    historial.value = h.data?.data || []
    expandido.value = new Set()
  } finally { cargando.value = false }
}

async function generar() {
  generando.value = true
  try {
    const r = await api.post('/nomina/propinas/generar', { empresa: empresa.value, anio: anioSel.value, mes: mesSel.value })
    registro.value = r.data.data
    await cargar()
  } catch(e) { alert('❌ ' + (e?.response?.data?.error || e.message)) }
  finally { generando.value = false }
}

async function confirmarPagar() {
  if (!registro.value?.id) return
  pagando.value = true
  try {
    await api.put(`/nomina/propinas/${registro.value.id}/pagar`)
    dlgPagar.value = false
    await cargar()
  } catch(e) { alert('❌ ' + (e?.response?.data?.error || e.message)) }
  finally { pagando.value = false }
}

async function borrar() {
  if (!registro.value?.id) return
  if (!confirm('¿Eliminar este borrador de propinas? Podrás volver a generarlo.')) return
  borrando.value = true
  try {
    await api.delete(`/nomina/propinas/${registro.value.id}`)
    registro.value = null
    await cargar()
  } catch(e) { alert('❌ ' + (e?.response?.data?.error || e.message)) }
  finally { borrando.value = false }
}

function nombreMes(m) {
  const meses = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return meses[m] || ''
}
function fmtMoney(v) {
  return '$' + parseFloat(v||0).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })
}
function fmtNum(v) { return parseFloat(v||0).toFixed(1) }

const ESTILOS_VOLANTE = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; background: white; color: #111; }
  .pagina { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 12px; }
  @media print { .pagina { grid-template-columns: 1fr !important; gap: 4px !important; padding: 8px; } }
  .volante { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; break-inside: avoid; page-break-inside: avoid; page-break-after: always; }
  .vol-header { background: #065f46; padding: 10px 14px; }
  .vol-empresa { font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.65); text-transform: uppercase; letter-spacing: 0.8px; }
  .vol-titulo  { font-size: 14px; font-weight: 800; color: white; margin: 2px 0; }
  .vol-periodo { font-size: 10px; color: rgba(255,255,255,0.6); }
  .vol-emp-row { padding: 10px 14px; border-bottom: 1px solid #eee; }
  .vol-emp-nombre { font-size: 13px; font-weight: 700; }
  .vol-emp-cc { font-size: 10px; color: #888; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  td { padding: 5px 14px; border-bottom: 1px solid #f0f0f0; }
  td.ta-r { text-align: right; }
  .vol-footer { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: #ecfdf5; border-top: 1px solid #a7f3d0; }
  .vol-label { font-size: 9px; color: #888; text-transform: uppercase; }
  .vol-monto { font-size: 20px; font-weight: 800; color: #059669; }
  @media print { .vol-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .vol-footer { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`

function htmlVolante(emp, ccNombre, porcentaje, periodo) {
  return `
    <div class="volante">
      <div class="vol-header">
        <div class="vol-empresa">${empresaNombre.value}</div>
        <div class="vol-titulo">VOLANTE DE PROPINAS</div>
        <div class="vol-periodo">${periodo}</div>
      </div>
      <div class="vol-emp-row">
        <div class="vol-emp-nombre">${emp.empleado_nombre}</div>
        <div class="vol-emp-cc">Centro de costo: ${ccNombre}</div>
      </div>
      <table>
        <tbody>
          <tr><td>Horas trabajadas</td><td class="ta-r">${fmtNum(emp.horas)}h</td></tr>
          <tr><td>% del total de horas del centro de costo</td><td class="ta-r">${porcentaje.toFixed(1)}%</td></tr>
        </tbody>
      </table>
      <div class="vol-footer">
        <div><div class="vol-label">Propina asignada</div></div>
        <div class="vol-monto">${fmtMoney(emp.valor_asignado)}</div>
      </div>
    </div>`
}

function imprimirVolante(emp, cc) {
  const ventana = window.open('', '_blank')
  if (!ventana) { alert('Activa los pop-ups para imprimir el volante'); return }
  const periodo = `${nombreMes(mesSel.value)} ${anioSel.value}`
  const porcentaje = cc.total_horas_ccosto > 0 ? (emp.horas / cc.total_horas_ccosto) * 100 : 0
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Volante de Propinas — ${emp.empleado_nombre}</title>
    <style>${ESTILOS_VOLANTE}</style></head>
    <body><div class="pagina">${htmlVolante(emp, cc.ccosto_nombre, porcentaje, periodo)}</div></body></html>`
  ventana.document.write(html)
  ventana.document.close()
  ventana.focus()
}

function imprimirTodos() {
  if (!empleadosParaImprimir.value.length) return
  const ventana = window.open('', '_blank')
  if (!ventana) { alert('Activa los pop-ups para imprimir los volantes'); return }
  const periodo = `${nombreMes(mesSel.value)} ${anioSel.value}`
  const cuerpo = empleadosParaImprimir.value
    .map(emp => htmlVolante(emp, emp.ccosto_nombre, emp.porcentaje, periodo))
    .join('')
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Volantes de Propinas — ${periodo}</title>
    <style>${ESTILOS_VOLANTE}</style></head>
    <body><div class="pagina">${cuerpo}</div></body></html>`
  ventana.document.write(html)
  ventana.document.close()
  ventana.focus()
}

onMounted(cargar)
</script>

<style scoped>
.nom-wrap { display: flex; flex-direction: column; gap: 14px; }
.nom-header { display: flex; align-items: center; gap: 14px; background: linear-gradient(135deg,#1a0a2e,#3b1a5e); border-radius: 14px; padding: 20px 24px; flex-wrap: wrap; }
.nom-header-icon { width: 42px; height: 42px; border-radius: 10px; background: rgba(139,92,246,0.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nom-title { font-size: 17px; font-weight: 800; color: #fff; margin: 0; }
.nom-sub   { font-size: 12px; color: rgba(255,255,255,0.5); margin: 0; display: flex; align-items: center; gap: 8px; }
.flex-1 { flex: 1; }
.nom-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),0.07); border-radius: 14px; }

.estado-badge { font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 4px; }
.estado-borrador { background: rgba(148,163,184,0.15); color: #94a3b8; }
.estado-pagado   { background: rgba(16,185,129,0.15); color: #10b981; }

.liq-kpis { display: grid; grid-template-columns: repeat(auto-fit,minmax(150px,1fr)); gap: 10px; }
.lkpi { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),0.07); border-radius: 12px; padding: 14px 16px; display: flex; align-items: center; gap: 12px; }
.lkpi-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.lkpi-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface),0.4); margin-bottom: 4px; }
.lkpi-val { font-size: 18px; font-weight: 800; }

.nom-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.nom-table thead { background: rgba(var(--v-theme-on-surface),0.04); }
.nom-table th { padding: 9px 10px; text-align: left; font-size: 9px; font-weight: 800; letter-spacing: 0.8px; color: rgba(var(--v-theme-on-surface),0.4); text-transform: uppercase; border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.08); white-space: nowrap; }
.nom-row td { padding: 10px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.05); transition: background 0.1s; }
.nom-row:hover td { background: rgba(139,92,246,0.04); }
.ta-r { text-align: right !important; }
.ta-c { text-align: center !important; }
.bold { font-weight: 700; }
.dim  { color: rgba(var(--v-theme-on-surface),0.5); }
.neto { color: #10b981; font-weight: 800; }
.footer-row td { background: rgba(var(--v-theme-on-surface),0.04); border-top: 2px solid rgba(var(--v-theme-on-surface),0.1); padding: 8px 10px; }

.expand-row td { padding: 0; background: rgba(var(--v-theme-on-surface),0.02); border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.06); }
.expand-titulo { font-size: 9px; font-weight: 800; letter-spacing: 0.8px; color: rgba(var(--v-theme-on-surface),0.35); text-transform: uppercase; }

.estado-vacio { padding: 48px; text-align: center; display: flex; flex-direction: column; align-items: center; }

.drw-select { height: 34px; padding: 0 8px; border-radius: 7px; border: 1px solid rgba(var(--v-theme-on-surface),0.15); background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); font-size: 12px; outline: none; }

.aviso-sin-repartir { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: rgba(var(--v-theme-on-surface),0.7); background: rgba(245,158,11,0.08); padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(245,158,11,0.15); }

.historial-chip { font-size: 11px; font-weight: 600; padding: 6px 10px; border-radius: 8px; background: rgba(var(--v-theme-on-surface),0.04); border: 1px solid rgba(var(--v-theme-on-surface),0.08); cursor: pointer; display: flex; align-items: center; gap: 6px; }
.historial-chip:hover { background: rgba(139,92,246,0.08); }
.historial-chip.activo { border-color: #8b5cf6; background: rgba(139,92,246,0.1); }

.pa-4 { padding: 16px; } .pb-2 { padding-bottom: 8px !important; } .pt-0 { padding-top: 0 !important; } .mt-3 { margin-top: 12px; }
</style>
