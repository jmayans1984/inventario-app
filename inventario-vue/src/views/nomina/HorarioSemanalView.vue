<template>
  <MainLayout>
    <div class="nom-wrap">
      <!-- HEADER -->
      <div class="nom-header">
        <div class="nom-header-icon"><v-icon size="20" color="white">mdi-calendar-week</v-icon></div>
        <div class="flex-1">
          <h1 class="nom-title">HORARIO SEMANAL</h1>
          <p class="nom-sub" v-if="semanaActual">
            {{ fmtFecha(semanaActual.semana_inicio) }} — {{ fmtFecha(semanaActual.semana_fin) }}
            <span class="estado-badge" :class="`estado-${semanaActual.estado?.toLowerCase()}`">
              {{ semanaActual.estado }}
            </span>
          </p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <select v-model="semanaSelId" class="drw-select" @change="cargarDetalle" style="width:200px">
            <option value="">— Seleccionar semana —</option>
            <option v-for="s in semanas" :key="s.id" :value="s.id">
              {{ fmtFecha(s.semana_inicio) }} al {{ fmtFecha(s.semana_fin) }}
            </option>
          </select>
          <select v-if="semanaActual" v-model="ccostoSelId" class="drw-select" style="width:200px">
            <option value="">— Todos los centros —</option>
            <option v-for="c in ccostos" :key="c.codigo" :value="c.codigo">
              {{ c.nombre }}
            </option>
          </select>
          <v-btn size="small" variant="outlined" color="#06b6d4" @click="dlgNuevaSemana=true">
            <v-icon size="14" class="mr-1">mdi-plus</v-icon> Nueva Semana
          </v-btn>
          <v-btn v-if="semanaActual && semanaActual.estado==='BORRADOR'"
                 size="small" color="#10b981" variant="flat" @click="generarHorario">
            <v-icon size="14" class="mr-1">mdi-auto-fix</v-icon> Generar desde Plantilla
          </v-btn>
          <v-btn v-if="semanaActual && semanaActual.estado==='BORRADOR'"
                 size="small" color="#f59e0b" variant="flat" @click="publicar">
            <v-icon size="14" class="mr-1">mdi-send</v-icon> Publicar
          </v-btn>
          <v-btn v-if="semanaActual" size="small" color="#8b5cf6" variant="flat"
                 @click="$router.push('/nomina/reportes/horario')">
            <v-icon size="14" class="mr-1">mdi-printer</v-icon> Imprimir
          </v-btn>
        </div>
      </div>

      <!-- GRILLA SEMANAL -->
      <div v-if="semanaActual && semanaActual.semana_inicio && detalle.length" class="nom-card">
        <div class="semana-grid" :style="`grid-template-columns: 180px repeat(${DIAS.length}, 1fr)`">
          <!-- Header días -->
          <div class="sg-header-emp">EMPLEADO</div>
          <div v-for="d in DIAS" :key="d.offset" class="sg-header-dia">
            <div class="sg-dia-nombre">{{ d.label }}</div>
            <div class="sg-dia-fecha">{{ fmtDiaMes(semanaActual.semana_inicio, d.offset) }}</div>
          </div>
          <!-- Filas por empleado -->
          <template v-for="emp in empleadosUnicos" :key="emp.id">
            <div class="sg-emp-cell">
              <div class="sg-emp-nombre">{{ getNombreDisplay(emp) }}</div>
              <span class="sg-emp-badge" :class="emp.tipo_empleado==='W2'?'badge-w2':'badge-1099'">{{ emp.tipo_empleado }}</span>
            </div>
            <div v-for="d in DIAS" :key="d.offset" class="sg-turno-cell"
                 @click="abrirEditar(emp, d.offset)">
              <template v-if="getTurno(emp.id, semanaActual.semana_inicio, d.offset)">
                <div class="sg-turno-horas">
                  {{ getTurno(emp.id, semanaActual.semana_inicio, d.offset)?.real_inicio?.slice(0,5) || getTurno(emp.id, semanaActual.semana_inicio, d.offset)?.prog_inicio?.slice(0,5) || '—' }}
                  –
                  {{ getTurno(emp.id, semanaActual.semana_inicio, d.offset)?.real_fin?.slice(0,5) || getTurno(emp.id, semanaActual.semana_inicio, d.offset)?.prog_fin?.slice(0,5) || '—' }}
                </div>
                <div class="sg-turno-total" v-if="!getTurno(emp.id, semanaActual.semana_inicio, d.offset)?.es_dia_libre"
                     :class="getTurno(emp.id, semanaActual.semana_inicio, d.offset)?.ajustado ? 'ajustado':''">
                  {{ (getTurno(emp.id, semanaActual.semana_inicio, d.offset)?.real_horas ?? getTurno(emp.id, semanaActual.semana_inicio, d.offset)?.prog_horas ?? 0).toFixed(1) }}h
                </div>
                <div class="sg-libre" v-if="getTurno(emp.id, semanaActual.semana_inicio, d.offset)?.es_dia_libre">
                  {{ getTurno(emp.id, semanaActual.semana_inicio, d.offset)?.ausencia_tipo || 'LIBRE' }}
                </div>
              </template>
              <template v-else>
                <div class="sg-sin-turno">+</div>
              </template>
            </div>
          </template>
        </div>

        <!-- Totales por empleado -->
        <div class="sg-totales">
          <div v-for="emp in empleadosUnicos" :key="emp.id" class="sg-total-row">
            <span class="sg-total-nombre">{{ getNombreDisplay(emp) }}</span>
            <span class="sg-total-horas">{{ totalHorasEmp(emp.id) }}h total</span>
            <span v-if="totalHorasEmp(emp.id) > 40" class="sg-ot-badge">
              OT: {{ (totalHorasEmp(emp.id) - 40).toFixed(1) }}h
            </span>
          </div>
        </div>
      </div>

      <div v-else-if="semanaSelId && !cargando" class="nom-card" style="padding:32px;text-align:center;color:rgba(var(--v-theme-on-surface),0.4)">
        Semana sin horario generado. Haz clic en "Generar desde Plantilla".
      </div>
      <div v-else-if="!semanaSelId" class="nom-card" style="padding:32px;text-align:center;color:rgba(var(--v-theme-on-surface),0.4)">
        Selecciona una semana o crea una nueva.
      </div>

      <!-- Version badge -->
      <div style="text-align:center;font-size:10px;color:rgba(var(--v-theme-on-surface),0.3);margin-top:16px">
        v1.5.0 | Empleados activos: {{ empleadosActivos.length }} | Turno abierto: {{ turnoEdit ? 'Sí' : 'No' }}
      </div>
    </div>

    <!-- Dialog nueva semana -->
    <v-dialog v-model="dlgNuevaSemana" max-width="380">
      <v-card rounded="lg">
        <v-card-title class="pa-4" style="font-size:15px;font-weight:700">Nueva Semana</v-card-title>
        <v-card-text>
          <div class="drw-field mb-3">
            <label>Semana que inicia (Lunes)</label>
            <input v-model="nuevaSemanaInicio" type="date" class="drw-input" />
          </div>
          <div v-if="nuevaSemanaFin" style="font-size:12px;color:rgba(var(--v-theme-on-surface),0.5)">
            Período: {{ fmtFecha(nuevaSemanaInicio) }} — {{ fmtFecha(nuevaSemanaFin) }}
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="dlgNuevaSemana=false">Cancelar</v-btn>
          <v-btn color="#06b6d4" variant="flat" :loading="creandoSemana" @click="crearSemana">Crear</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog editar turno -->
    <v-dialog v-model="dlgEditar" max-width="420">
      <v-card rounded="lg" v-if="turnoEdit">
        <v-card-title class="pa-4" style="font-size:14px;font-weight:700">
          {{ editEmp?.apellido }}, {{ editEmp?.nombre }} — {{ fmtFechaCorta(editFecha) }}
        </v-card-title>
        <v-card-text>
          <label class="cfg-edit-check mb-3">
            <input type="checkbox" v-model="turnoEdit.es_dia_libre" />
            <span style="font-size:13px;margin-left:8px">Día libre / Ausencia</span>
          </label>
          <template v-if="!turnoEdit.es_dia_libre">
            <div class="drw-grid-2 mt-3">
              <div class="drw-field">
                <label>Entrada real</label>
                <input v-model="turnoEdit.real_inicio" type="time" class="drw-input" />
              </div>
              <div class="drw-field">
                <label>Salida real</label>
                <input v-model="turnoEdit.real_fin" type="time" class="drw-input" />
              </div>
              <div class="drw-field">
                <label>Horas reales</label>
                <input v-model="turnoEdit.real_horas" type="number" step="0.25" class="drw-input" />
              </div>
            </div>
            <div class="drw-field mt-3">
              <label>Centro de Costo</label>
              <select v-model="turnoEdit.ccosto" class="drw-select">
                <option value="">— Seleccionar —</option>
                <option v-for="c in ccostos" :key="c.codigo" :value="c.codigo">{{ c.nombre }}</option>
              </select>
            </div>
          </template>
          <template v-else>
            <div class="drw-field mt-3">
              <label>Tipo de ausencia</label>
              <select v-model="turnoEdit.ausencia_tipo" class="drw-select">
                <option value="">Libre</option>
                <option value="ENFERMEDAD">Enfermedad</option>
                <option value="VACACIONES">Vacaciones</option>
                <option value="SIN_PAGO">Sin pago</option>
                <option value="FERIADO">Feriado</option>
              </select>
            </div>
          </template>
          <div class="drw-field mt-3">
            <label>Notas</label>
            <input v-model="turnoEdit.notas" class="drw-input" />
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="dlgEditar=false">Cancelar</v-btn>
          <v-btn color="#8b5cf6" variant="flat" :loading="guardandoTurno" @click="guardarTurno">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </MainLayout>
</template>
<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const empresa = computed(() => authStore.empresa || authStore.user?.empresa || localStorage.getItem('empresaActual') || '')

const DIAS = [
  { label:'Lun', offset:0 },{ label:'Mar', offset:1 },{ label:'Mié', offset:2 },
  { label:'Jue', offset:3 },{ label:'Vie', offset:4 },{ label:'Sáb', offset:5 },{ label:'Dom', offset:6 }
]

const semanas = ref([])
const semanaSelId = ref('')
const semanaActual = ref(null)
const detalle = ref([])
const empleadosActivos = ref([])
const ccostos = ref([])
const horarioConfigs = ref([])
const ccostoSelId = ref('')
const cargando = ref(false)

const dlgNuevaSemana = ref(false)
const nuevaSemanaInicio = ref('')
const nuevaSemanaFin = computed(() => {
  if (!nuevaSemanaInicio.value) return ''
  const d = new Date(nuevaSemanaInicio.value + 'T00:00:00')
  d.setDate(d.getDate() + 6)
  return d.toISOString().split('T')[0]
})
const creandoSemana = ref(false)

const dlgEditar = ref(false)
const editEmp = ref(null)
const editFecha = ref('')
const turnoEdit = ref(null)
const guardandoTurno = ref(false)

const empleadosUnicos = computed(() => {
  // Si no hay empleados activos cargados, retornar vacío
  if (empleadosActivos.value.length === 0) return []

  // Si NO hay ccosto seleccionado, mostrar TODOS los empleados activos
  if (!ccostoSelId.value) {
    return empleadosActivos.value.sort((a,b) => a.apellido.localeCompare(b.apellido))
  }

  // Si hay ccosto seleccionado:
  // 1. Primero buscar empleados con turnos en ese ccosto
  const conTurnos = new Set()
  detalle.value
    .filter(d => d.ccosto === ccostoSelId.value)
    .forEach(d => conTurnos.add(d.empleado_id))

  // 2. Si hay empleados con turnos en este ccosto, mostrar esos
  if (conTurnos.size > 0) {
    return empleadosActivos.value
      .filter(e => conTurnos.has(e.id))
      .sort((a,b) => a.apellido.localeCompare(b.apellido))
  }

  // 3. Si NO hay empleados con turnos en este ccosto, mostrar TODOS para agregar
  return empleadosActivos.value.sort((a,b) => a.apellido.localeCompare(b.apellido))
})

function getNombreDisplay(emp) {
  if (emp.tipo_empleado === '1099' && emp.empresa_contratista) {
    return `${emp.apellido}, ${emp.nombre} - ${emp.empresa_contratista}`
  }
  return `${emp.apellido}, ${emp.nombre}`
}

function getTurno(empId, semanaInicio, offset) {
  if (!semanaInicio) return null
  const fecha = addDays(semanaInicio, offset)
  if (!fecha) return null
  return detalle.value.find(d => d.empleado_id === empId && d.fecha?.split('T')[0] === fecha) || null
}

function addDays(dateStr, days) {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr + 'T00:00:00')
    if (isNaN(d.getTime())) return null
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
  } catch {
    return null
  }
}

function totalHorasEmp(empId) {
  return detalle.value
    .filter(d => d.empleado_id === empId && !d.es_dia_libre)
    .reduce((s, d) => s + parseFloat(d.real_horas ?? d.prog_horas ?? 0), 0)
    .toFixed(1)
}

function fmtFecha(f) {
  if (!f) return '—'
  const s = String(f).split('T')[0]; const [y,m,d] = s.split('-')
  const meses = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${parseInt(d)} ${meses[parseInt(m)]} ${y}`
}
function fmtDiaMes(inicio, offset) {
  if (!inicio) return '—'
  try {
    const f = addDays(inicio, offset)
    const [,m,d] = f.split('-')
    return `${parseInt(d)}/${parseInt(m)}`
  } catch {
    return '—'
  }
}
function fmtFechaCorta(f) {
  if (!f) return ''
  const [,m,d] = f.split('-')
  return `${parseInt(d)}/${parseInt(m)}`
}

async function cargarSemanas() {
  const [semsR, ccR, hcR, empR] = await Promise.all([
    api.get('/nomina/semanas', { params: { empresa: empresa.value } }),
    api.get('/ccostos',        { params: { empresa: empresa.value } }),
    api.get('/nomina/horario-config', { params: { empresa: empresa.value } }),
    api.get('/nomina/empleados', { params: { empresa: empresa.value, estado: 'ACTIVO' } }),
  ])
  semanas.value = semsR.data?.data || []
  ccostos.value = ccR.data?.data || ccR.data || []
  horarioConfigs.value = hcR.data?.data || []
  empleadosActivos.value = empR.data?.data || []

  console.log('📋 Empleados activos cargados:', empleadosActivos.value.length, empleadosActivos.value)

  if (semanas.value.length && !semanaSelId.value) {
    semanaSelId.value = semanas.value[0].id
    cargarDetalle()
  }
}

async function cargarDetalle() {
  if (!semanaSelId.value) { semanaActual.value = null; detalle.value = []; return }
  cargando.value = true
  try {
    const r = await api.get(`/nomina/semanas/${semanaSelId.value}/detalle`)
    semanaActual.value = r.data.semana
    detalle.value = r.data.detalle || []
  } finally { cargando.value = false }
}

async function crearSemana() {
  if (!nuevaSemanaInicio.value) return
  // Ensure it's a Monday
  const d = new Date(nuevaSemanaInicio.value + 'T00:00:00')
  if (d.getDay() !== 1) { alert('La fecha debe ser un lunes'); return }
  creandoSemana.value = true
  try {
    const r = await api.post('/nomina/semanas', {
      empresa: empresa.value, semana_inicio: nuevaSemanaInicio.value,
      semana_fin: nuevaSemanaFin.value
    })
    dlgNuevaSemana.value = false
    await cargarSemanas()
    semanaSelId.value = r.data.data?.id
    cargarDetalle()
  } catch(e) { alert(e?.response?.data?.error || e.message) }
  finally { creandoSemana.value = false }
}

async function generarHorario() {
  if (!semanaSelId.value) return
  try {
    const cfgId = horarioConfigs.value[0]?.id || null
    if (!cfgId) { alert('⚠️ No hay plantillas de horario disponibles. Crea una primero.'); return }
    await api.post(`/nomina/semanas/${semanaSelId.value}/generar`, {
      empresa: empresa.value, config_id: cfgId
    })
    await cargarDetalle()
  } catch(e) {
    console.error('Error al generar horario:', e)
    alert('❌ Error al generar horario: ' + (e?.response?.data?.error || e.message))
  }
}

async function publicar() {
  if (!semanaSelId.value) return
  await api.put(`/nomina/semanas/${semanaSelId.value}/publicar`)
  cargarDetalle()
}

function abrirEditar(emp, offset) {
  if (semanaActual.value?.estado === 'CERRADO') return
  const fecha = addDays(semanaActual.value.semana_inicio, offset)
  if (!fecha) return
  const diaSemana = offset + 1 // 1=Mon..7=Sun
  const t = getTurno(emp.id, semanaActual.value.semana_inicio, offset)

  // Buscar horario por defecto de la plantilla para este día
  const diaConfig = horarioConfigs.value.length > 0
    ? horarioConfigs.value[0].dias?.find(d => d.dia_semana === diaSemana)
    : null

  editEmp.value = emp
  editFecha.value = fecha
  turnoEdit.value = t ? {
    id: t.id,
    real_inicio: t.real_inicio?.slice(0,5)||t.prog_inicio?.slice(0,5)||diaConfig?.hora_inicio||'',
    real_fin: t.real_fin?.slice(0,5)||t.prog_fin?.slice(0,5)||diaConfig?.hora_fin||'',
    real_horas: t.real_horas ?? t.prog_horas ?? diaConfig?.horas_default ?? 0,
    ccosto: t.ccosto||emp.ccosto||'',
    es_dia_libre: t.es_dia_libre||false,
    ausencia_tipo: t.ausencia_tipo||'',
    notas: t.notas||''
  } : {
    id: null,
    semana_id: semanaActual.value.id,
    empleado_id: emp.id,
    fecha: fecha,
    real_inicio: diaConfig?.hora_inicio||'',
    real_fin: diaConfig?.hora_fin||'',
    real_horas: diaConfig?.horas_default||0,
    ccosto: ccostoSelId.value || emp.ccosto || '',
    es_dia_libre: !diaConfig,
    ausencia_tipo: '',
    notas: ''
  }
  try {
    dlgEditar.value = true
  } catch(e) {
    console.error('Error al abrir editar:', e)
    alert('❌ Error: ' + e.message)
  }
}

async function guardarTurno() {
  if (!turnoEdit.value) return
  guardandoTurno.value = true
  try {
    // Turno nuevo: POST
    if (!turnoEdit.value.id) {
      await api.post(`/nomina/semanas/detalle`, {
        semana_id: turnoEdit.value.semana_id,
        empleado_id: turnoEdit.value.empleado_id,
        fecha: turnoEdit.value.fecha,
        real_inicio: turnoEdit.value.real_inicio||null,
        real_fin: turnoEdit.value.real_fin||null,
        real_horas: turnoEdit.value.real_horas||0,
        ccosto: turnoEdit.value.ccosto||'',
        es_dia_libre: turnoEdit.value.es_dia_libre||false,
        ausencia_tipo: turnoEdit.value.ausencia_tipo||'',
        notas: turnoEdit.value.notas||''
      })
    } else {
      // Turno existente: PUT
      await api.put(`/nomina/semanas/detalle/${turnoEdit.value.id}`, turnoEdit.value)
    }
    dlgEditar.value = false
    await cargarDetalle()
  } catch(e) {
    console.error('Error al guardar turno:', e)
    alert('❌ Error: ' + (e?.response?.data?.error || e.message))
  } finally { guardandoTurno.value = false }
}

onMounted(cargarSemanas)
</script>
<style scoped>
.nom-wrap { display: flex; flex-direction: column; gap: 16px; }
.nom-header { display: flex; align-items: center; gap: 14px; background: linear-gradient(135deg,#0c2340,#1a3a6e); border-radius: 14px; padding: 20px 24px; flex-wrap: wrap; }
.nom-header-icon { width: 42px; height: 42px; border-radius: 10px; background: rgba(6,182,212,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nom-title { font-size: 17px; font-weight: 800; color: #fff; margin: 0; }
.nom-sub   { font-size: 12px; color: rgba(255,255,255,0.5); margin: 0; display: flex; align-items: center; gap: 8px; }
.flex-1 { flex: 1; }
.nom-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),0.07); border-radius: 14px; overflow: hidden; }

.estado-badge { font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 4px; }
.estado-borrador  { background: rgba(148,163,184,0.15); color: #94a3b8; }
.estado-publicado { background: rgba(16,185,129,0.15); color: #10b981; }
.estado-cerrado   { background: rgba(239,68,68,0.15); color: #ef4444; }

/* Schedule grid */
.semana-grid { display: grid; }
.sg-header-emp, .sg-header-dia {
  padding: 10px 8px; text-align: center;
  font-size: 10px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface),0.4);
  background: rgba(var(--v-theme-on-surface),0.04);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.08);
  border-right: 1px solid rgba(var(--v-theme-on-surface),0.06);
}
.sg-header-emp { text-align: left; padding-left: 14px; }
.sg-dia-nombre { font-weight: 800; }
.sg-dia-fecha { font-size: 9px; color: rgba(var(--v-theme-on-surface),0.3); margin-top: 2px; }
.sg-emp-cell {
  display: flex; flex-direction: column; justify-content: center; padding: 10px 14px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.06);
  border-right: 1px solid rgba(var(--v-theme-on-surface),0.06);
  background: rgba(var(--v-theme-on-surface),0.02);
}
.sg-emp-nombre { font-size: 12px; font-weight: 600; }
.sg-emp-badge { font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; margin-top: 3px; align-self: flex-start; }
.badge-w2   { background: rgba(139,92,246,0.15); color: #8b5cf6; }
.badge-1099 { background: rgba(245,158,11,0.15); color: #f59e0b; }
.sg-turno-cell {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.06);
  border-right: 1px solid rgba(var(--v-theme-on-surface),0.06);
  padding: 8px 6px; text-align: center; cursor: pointer;
  transition: background 0.12s; min-height: 56px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.sg-turno-cell:hover { background: rgba(139,92,246,0.06); }
.sg-turno-horas { font-size: 10px; font-weight: 600; color: #06b6d4; }
.sg-turno-total { font-size: 11px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); margin-top: 2px; }
.ajustado { color: #f59e0b; }
.sg-libre { font-size: 10px; color: rgba(var(--v-theme-on-surface),0.3); }
.sg-sin-turno { font-size: 18px; color: rgba(var(--v-theme-on-surface),0.15); }

/* Totales */
.sg-totales { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 16px; border-top: 1px solid rgba(var(--v-theme-on-surface),0.07); background: rgba(var(--v-theme-on-surface),0.02); }
.sg-total-row { display: flex; align-items: center; gap: 8px; padding: 4px 10px; border-radius: 8px; background: rgba(var(--v-theme-on-surface),0.04); }
.sg-total-nombre { font-size: 11px; font-weight: 600; }
.sg-total-horas { font-size: 11px; color: #06b6d4; font-weight: 700; }
.sg-ot-badge { font-size: 10px; font-weight: 800; background: rgba(239,68,68,0.15); color: #ef4444; padding: 2px 6px; border-radius: 4px; }

.drw-select { height: 34px; padding: 0 8px; border-radius: 7px; border: 1px solid rgba(var(--v-theme-on-surface),0.15); background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); font-size: 12px; outline: none; }
.drw-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.drw-field { display: flex; flex-direction: column; gap: 4px; }
.drw-field label { font-size: 10px; font-weight: 700; color: rgba(var(--v-theme-on-surface),0.5); text-transform: uppercase; }
.drw-input { height: 34px; padding: 0 8px; border-radius: 7px; border: 1px solid rgba(var(--v-theme-on-surface),0.15); background: rgba(var(--v-theme-on-surface),0.03); color: rgb(var(--v-theme-on-surface)); font-size: 12px; outline: none; width: 100%; }
.mt-3 { margin-top: 12px; } .mb-3 { margin-bottom: 12px; }
.cfg-edit-check { display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; }
</style>
