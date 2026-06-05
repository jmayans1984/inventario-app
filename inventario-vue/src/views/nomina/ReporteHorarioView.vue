<template>
  <MainLayout>
    <div class="nom-wrap">
      <div class="nom-header">
        <div class="nom-header-icon"><v-icon size="20" color="white">mdi-calendar-clock</v-icon></div>
        <div class="flex-1">
          <h1 class="nom-title">HORARIO SEMANAL — PARA PUBLICAR</h1>
          <p class="nom-sub">Genera el PDF para publicar en cada centro de costo</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <select v-model="semanaSelId" class="drw-select" style="width:220px" @change="cargarDetalle">
            <option value="">— Seleccionar semana —</option>
            <option v-for="s in semanas" :key="s.id" :value="s.id">
              {{ fmtFecha(s.semana_inicio) }} — {{ s.estado }}
            </option>
          </select>
          <v-btn color="#8b5cf6" variant="flat" size="small" :disabled="!semanaActual"
                 @click="imprimirPDF">
            <v-icon size="14" class="mr-1">mdi-printer</v-icon> Imprimir PDF
          </v-btn>
        </div>
      </div>

      <!-- Preview del horario -->
      <div v-if="semanaActual && empleadosUnicos.length" class="nom-card" id="horario-print">
        <div class="rh-titulo">HORARIO DE TRABAJO</div>
        <div class="rh-periodo">{{ fmtFecha(semanaActual.semana_inicio) }} — {{ fmtFecha(semanaActual.semana_fin) }}</div>

        <table class="rh-table">
          <thead>
            <tr>
              <th>EMPLEADO</th>
              <th v-for="d in DIAS" :key="d.offset">
                {{ d.label }}<br/><span class="rh-fecha">{{ fmtDiaMes(semanaActual.semana_inicio, d.offset) }}</span>
              </th>
              <th>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in empleadosUnicos" :key="emp.id">
              <td class="rh-emp">
                <div>{{ emp.apellido }}, {{ emp.nombre }}</div>
                <div class="rh-cargo">{{ emp.tipo_empleado }}</div>
              </td>
              <td v-for="d in DIAS" :key="d.offset" class="rh-turno">
                <template v-if="getTurno(emp.id, d.offset) && !getTurno(emp.id, d.offset).es_dia_libre">
                  <span class="rh-horas">
                    {{ getTurno(emp.id, d.offset).real_inicio?.slice(0,5) || getTurno(emp.id, d.offset).prog_inicio?.slice(0,5) || '' }}
                    <br/>{{ getTurno(emp.id, d.offset).real_fin?.slice(0,5) || getTurno(emp.id, d.offset).prog_fin?.slice(0,5) || '' }}
                    <br/><span class="rh-h">{{ (getTurno(emp.id, d.offset).real_horas ?? getTurno(emp.id, d.offset).prog_horas ?? 0).toFixed(1) }}h</span>
                  </span>
                </template>
                <template v-else-if="getTurno(emp.id, d.offset) && getTurno(emp.id, d.offset).es_dia_libre">
                  <span class="rh-libre">{{ getTurno(emp.id, d.offset).ausencia_tipo || 'LIBRE' }}</span>
                </template>
                <template v-else>
                  <span class="rh-libre">—</span>
                </template>
              </td>
              <td class="rh-total">{{ totalHorasEmp(emp.id).toFixed(1) }}h
                <span v-if="totalHorasEmp(emp.id) > 40" class="rh-ot">OT</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="rh-footer">
          Generado el {{ new Date().toLocaleDateString('es-US') }} · Total empleados: {{ empleadosUnicos.length }}
        </div>
      </div>

      <div v-else-if="!semanaSelId" class="nom-card" style="padding:32px;text-align:center;color:rgba(var(--v-theme-on-surface),0.35)">
        Selecciona una semana para ver el horario
      </div>
    </div>
  </MainLayout>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const empresa = computed(() => authStore.empresa || authStore.user?.empresa || localStorage.getItem('empresaActual') || '')

const DIAS = [
  {label:'Lunes',offset:0},{label:'Martes',offset:1},{label:'Miércoles',offset:2},
  {label:'Jueves',offset:3},{label:'Viernes',offset:4},{label:'Sábado',offset:5},{label:'Domingo',offset:6}
]

const semanas = ref([])
const semanaSelId = ref('')
const semanaActual = ref(null)
const detalle = ref([])

const empleadosUnicos = computed(() => {
  const map = {}
  detalle.value.forEach(d => { if (!map[d.empleado_id]) map[d.empleado_id] = { id:d.empleado_id, nombre:d.nombre, apellido:d.apellido, tipo_empleado:d.tipo_empleado }})
  return Object.values(map).sort((a,b) => a.apellido.localeCompare(b.apellido))
})

function getTurno(empId, offset) {
  if (!semanaActual.value) return null
  const fecha = addDays(semanaActual.value.semana_inicio, offset)
  return detalle.value.find(d => d.empleado_id === empId && d.fecha?.split('T')[0] === fecha) || null
}
function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00'); d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}
function totalHorasEmp(empId) {
  return detalle.value.filter(d => d.empleado_id === empId && !d.es_dia_libre)
    .reduce((s, d) => s + parseFloat(d.real_horas ?? d.prog_horas ?? 0), 0)
}
function fmtFecha(f) {
  if (!f) return '—'; const s = String(f).split('T')[0]; const [y,m,d] = s.split('-')
  const meses = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${parseInt(d)} ${meses[parseInt(m)]} ${y}`
}
function fmtDiaMes(inicio, offset) {
  const f = addDays(inicio, offset); const [,m,d] = f.split('-')
  return `${parseInt(d)}/${parseInt(m)}`
}

async function cargarSemanas() {
  const r = await api.get('/nomina/semanas', { params: { empresa: empresa.value } })
  semanas.value = r.data?.data || []
  if (semanas.value.length) { semanaSelId.value = semanas.value[0].id; cargarDetalle() }
}
async function cargarDetalle() {
  if (!semanaSelId.value) return
  const r = await api.get(`/nomina/semanas/${semanaSelId.value}/detalle`)
  semanaActual.value = r.data.semana; detalle.value = r.data.detalle || []
}
function imprimirPDF() { window.print() }

onMounted(cargarSemanas)
</script>
<style scoped>
.nom-wrap { display: flex; flex-direction: column; gap: 16px; }
.nom-header { display: flex; align-items: center; gap: 14px; background: linear-gradient(135deg,#0c2340,#1a3a6e); border-radius: 14px; padding: 20px 24px; flex-wrap: wrap; }
.nom-header-icon { width: 42px; height: 42px; border-radius: 10px; background: rgba(6,182,212,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nom-title { font-size: 17px; font-weight: 800; color: #fff; margin: 0; }
.nom-sub   { font-size: 12px; color: rgba(255,255,255,0.45); margin: 0; }
.flex-1 { flex: 1; }
.nom-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),0.07); border-radius: 14px; padding: 24px; overflow-x: auto; }
.drw-select { height: 34px; padding: 0 8px; border-radius: 7px; border: 1px solid rgba(var(--v-theme-on-surface),0.2); background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); font-size: 12px; outline: none; }

.rh-titulo { font-size: 20px; font-weight: 900; text-align: center; color: rgb(var(--v-theme-on-surface)); margin-bottom: 4px; letter-spacing: 1px; }
.rh-periodo { font-size: 13px; text-align: center; color: rgba(var(--v-theme-on-surface),0.55); margin-bottom: 16px; }
.rh-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.rh-table th { background: #1e3a5f; color: #fff; padding: 8px 10px; text-align: center; font-size: 11px; font-weight: 700; border: 1px solid rgba(255,255,255,0.15); }
.rh-table th:first-child { text-align: left; min-width: 150px; }
.rh-fecha { font-size: 9px; font-weight: 400; opacity: 0.7; }
.rh-emp { padding: 10px; border: 1px solid rgba(var(--v-theme-on-surface),0.1); font-weight: 600; }
.rh-cargo { font-size: 10px; color: rgba(var(--v-theme-on-surface),0.4); margin-top: 2px; }
.rh-turno { border: 1px solid rgba(var(--v-theme-on-surface),0.1); text-align: center; padding: 8px 6px; vertical-align: middle; }
.rh-horas { font-size: 11px; font-weight: 600; color: #06b6d4; line-height: 1.4; }
.rh-h { font-size: 10px; color: rgba(var(--v-theme-on-surface),0.5); }
.rh-libre { font-size: 9px; color: rgba(var(--v-theme-on-surface),0.3); text-transform: uppercase; }
.rh-total { border: 1px solid rgba(var(--v-theme-on-surface),0.1); text-align: center; font-weight: 700; font-size: 12px; white-space: nowrap; padding: 8px; }
.rh-ot { font-size: 9px; background: rgba(239,68,68,0.15); color: #ef4444; padding: 1px 4px; border-radius: 3px; display: block; margin-top: 2px; }
.rh-footer { font-size: 10px; color: rgba(var(--v-theme-on-surface),0.35); text-align: center; margin-top: 16px; }

@media print {
  .nom-header, .drw-select, button { display: none !important; }
  .nom-wrap { gap: 0; }
  .nom-card { border: none; padding: 0; }
  .rh-table th { background: #1e3a5f !important; -webkit-print-color-adjust: exact; }
}
</style>
