<template>
  <MainLayout>
    <div class="nom-wrap">
      <div class="nom-header">
        <div class="nom-header-icon"><v-icon size="20" color="white">mdi-file-document-outline</v-icon></div>
        <div class="flex-1">
          <h1 class="nom-title">RECIBOS DE PAGO — PAY STUBS</h1>
          <p class="nom-sub">Detalle de pago por empleado por período</p>
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

      <!-- Grid de recibos -->
      <div v-if="liqActual && lineas.length" class="recibos-grid" id="recibos-print">
        <div v-for="l in lineas" :key="l.id" class="recibo">
          <!-- Header -->
          <div class="rec-header">
            <div class="rec-empresa">{{ empresaNombre }}</div>
            <div class="rec-titulo">RECIBO DE PAGO</div>
            <div class="rec-periodo">{{ fmtFecha(liqActual.semana_inicio) }} — {{ fmtFecha(liqActual.semana_fin) }}</div>
          </div>

          <!-- Empleado -->
          <div class="rec-emp-row">
            <div>
              <div class="rec-emp-nombre">{{ l.apellido }}, {{ l.nombre }}</div>
              <div class="rec-emp-tipo">
                <span class="rec-badge" :class="l.tipo_empleado==='W2'?'badge-w2':'badge-1099'">{{ l.tipo_empleado }}</span>
                {{ l.tipo_empleado === 'W2' ? 'Employee' : 'Independent Contractor' }}
              </div>
            </div>
            <div class="rec-neto-big">
              <div style="font-size:10px;color:rgba(255,255,255,0.5)">NET PAY</div>
              <div>${{ fmt(l.total_neto) }}</div>
            </div>
          </div>

          <!-- Earnings -->
          <div class="rec-section-title">EARNINGS</div>
          <table class="rec-table">
            <thead><tr><th>DESCRIPTION</th><th>HOURS</th><th>RATE</th><th>AMOUNT</th></tr></thead>
            <tbody>
              <tr v-if="l.horas_regulares > 0">
                <td>Regular Pay</td>
                <td class="ta-r">{{ l.horas_regulares?.toFixed(2) }}</td>
                <td class="ta-r">${{ fmt(l.valor_hora) }}</td>
                <td class="ta-r">${{ fmt(l.bruto_regular) }}</td>
              </tr>
              <tr v-if="l.horas_overtime > 0">
                <td>Overtime Pay (1.5×)</td>
                <td class="ta-r">{{ l.horas_overtime?.toFixed(2) }}</td>
                <td class="ta-r">${{ fmt(l.valor_hora_ot) }}</td>
                <td class="ta-r">${{ fmt(l.bruto_overtime) }}</td>
              </tr>
              <tr v-if="l.bruto_base > 0">
                <td>{{ l.es_monto_fijo ? 'Fixed Weekly Amount' : 'Base Salary' }}</td>
                <td class="ta-r">—</td>
                <td class="ta-r">—</td>
                <td class="ta-r">${{ fmt(l.bruto_base) }}</td>
              </tr>
              <tr class="rec-total-row">
                <td colspan="3"><strong>Gross Pay</strong></td>
                <td class="ta-r"><strong>${{ fmt(l.total_bruto) }}</strong></td>
              </tr>
            </tbody>
          </table>

          <!-- Deductions (W2 only) -->
          <template v-if="l.tipo_empleado === 'W2'">
            <div class="rec-section-title">DEDUCTIONS</div>
            <table class="rec-table">
              <tbody>
                <tr v-if="l.federal_income_tax > 0">
                  <td>Federal Income Tax</td><td class="ta-r">${{ fmt(l.federal_income_tax) }}</td>
                </tr>
                <tr v-if="l.social_security_emp > 0">
                  <td>Social Security (6.2%)</td><td class="ta-r">${{ fmt(l.social_security_emp) }}</td>
                </tr>
                <tr v-if="l.medicare_emp > 0">
                  <td>Medicare (1.45%)</td><td class="ta-r">${{ fmt(l.medicare_emp) }}</td>
                </tr>
                <tr v-if="l.medicare_adicional > 0">
                  <td>Additional Medicare (0.9%)</td><td class="ta-r">${{ fmt(l.medicare_adicional) }}</td>
                </tr>
                <tr v-if="l.workers_comp > 0">
                  <td>Workers' Compensation</td><td class="ta-r">${{ fmt(l.workers_comp) }}</td>
                </tr>
                <tr v-if="l.otras_deducciones > 0">
                  <td>Other Deductions</td><td class="ta-r">${{ fmt(l.otras_deducciones) }}</td>
                </tr>
                <tr class="rec-total-row">
                  <td><strong>Total Deductions</strong></td>
                  <td class="ta-r"><strong>${{ fmt(l.total_deducciones) }}</strong></td>
                </tr>
              </tbody>
            </table>

            <div class="rec-section-title" style="font-size:9px;color:rgba(var(--v-theme-on-surface),0.35)">
              EMPLOYER CONTRIBUTIONS (informativo)
            </div>
            <table class="rec-table" style="font-size:10px;opacity:0.6">
              <tbody>
                <tr><td>Social Security (employer)</td><td class="ta-r">${{ fmt(l.social_security_er) }}</td></tr>
                <tr><td>Medicare (employer)</td><td class="ta-r">${{ fmt(l.medicare_er) }}</td></tr>
                <tr v-if="l.futa > 0"><td>FUTA</td><td class="ta-r">${{ fmt(l.futa) }}</td></tr>
                <tr v-if="l.suta > 0"><td>FL Reemployment Tax</td><td class="ta-r">${{ fmt(l.suta) }}</td></tr>
              </tbody>
            </table>
          </template>

          <!-- Net Pay footer -->
          <div class="rec-net-footer">
            <div>
              <div style="font-size:10px;color:rgba(var(--v-theme-on-surface),0.5)">YTD Gross</div>
              <div style="font-size:13px;font-weight:700">${{ fmt(l.ytd_bruto) }}</div>
            </div>
            <div class="rec-net-amount">
              <div style="font-size:10px">NET PAY</div>
              <div>${{ fmt(l.total_neto) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="!liqSelId" class="nom-card" style="padding:32px;text-align:center;color:rgba(var(--v-theme-on-surface),0.35)">
        Selecciona una nómina aprobada para ver los recibos
      </div>
    </div>
  </MainLayout>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'

const authStore  = useAuthStore()
const empresa    = computed(() => authStore.empresa || authStore.user?.empresa || localStorage.getItem('empresaActual') || '')
const empresaNombre = computed(() => authStore.empresaNombre || 'Mi Empresa')

const liquidaciones = ref([])
const liqSelId = ref('')
const liqActual = ref(null)
const lineas = ref([])

async function cargar() {
  const r = await api.get('/nomina/liquidaciones', { params: { empresa: empresa.value } })
  liquidaciones.value = r.data?.data || []
  if (liquidaciones.value.length) { liqSelId.value = liquidaciones.value[0].id; cargarLineas() }
}
async function cargarLineas() {
  if (!liqSelId.value) return
  const r = await api.get(`/nomina/liquidaciones/${liqSelId.value}`)
  liqActual.value = r.data.liquidacion
  lineas.value = r.data.lineas || []
}
function fmtFecha(f) {
  if (!f) return '—'; const s = String(f).split('T')[0]; const [y,m,d] = s.split('-')
  const meses = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${parseInt(d)} ${meses[parseInt(m)]} ${y}`
}
function fmt(v) { return parseFloat(v||0).toFixed(2) }
function imprimirTodos() { window.print() }

onMounted(cargar)
</script>
<style scoped>
.nom-wrap { display: flex; flex-direction: column; gap: 16px; }
.nom-header { display: flex; align-items: center; gap: 14px; background: linear-gradient(135deg,#1a0a2e,#2d1b69); border-radius: 14px; padding: 20px 24px; flex-wrap: wrap; }
.nom-header-icon { width: 42px; height: 42px; border-radius: 10px; background: rgba(139,92,246,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nom-title { font-size: 17px; font-weight: 800; color: #fff; margin: 0; }
.nom-sub   { font-size: 12px; color: rgba(255,255,255,0.45); margin: 0; }
.flex-1 { flex: 1; }
.drw-select { height: 34px; padding: 0 8px; border-radius: 7px; border: 1px solid rgba(var(--v-theme-on-surface),0.2); background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); font-size: 12px; outline: none; }

.recibos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px,1fr)); gap: 16px; }
.recibo { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),0.1); border-radius: 12px; overflow: hidden; break-inside: avoid; }

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
.rec-total-row td { background: rgba(var(--v-theme-on-surface),0.04); font-size: 12px; padding: 6px 10px; }
.ta-r { text-align: right; }

.rec-net-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(16,185,129,0.06); border-top: 1px solid rgba(16,185,129,0.15); }
.rec-net-amount { font-size: 20px; font-weight: 800; color: #10b981; text-align: right; }

@media print {
  .nom-header, .drw-select, button { display: none !important; }
  .nom-wrap { gap: 0; }
  .recibos-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
  .recibo { page-break-inside: avoid; }
  .rec-header { background: #1e3a5f !important; -webkit-print-color-adjust: exact; }
}
</style>
