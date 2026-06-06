<template>
  <MainLayout>
    <div class="nom-wrap">
      <!-- HEADER -->
      <div class="nom-header">
        <div class="nom-header-icon"><v-icon size="20" color="white">mdi-file-document-outline</v-icon></div>
        <div class="flex-1">
          <h1 class="nom-title">RECIBOS DE PAGO — PAY STUBS</h1>
          <p class="nom-sub" v-if="liqActual">
            {{ fmtFecha(liqActual.semana_inicio) }} — {{ fmtFecha(liqActual.semana_fin) }}
            <span class="estado-badge" :class="`estado-${liqActual.estado?.toLowerCase()}`">{{ liqActual.estado }}</span>
          </p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <select v-model="liqSelId" class="drw-select" style="width:220px" @change="cargarLineas">
            <option value="">— Seleccionar nómina —</option>
            <option v-for="l in liquidaciones" :key="l.id" :value="l.id">
              {{ fmtFecha(l.semana_inicio) }} · {{ l.estado }}
            </option>
          </select>
          <v-btn v-if="lineas.length" size="small" color="#8b5cf6" variant="flat" @click="imprimirTodos">
            <v-icon size="14" class="mr-1">mdi-printer</v-icon> Imprimir Todos
          </v-btn>
        </div>
      </div>

      <!-- GRID DE RECIBOS (preview en pantalla) -->
      <div v-if="cargando" class="nom-card" style="padding:32px;text-align:center">
        <v-progress-circular indeterminate color="#8b5cf6" size="28"/>
      </div>

      <div v-else-if="liqActual && lineas.length" class="recibos-grid">
        <div v-for="l in lineas" :key="l.id" class="recibo">
          <!-- Header azul -->
          <div class="rec-header">
            <div class="rec-empresa">{{ empresaNombre }}</div>
            <div class="rec-titulo">RECIBO DE PAGO</div>
            <div class="rec-periodo">{{ fmtFecha(liqActual.semana_inicio) }} — {{ fmtFecha(liqActual.semana_fin) }}</div>
          </div>

          <!-- Empleado + NET PAY -->
          <div class="rec-emp-row">
            <div>
              <div class="rec-emp-nombre">{{ getNombreDisplay(l) }}</div>
              <div class="rec-emp-tipo">
                <span class="rec-badge" :class="l.tipo_empleado==='W2'?'badge-w2':'badge-1099'">{{ l.tipo_empleado }}</span>
                {{ l.tipo_empleado === 'W2' ? 'Employee' : 'Independent Contractor' }}
              </div>
            </div>
            <div class="rec-neto-big">
              <div style="font-size:10px;color:rgba(255,255,255,0.5)">NET PAY</div>
              <div>{{ fmtMoney(l.total_neto) }}</div>
            </div>
          </div>

          <!-- EARNINGS -->
          <div class="rec-section-title">EARNINGS</div>
          <table class="rec-table">
            <thead><tr><th>DESCRIPTION</th><th class="ta-r">HOURS</th><th class="ta-r">RATE</th><th class="ta-r">AMOUNT</th></tr></thead>
            <tbody>
              <tr v-if="parseFloat(l.horas_regulares)>0">
                <td>Regular Pay</td>
                <td class="ta-r">{{ fmtNum(l.horas_regulares) }}</td>
                <td class="ta-r">{{ fmtMoney(l.valor_hora) }}/h</td>
                <td class="ta-r">{{ fmtMoney(l.bruto_regular) }}</td>
              </tr>
              <tr v-if="parseFloat(l.horas_overtime)>0">
                <td>Overtime Pay (1.5×)</td>
                <td class="ta-r">{{ fmtNum(l.horas_overtime) }}</td>
                <td class="ta-r">{{ fmtMoney(l.valor_hora_ot) }}/h</td>
                <td class="ta-r">{{ fmtMoney(l.bruto_overtime) }}</td>
              </tr>
              <tr v-if="parseFloat(l.bruto_base)>0">
                <td>{{ l.es_monto_fijo ? 'Fixed Weekly Amount' : 'Base Salary' }}</td>
                <td class="ta-r">—</td><td class="ta-r">—</td>
                <td class="ta-r">{{ fmtMoney(l.bruto_base) }}</td>
              </tr>
              <tr class="rec-total-row">
                <td colspan="3"><strong>Gross Pay</strong></td>
                <td class="ta-r"><strong>{{ fmtMoney(l.total_bruto) }}</strong></td>
              </tr>
            </tbody>
          </table>

          <!-- DEDUCTIONS (W2) -->
          <template v-if="l.tipo_empleado==='W2'">
            <div class="rec-section-title">DEDUCTIONS</div>
            <table class="rec-table">
              <tbody>
                <tr v-if="parseFloat(l.federal_income_tax)>0">
                  <td>Federal Income Tax (FIT)</td><td class="ta-r">-{{ fmtMoney(l.federal_income_tax) }}</td>
                </tr>
                <tr v-if="parseFloat(l.social_security_emp)>0">
                  <td>Social Security (6.2%)</td><td class="ta-r">-{{ fmtMoney(l.social_security_emp) }}</td>
                </tr>
                <tr v-if="parseFloat(l.medicare_emp)>0">
                  <td>Medicare (1.45%)</td><td class="ta-r">-{{ fmtMoney(l.medicare_emp) }}</td>
                </tr>
                <tr v-if="parseFloat(l.medicare_adicional)>0">
                  <td>Additional Medicare (0.9%)</td><td class="ta-r">-{{ fmtMoney(l.medicare_adicional) }}</td>
                </tr>
                <tr v-if="parseFloat(l.workers_comp)>0">
                  <td>Workers' Compensation</td><td class="ta-r">-{{ fmtMoney(l.workers_comp) }}</td>
                </tr>
                <tr v-if="parseFloat(l.otras_deducciones)>0">
                  <td>Other Deductions</td><td class="ta-r">-{{ fmtMoney(l.otras_deducciones) }}</td>
                </tr>
                <tr class="rec-total-row">
                  <td><strong>Total Deductions</strong></td>
                  <td class="ta-r" style="color:#ef4444"><strong>-{{ fmtMoney(l.total_deducciones) }}</strong></td>
                </tr>
              </tbody>
            </table>

            <!-- Employer (info only) -->
            <div class="rec-section-title" style="opacity:0.5">EMPLOYER CONTRIBUTIONS (informativo)</div>
            <table class="rec-table" style="opacity:0.55;font-size:10px">
              <tbody>
                <tr><td>Social Security (employer 6.2%)</td><td class="ta-r">{{ fmtMoney(l.social_security_er) }}</td></tr>
                <tr><td>Medicare (employer 1.45%)</td><td class="ta-r">{{ fmtMoney(l.medicare_er) }}</td></tr>
                <tr v-if="parseFloat(l.futa)>0"><td>FUTA</td><td class="ta-r">{{ fmtMoney(l.futa) }}</td></tr>
                <tr v-if="parseFloat(l.suta)>0"><td>FL Reemployment Tax</td><td class="ta-r">{{ fmtMoney(l.suta) }}</td></tr>
              </tbody>
            </table>
          </template>

          <!-- NET PAY FOOTER -->
          <div class="rec-net-footer">
            <div>
              <div class="rec-ytd-label">YTD Gross</div>
              <div class="rec-ytd-val">{{ fmtMoney(l.ytd_bruto) }}</div>
            </div>
            <div class="rec-net-amount">
              <div style="font-size:10px;opacity:0.7">NET PAY</div>
              <div>{{ fmtMoney(l.total_neto) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="liqSelId && !cargando" class="nom-card estado-vacio">
        <v-icon size="40" color="rgba(var(--v-theme-on-surface),0.15)">mdi-file-document-outline</v-icon>
        <div style="margin-top:10px;font-weight:700">Sin líneas de nómina</div>
        <div style="font-size:12px;color:rgba(var(--v-theme-on-surface),0.4);margin-top:4px">
          Esta nómina no tiene recibos calculados. Calcula la nómina primero.
        </div>
      </div>
      <div v-else-if="!liqSelId" class="nom-card estado-vacio">
        <v-icon size="40" color="rgba(var(--v-theme-on-surface),0.15)">mdi-cash-register</v-icon>
        <div style="margin-top:10px;font-weight:700">Selecciona una nómina</div>
        <div style="font-size:12px;color:rgba(var(--v-theme-on-surface),0.4);margin-top:4px">
          Elige una nómina aprobada del selector para ver los recibos de pago.
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'

const authStore     = useAuthStore()
const empresa       = computed(() => authStore.empresa || authStore.user?.empresa || localStorage.getItem('empresaActual') || '')
const empresaNombre = computed(() => authStore.empresaNombre || authStore.user?.empresaNombre || 'Mi Empresa')

const liquidaciones = ref([])
const liqSelId  = ref('')
const liqActual = ref(null)
const lineas    = ref([])
const cargando  = ref(false)

// Parseo de fecha robusto — PostgreSQL devuelve Date objects
function fmtFecha(f) {
  if (!f) return '—'
  try {
    let dateStr
    if (f instanceof Date) {
      const y = f.getUTCFullYear()
      const m = String(f.getUTCMonth()+1).padStart(2,'0')
      const d = String(f.getUTCDate()).padStart(2,'0')
      dateStr = `${y}-${m}-${d}`
    } else {
      dateStr = String(f).split('T')[0]
    }
    const [y, m, d] = dateStr.split('-')
    const meses = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    return `${parseInt(d)} ${meses[parseInt(m)]} ${y}`
  } catch { return String(f) }
}

function fmtMoney(v) {
  return '$' + parseFloat(v||0).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })
}
function fmtNum(v) { return parseFloat(v||0).toFixed(2) }

function getNombreDisplay(emp) {
  if (emp.tipo_empleado === '1099' && emp.empresa_contratista) {
    return `${emp.apellido}, ${emp.nombre} — ${emp.empresa_contratista}`
  }
  return `${emp.apellido}, ${emp.nombre}`
}

async function cargar() {
  try {
    const r = await api.get('/nomina/liquidaciones', { params: { empresa: empresa.value } })
    liquidaciones.value = r.data?.data || []
    if (liquidaciones.value.length) {
      liqSelId.value = liquidaciones.value[0].id
      await cargarLineas()
    }
  } catch(e) { console.error('Error cargando liquidaciones:', e) }
}

async function cargarLineas() {
  if (!liqSelId.value) { liqActual.value = null; lineas.value = []; return }
  cargando.value = true
  try {
    const r = await api.get(`/nomina/liquidaciones/${liqSelId.value}`)
    liqActual.value = r.data.liquidacion
    lineas.value = r.data.lineas || []
  } catch(e) {
    console.error('Error cargando líneas:', e)
    liqActual.value = null
    lineas.value = []
  } finally { cargando.value = false }
}

function imprimirTodos() {
  if (!lineas.value.length || !liqActual.value) return

  const ventana = window.open('', '_blank')
  if (!ventana) { alert('Activa los pop-ups para imprimir los recibos'); return }

  const periodo = `${fmtFecha(liqActual.value.semana_inicio)} — ${fmtFecha(liqActual.value.semana_fin)}`
  const empNombre = empresaNombre.value

  const estilos = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; background: white; color: #111; }
    .pagina { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 12px; }
    @media print { .pagina { gap: 8px; } }
    .recibo { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; break-inside: avoid; page-break-inside: avoid; }
    .rec-header { background: #1e3a5f; padding: 10px 14px; }
    .rec-empresa { font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.8px; }
    .rec-titulo  { font-size: 14px; font-weight: 800; color: white; margin: 2px 0; }
    .rec-periodo { font-size: 10px; color: rgba(255,255,255,0.55); }
    .rec-emp-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid #eee; }
    .rec-emp-nombre { font-size: 13px; font-weight: 700; }
    .rec-emp-tipo   { font-size: 10px; color: #888; margin-top: 2px; }
    .rec-badge { font-size: 8px; font-weight: 800; padding: 1px 5px; border-radius: 3px; margin-right: 4px; }
    .badge-w2   { background: #ede9fe; color: #7c3aed; }
    .badge-1099 { background: #fef3c7; color: #b45309; }
    .rec-neto-big { text-align: right; font-size: 20px; font-weight: 800; color: #059669; }
    .rec-neto-big .label { font-size: 9px; color: #888; }
    .sec-title { font-size: 8px; font-weight: 800; letter-spacing: 0.8px; color: #999; text-transform: uppercase; padding: 5px 14px 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { padding: 3px 8px; text-align: left; font-size: 8px; font-weight: 800; color: #999; text-transform: uppercase; background: #f9f9f9; }
    th.ta-r { text-align: right; }
    td { padding: 3px 8px; border-bottom: 1px solid #f0f0f0; }
    td.ta-r { text-align: right; }
    tr.total td { background: #f5f5f5; font-weight: 700; font-size: 11px; padding: 5px 8px; }
    .rec-footer { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #f0fdf4; border-top: 1px solid #bbf7d0; }
    .rec-ytd { font-size: 10px; color: #444; }
    .rec-net { font-size: 18px; font-weight: 800; color: #059669; text-align: right; }
    @media print {
      .recibo { page-break-inside: avoid; }
      .rec-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .rec-footer  { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `

  const genRecibo = (l) => {
    const nombre = getNombreDisplay(l)
    const esW2 = l.tipo_empleado === 'W2'
    const badge = `<span class="rec-badge ${esW2?'badge-w2':'badge-1099'}">${l.tipo_empleado}</span>`
    const tipo = esW2 ? 'Employee' : 'Independent Contractor'

    let earnings = ''
    if (parseFloat(l.horas_regulares)>0) earnings += `
      <tr><td>Regular Pay</td><td class="ta-r">${fmtNum(l.horas_regulares)}</td>
      <td class="ta-r">${fmtMoney(l.valor_hora)}</td><td class="ta-r">${fmtMoney(l.bruto_regular)}</td></tr>`
    if (parseFloat(l.horas_overtime)>0) earnings += `
      <tr><td>Overtime (1.5×)</td><td class="ta-r">${fmtNum(l.horas_overtime)}</td>
      <td class="ta-r">${fmtMoney(l.valor_hora_ot)}</td><td class="ta-r">${fmtMoney(l.bruto_overtime)}</td></tr>`
    if (parseFloat(l.bruto_base)>0) earnings += `
      <tr><td>${l.es_monto_fijo?'Fixed Weekly':'Base Salary'}</td><td class="ta-r">—</td>
      <td class="ta-r">—</td><td class="ta-r">${fmtMoney(l.bruto_base)}</td></tr>`

    let deductions = ''
    if (esW2) {
      if (parseFloat(l.federal_income_tax)>0) deductions += `<tr><td>Federal Income Tax</td><td class="ta-r">-${fmtMoney(l.federal_income_tax)}</td></tr>`
      if (parseFloat(l.social_security_emp)>0) deductions += `<tr><td>Social Security (6.2%)</td><td class="ta-r">-${fmtMoney(l.social_security_emp)}</td></tr>`
      if (parseFloat(l.medicare_emp)>0) deductions += `<tr><td>Medicare (1.45%)</td><td class="ta-r">-${fmtMoney(l.medicare_emp)}</td></tr>`
      if (parseFloat(l.workers_comp)>0) deductions += `<tr><td>Workers' Comp</td><td class="ta-r">-${fmtMoney(l.workers_comp)}</td></tr>`
    }

    return `
    <div class="recibo">
      <div class="rec-header">
        <div class="rec-empresa">${empNombre}</div>
        <div class="rec-titulo">RECIBO DE PAGO</div>
        <div class="rec-periodo">${periodo}</div>
      </div>
      <div class="rec-emp-row">
        <div>
          <div class="rec-emp-nombre">${nombre}</div>
          <div class="rec-emp-tipo">${badge} ${tipo}</div>
        </div>
        <div class="rec-neto-big">
          <div class="label">NET PAY</div>
          ${fmtMoney(l.total_neto)}
        </div>
      </div>
      <div class="sec-title">EARNINGS</div>
      <table><thead><tr><th>DESCRIPTION</th><th class="ta-r">HRS</th><th class="ta-r">RATE</th><th class="ta-r">AMOUNT</th></tr></thead>
      <tbody>${earnings}<tr class="total"><td colspan="3">Gross Pay</td><td class="ta-r">${fmtMoney(l.total_bruto)}</td></tr></tbody></table>
      ${esW2 && deductions ? `
      <div class="sec-title">DEDUCTIONS</div>
      <table><tbody>${deductions}
      <tr class="total"><td>Total Deductions</td><td class="ta-r">-${fmtMoney(l.total_deducciones)}</td></tr></tbody></table>` : ''}
      <div class="rec-footer">
        <div class="rec-ytd"><div style="font-size:8px;color:#888">YTD GROSS</div>${fmtMoney(l.ytd_bruto)}</div>
        <div class="rec-net"><div style="font-size:8px;color:#888">NET PAY</div>${fmtMoney(l.total_neto)}</div>
      </div>
    </div>`
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Recibos de Pago — ${periodo}</title>
    <style>${estilos}</style></head>
    <body><div class="pagina">${lineas.value.map(genRecibo).join('')}</div></body></html>`

  ventana.document.write(html)
  ventana.document.close()
  ventana.focus()
  setTimeout(() => ventana.print(), 500)
}

onMounted(cargar)
</script>

<style scoped>
.nom-wrap { display: flex; flex-direction: column; gap: 16px; }
.nom-header { display: flex; align-items: center; gap: 14px; background: linear-gradient(135deg,#1a0a2e,#2d1b69); border-radius: 14px; padding: 20px 24px; flex-wrap: wrap; }
.nom-header-icon { width: 42px; height: 42px; border-radius: 10px; background: rgba(139,92,246,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nom-title { font-size: 17px; font-weight: 800; color: #fff; margin: 0; }
.nom-sub   { font-size: 12px; color: rgba(255,255,255,0.5); margin: 0; display: flex; align-items: center; gap: 8px; }
.flex-1 { flex: 1; }
.nom-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),0.07); border-radius: 14px; }
.drw-select { height: 34px; padding: 0 8px; border-radius: 7px; border: 1px solid rgba(var(--v-theme-on-surface),0.2); background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); font-size: 12px; outline: none; }

.estado-badge { font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 4px; }
.estado-borrador  { background: rgba(148,163,184,0.15); color: #94a3b8; }
.estado-aprobada  { background: rgba(16,185,129,0.15);  color: #10b981; }
.estado-pagada    { background: rgba(6,182,212,0.15);   color: #06b6d4; }

.recibos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(390px,1fr)); gap: 16px; }
.recibo { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),0.1); border-radius: 12px; overflow: hidden; }

.rec-header { background: #1e3a5f; padding: 12px 16px; }
.rec-empresa { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.8px; }
.rec-titulo  { font-size: 15px; font-weight: 800; color: #fff; margin: 2px 0; }
.rec-periodo { font-size: 11px; color: rgba(255,255,255,0.55); }

.rec-emp-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.08); }
.rec-emp-nombre { font-size: 14px; font-weight: 700; }
.rec-emp-tipo { font-size: 11px; color: rgba(var(--v-theme-on-surface),0.5); display: flex; align-items: center; gap: 6px; margin-top: 2px; }
.rec-badge { font-size: 9px; font-weight: 800; padding: 2px 5px; border-radius: 3px; }
.badge-w2   { background: rgba(139,92,246,0.15); color: #8b5cf6; }
.badge-1099 { background: rgba(245,158,11,0.15); color: #f59e0b; }
.rec-neto-big { text-align: right; font-size: 22px; font-weight: 800; color: #10b981; }

.rec-section-title { font-size: 9px; font-weight: 800; letter-spacing: 0.8px; color: rgba(var(--v-theme-on-surface),0.45); text-transform: uppercase; padding: 6px 16px 3px; }
.rec-table { width: 100%; border-collapse: collapse; font-size: 11px; }
.rec-table th { padding: 4px 10px; text-align: left; font-size: 9px; font-weight: 800; color: rgba(var(--v-theme-on-surface),0.4); text-transform: uppercase; background: rgba(var(--v-theme-on-surface),0.03); }
.rec-table td { padding: 4px 10px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.05); }
.rec-total-row td { background: rgba(var(--v-theme-on-surface),0.04); font-size: 12px; padding: 6px 10px; border-top: 1px solid rgba(var(--v-theme-on-surface),0.1); }
.ta-r { text-align: right !important; }

.rec-net-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(16,185,129,0.06); border-top: 1px solid rgba(16,185,129,0.15); }
.rec-ytd-label { font-size: 9px; color: rgba(var(--v-theme-on-surface),0.45); text-transform: uppercase; letter-spacing: 0.5px; }
.rec-ytd-val   { font-size: 13px; font-weight: 700; }
.rec-net-amount { font-size: 20px; font-weight: 800; color: #10b981; text-align: right; }

.estado-vacio { padding: 40px; text-align: center; display: flex; flex-direction: column; align-items: center; }
</style>
