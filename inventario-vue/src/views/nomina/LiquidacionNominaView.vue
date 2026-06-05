<template>
  <MainLayout>
    <div class="nom-wrap">
      <div class="nom-header">
        <div class="nom-header-icon"><v-icon size="20" color="white">mdi-calculator-variant</v-icon></div>
        <div class="flex-1">
          <h1 class="nom-title">LIQUIDACIÓN DE NÓMINA</h1>
          <p class="nom-sub" v-if="liqActual">
            Semana {{ fmtFecha(liqActual.semana_inicio) }} — {{ fmtFecha(liqActual.semana_fin) }}
            <span class="estado-badge" :class="`estado-${liqActual.estado?.toLowerCase()}`">{{ liqActual.estado }}</span>
          </p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <select v-model="liqSelId" class="drw-select" @change="cargarDetalle" style="width:210px">
            <option value="">— Seleccionar nómina —</option>
            <option v-for="l in liquidaciones" :key="l.id" :value="l.id">
              {{ fmtFecha(l.semana_inicio) }} · {{ l.estado }}
            </option>
          </select>
          <v-btn size="small" color="#06b6d4" variant="outlined" @click="dlgNueva=true">
            <v-icon size="14" class="mr-1">mdi-plus</v-icon> Nueva
          </v-btn>
          <v-btn v-if="liqActual && liqActual.estado==='BORRADOR'" size="small" color="#8b5cf6" variant="flat"
                 :loading="calculando" @click="calcular">
            <v-icon size="14" class="mr-1">mdi-calculator</v-icon> Calcular
          </v-btn>
          <v-btn v-if="liqActual && liqActual.estado==='BORRADOR' && lineas.length"
                 size="small" color="#10b981" variant="flat" @click="aprobar">
            <v-icon size="14" class="mr-1">mdi-check-circle</v-icon> Aprobar
          </v-btn>
        </div>
      </div>

      <!-- KPI Row -->
      <div v-if="liqActual" class="liq-kpis">
        <div class="lkpi"><div class="lkpi-label">Bruto Total</div><div class="lkpi-val" style="color:#8b5cf6">${{ fmt(liqActual.total_bruto) }}</div></div>
        <div class="lkpi"><div class="lkpi-label">Deducciones Empleados</div><div class="lkpi-val" style="color:#ef4444">${{ fmt(liqActual.total_deducciones_emp) }}</div></div>
        <div class="lkpi"><div class="lkpi-label">Aportes Empleador</div><div class="lkpi-val" style="color:#f59e0b">${{ fmt(liqActual.total_aportes_er) }}</div></div>
        <div class="lkpi"><div class="lkpi-label">Neto a Pagar Empleados</div><div class="lkpi-val" style="color:#10b981">${{ fmt(liqActual.total_neto) }}</div></div>
        <div class="lkpi"><div class="lkpi-label">Costo Total Empresa</div><div class="lkpi-val" style="color:#06b6d4">${{ fmt((parseFloat(liqActual.total_bruto||0)+parseFloat(liqActual.total_aportes_er||0)).toFixed(2)) }}</div></div>
      </div>

      <!-- Tabla de líneas -->
      <div v-if="lineas.length" class="nom-card" style="overflow-x:auto">
        <table class="nom-table liq-table">
          <thead>
            <tr>
              <th>EMPLEADO</th><th>TIPO</th>
              <th class="ta-r">HRS REG</th><th class="ta-r">HRS OT</th>
              <th class="ta-r">$/HR</th><th class="ta-r">BRUTO</th>
              <th class="ta-r">FIT</th><th class="ta-r">SS</th><th class="ta-r">MED</th>
              <th class="ta-r">DEDUC.</th><th class="ta-r">NETO</th>
              <th class="ta-r">COST. EMP.</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in lineas" :key="l.id" class="nom-row">
              <td><strong>{{ l.apellido }}, {{ l.nombre }}</strong></td>
              <td><span class="nom-badge" :class="l.tipo_empleado==='W2'?'badge-w2':'badge-1099'">{{ l.tipo_empleado }}</span></td>
              <td class="ta-r">{{ l.horas_regulares?.toFixed(1) }}</td>
              <td class="ta-r" :class="l.horas_overtime > 0 ? 'ot-hrs':''">{{ l.horas_overtime?.toFixed(1) }}</td>
              <td class="ta-r">${{ fmt(l.valor_hora) }}</td>
              <td class="ta-r font-bold">${{ fmt(l.total_bruto) }}</td>
              <td class="ta-r text-dim">${{ fmt(l.federal_income_tax) }}</td>
              <td class="ta-r text-dim">${{ fmt(l.social_security_emp) }}</td>
              <td class="ta-r text-dim">${{ fmt(l.medicare_emp) }}</td>
              <td class="ta-r" style="color:#ef4444">${{ fmt(l.total_deducciones) }}</td>
              <td class="ta-r" style="color:#10b981;font-weight:700">${{ fmt(l.total_neto) }}</td>
              <td class="ta-r text-dim">${{ fmt((parseFloat(l.total_bruto||0)+parseFloat(l.total_aportes_er||0)).toFixed(2)) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="liqSelId && !cargando" class="nom-card" style="padding:32px;text-align:center;color:rgba(var(--v-theme-on-surface),0.4)">
        Nómina vacía. Haz clic en "Calcular" para procesar los datos del horario.
      </div>
    </div>

    <!-- Dialog nueva nómina -->
    <v-dialog v-model="dlgNueva" max-width="420">
      <v-card rounded="lg">
        <v-card-title class="pa-4" style="font-size:15px;font-weight:700">Nueva Nómina Semanal</v-card-title>
        <v-card-text>
          <div class="drw-field mb-3">
            <label>Semana publicada (opcional — para tomar horas)</label>
            <select v-model="nuevaLiqSemanaId" class="drw-select">
              <option value="">— Sin vincular —</option>
              <option v-for="s in semanasDisponibles" :key="s.id" :value="s.id">
                {{ fmtFecha(s.semana_inicio) }} — {{ s.estado }}
              </option>
            </select>
          </div>
          <div class="drw-grid-2">
            <div class="drw-field">
              <label>Inicio (Lunes)</label>
              <input v-model="nuevaLiqInicio" type="date" class="drw-input" @change="calcNuevaFin"/>
            </div>
            <div class="drw-field">
              <label>Fin (Domingo)</label>
              <input v-model="nuevaLiqFin" type="date" class="drw-input" readonly/>
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="dlgNueva=false">Cancelar</v-btn>
          <v-btn color="#8b5cf6" variant="flat" :loading="creandoLiq" @click="crearLiq">Crear</v-btn>
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

const liquidaciones = ref([])
const semanasDisponibles = ref([])
const liqSelId = ref('')
const liqActual = ref(null)
const lineas = ref([])
const cargando = ref(false)
const calculando = ref(false)

const dlgNueva = ref(false)
const nuevaLiqSemanaId = ref('')
const nuevaLiqInicio = ref('')
const nuevaLiqFin = ref('')
const creandoLiq = ref(false)

function calcNuevaFin() {
  if (!nuevaLiqInicio.value) return
  const d = new Date(nuevaLiqInicio.value + 'T00:00:00')
  // Auto-fill from linked semana if available
  const sem = semanasDisponibles.value.find(s => s.id == nuevaLiqSemanaId.value)
  if (sem) {
    nuevaLiqInicio.value = sem.semana_inicio?.split('T')[0]
    nuevaLiqFin.value    = sem.semana_fin?.split('T')[0]
  } else {
    d.setDate(d.getDate() + 6)
    nuevaLiqFin.value = d.toISOString().split('T')[0]
  }
}

async function cargar() {
  const [liqR, semR] = await Promise.all([
    api.get('/nomina/liquidaciones', { params: { empresa: empresa.value } }),
    api.get('/nomina/semanas',        { params: { empresa: empresa.value } }),
  ])
  liquidaciones.value      = liqR.data?.data || []
  semanasDisponibles.value = semR.data?.data || []
  if (liquidaciones.value.length && !liqSelId.value) {
    liqSelId.value = liquidaciones.value[0].id
    cargarDetalle()
  }
}

async function cargarDetalle() {
  if (!liqSelId.value) { liqActual.value = null; lineas.value = []; return }
  cargando.value = true
  try {
    const r = await api.get(`/nomina/liquidaciones/${liqSelId.value}`)
    liqActual.value = r.data.liquidacion
    lineas.value    = r.data.lineas || []
  } finally { cargando.value = false }
}

async function crearLiq() {
  if (!nuevaLiqInicio.value) return
  creandoLiq.value = true
  try {
    const r = await api.post('/nomina/liquidaciones', {
      empresa: empresa.value,
      semana_inicio: nuevaLiqInicio.value,
      semana_fin: nuevaLiqFin.value,
      semana_id: nuevaLiqSemanaId.value || null
    })
    dlgNueva.value = false
    await cargar()
    liqSelId.value = r.data.data?.id
    cargarDetalle()
  } catch(e) { alert(e?.response?.data?.error || e.message) }
  finally { creandoLiq.value = false }
}

async function calcular() {
  calculando.value = true
  try {
    await api.post(`/nomina/liquidaciones/${liqSelId.value}/calcular`, { empresa: empresa.value })
    cargarDetalle()
  } catch(e) { alert(e?.response?.data?.error || e.message) }
  finally { calculando.value = false }
}

async function aprobar() {
  if (!confirm('¿Aprobar esta nómina? Esta acción es irreversible.')) return
  await api.put(`/nomina/liquidaciones/${liqSelId.value}/aprobar`)
  cargarDetalle()
}

function fmtFecha(f) {
  if (!f) return '—'
  const s = String(f).split('T')[0]; const [y,m,d] = s.split('-')
  const meses = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${parseInt(d)} ${meses[parseInt(m)]} ${y}`
}
function fmt(v) { return parseFloat(v||0).toFixed(2) }

onMounted(cargar)
</script>
<style scoped>
.nom-wrap { display: flex; flex-direction: column; gap: 16px; }
.nom-header { display: flex; align-items: center; gap: 14px; background: linear-gradient(135deg,#1a0a2e,#3b1a5e); border-radius: 14px; padding: 20px 24px; flex-wrap: wrap; }
.nom-header-icon { width: 42px; height: 42px; border-radius: 10px; background: rgba(139,92,246,0.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nom-title { font-size: 17px; font-weight: 800; color: #fff; margin: 0; }
.nom-sub   { font-size: 12px; color: rgba(255,255,255,0.5); margin: 0; display: flex; align-items: center; gap: 8px; }
.flex-1 { flex: 1; }
.nom-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),0.07); border-radius: 14px; }
.estado-badge { font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 4px; }
.estado-borrador { background: rgba(148,163,184,0.15); color: #94a3b8; }
.estado-aprobada { background: rgba(16,185,129,0.15); color: #10b981; }
.estado-pagada   { background: rgba(6,182,212,0.15); color: #06b6d4; }

.liq-kpis { display: grid; grid-template-columns: repeat(auto-fit,minmax(160px,1fr)); gap: 10px; }
.lkpi { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),0.07); border-radius: 12px; padding: 14px 16px; }
.lkpi-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: rgba(var(--v-theme-on-surface),0.4); margin-bottom: 6px; }
.lkpi-val { font-size: 20px; font-weight: 800; }

.nom-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.nom-table thead { background: rgba(var(--v-theme-on-surface),0.04); }
.nom-table th { padding: 8px 10px; text-align: left; font-size: 9px; font-weight: 800; letter-spacing: 0.8px; color: rgba(var(--v-theme-on-surface),0.4); text-transform: uppercase; border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.08); white-space: nowrap; }
.nom-row td { padding: 10px 10px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.05); }
.nom-row:hover td { background: rgba(var(--v-theme-primary),0.03) !important; }
.ta-r { text-align: right; }
.font-bold { font-weight: 700; }
.text-dim { color: rgba(var(--v-theme-on-surface),0.55); }
.ot-hrs { color: #ef4444; font-weight: 700; }
.nom-badge { font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; }
.badge-w2   { background: rgba(139,92,246,0.15); color: #8b5cf6; }
.badge-1099 { background: rgba(245,158,11,0.15); color: #f59e0b; }
.drw-select { height: 34px; padding: 0 8px; border-radius: 7px; border: 1px solid rgba(var(--v-theme-on-surface),0.15); background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); font-size: 12px; outline: none; }
.drw-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.drw-field { display: flex; flex-direction: column; gap: 4px; }
.drw-field label { font-size: 10px; font-weight: 700; color: rgba(var(--v-theme-on-surface),0.5); text-transform: uppercase; }
.drw-input { height: 34px; padding: 0 8px; border-radius: 7px; border: 1px solid rgba(var(--v-theme-on-surface),0.15); background: rgba(var(--v-theme-on-surface),0.03); color: rgb(var(--v-theme-on-surface)); font-size: 12px; outline: none; width: 100%; }
.mb-3 { margin-bottom: 12px; }
</style>
