<template>
  <MainLayout>
    <div class="nom-wrap">
      <!-- HEADER (oculto al imprimir) -->
      <div class="nom-header no-print">
        <div class="nom-header-icon"><v-icon size="20" color="white">mdi-calendar-clock</v-icon></div>
        <div class="flex-1">
          <h1 class="nom-title">HORARIO SEMANAL — PARA PUBLICAR</h1>
          <p class="nom-sub">Una hoja por centro de costo al imprimir PDF</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <select v-model="semanaSelId" class="drw-select" style="width:220px" @change="cargarDetalle">
            <option value="">— Seleccionar semana —</option>
            <option v-for="s in semanas" :key="s.id" :value="s.id">
              {{ fmtFecha(s.semana_inicio) }} — {{ s.estado }}
            </option>
          </select>
          <v-btn color="#06b6d4" variant="outlined" size="small" :disabled="!semanaActual"
                 @click="irAEditarNomina">
            <v-icon size="14" class="mr-1">mdi-pencil</v-icon> Editar Nómina
          </v-btn>
          <v-btn color="#8b5cf6" variant="flat" size="small" :disabled="!semanaActual"
                 @click="imprimirPDF">
            <v-icon size="14" class="mr-1">mdi-printer</v-icon> Imprimir
          </v-btn>
        </div>
      </div>

      <!-- REPORTE: UN BLOQUE POR CENTRO DE COSTOS -->
      <div v-if="semanaActual && semanaActual.semana_inicio" id="horario-print">
        <div v-for="(cc, idx) in ccostosConEmpleados" :key="cc.codigo"
             class="rh-pagina" :class="{ 'page-break': separacionPaginas==='cc' && idx < ccostosConEmpleados.length - 1, 'no-page-break-print': separacionPaginas!=='cc' }">

          <!-- Encabezado de página -->
          <div class="rh-encabezado">
            <div class="rh-titulo">SCHEDULE</div>
            <div class="rh-ccosto-nombre">{{ cc.nombre }}</div>
            <div class="rh-periodo">
              {{ fmtFecha(semanaActual.semana_inicio) }} &mdash; {{ fmtFecha(semanaActual.semana_fin) }}
            </div>
          </div>

          <!-- Tabla de horario -->
          <table class="rh-table" v-if="empleadosDelCcosto(cc.codigo).length">
            <thead>
              <tr>
                <th class="th-emp">EMPLEADO</th>
                <th v-for="d in DIAS" :key="d.offset">
                  {{ d.label }}<br/>
                  <span class="rh-fecha">{{ fmtDiaMes(semanaActual.semana_inicio, d.offset) }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="emp in empleadosDelCcosto(cc.codigo)" :key="emp.id">
                <td class="rh-emp">
                  <div class="rh-emp-nombre">{{ emp.apellido }}, {{ emp.nombre }}</div>
                </td>
                <td v-for="d in DIAS" :key="d.offset" class="rh-turno"
                    :class="{ 'rh-verde': modoImpresion==='verde' && getTurnoCcosto(emp.id, d.offset, cc.codigo) && !getTurnoCcosto(emp.id, d.offset, cc.codigo)?.es_dia_libre }">
                  <template v-for="t in [getTurnoCcosto(emp.id, d.offset, cc.codigo)]" :key="0">
                    <template v-if="modoImpresion==='verde'">
                      <span v-if="t && !t.es_dia_libre" class="rh-verde-check">✓</span>
                      <span v-else-if="t && t.es_dia_libre" class="rh-libre">{{ t.ausencia_tipo || 'LIBRE' }}</span>
                      <span v-else class="rh-vacio"></span>
                    </template>
                    <template v-else>
                      <template v-if="t && !t.es_dia_libre">
                        <div class="rh-horas">
                          {{ (t.real_inicio || t.prog_inicio || '').slice(0,5) }}
                          <br/>{{ (t.real_fin || t.prog_fin || '').slice(0,5) }}
                        </div>
                        <div class="rh-h">{{ fmtHoras(t.real_horas ?? t.prog_horas) }}h</div>
                      </template>
                      <template v-else-if="t && t.es_dia_libre">
                        <span class="rh-libre">{{ t.ausencia_tipo || 'LIBRE' }}</span>
                      </template>
                      <template v-else>
                        <span class="rh-vacio">—</span>
                      </template>
                    </template>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-else class="rh-sin-emp">Sin empleados asignados a este centro esta semana.</div>
        </div>
      </div>

      <div v-else-if="!semanaSelId" class="nom-card no-print"
           style="padding:32px;text-align:center;color:rgba(var(--v-theme-on-surface),0.35)">
        Selecciona una semana para ver el horario
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { formatFecha } from '../../utils/formatters'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const empresa = computed(() => authStore.empresa || authStore.user?.empresa || localStorage.getItem('empresaActual') || '')

const DIAS = [
  { label:'Lunes', offset:0 }, { label:'Martes', offset:1 }, { label:'Miércoles', offset:2 },
  { label:'Jueves', offset:3 }, { label:'Viernes', offset:4 }, { label:'Sábado', offset:5 }, { label:'Domingo', offset:6 }
]

const semanas      = ref([])
const semanaSelId  = ref('')
const semanaActual = ref(null)
const detalle      = ref([])
const ccostos      = ref([])

// Parámetros desde el dialog de impresión (query params)
const filtroCC   = computed(() => {
  if (!route.query.ccostos) return null
  const arr = String(route.query.ccostos).split(',').map(s => s.trim()).filter(s => s)
  return arr.length > 0 ? arr : null
})
const modoImpresion = computed(() => route.query.modo || 'detalle')
const separacionPaginas = computed(() => route.query.separacion || 'cc')

// Solo ccostos que tienen al menos un empleado con turnos esta semana, filtrados por selección
const ccostosConEmpleados = computed(() => {
  const ccostosEnDetalle = new Set(detalle.value.map(d => String(d.ccosto)))
  return ccostos.value.filter(c => {
    const ccStr = String(c.codigo)
    return ccostosEnDetalle.has(ccStr) &&
           (!filtroCC.value || filtroCC.value.some(f => String(f) === ccStr))
  })
})

// Empleados únicos de un ccosto (deduplicados)
function empleadosDelCcosto(ccostoId) {
  const map = {}
  detalle.value
    .filter(d => d.ccosto === ccostoId)
    .forEach(d => {
      if (!map[d.empleado_id]) {
        map[d.empleado_id] = {
          id: d.empleado_id,
          nombre: d.nombre,
          apellido: d.apellido,
          tipo_empleado: d.tipo_empleado,
          empresa_contratista: d.empresa_contratista
        }
      }
    })
  return Object.values(map).sort((a,b) => a.apellido.localeCompare(b.apellido))
}

// Turno de un empleado en un día específico y ccosto específico
function getTurnoCcosto(empId, offset, ccostoId) {
  if (!semanaActual.value) return null
  const fecha = addDays(semanaActual.value.semana_inicio, offset)
  if (!fecha) return null
  return detalle.value.find(d =>
    d.empleado_id === empId &&
    d.fecha?.split('T')[0] === fecha &&
    d.ccosto === ccostoId
  ) || null
}

// Total horas de un empleado en un ccosto (deduplicado por empleado+fecha+ccosto)
function totalHorasEmpCcosto(empId, ccostoId) {
  const seen = new Set()
  return detalle.value
    .filter(d => {
      if (d.empleado_id !== empId || d.ccosto !== ccostoId || d.es_dia_libre) return false
      const key = `${d.empleado_id}-${String(d.fecha).split('T')[0]}-${d.ccosto}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .reduce((s, d) => s + parseFloat(d.real_horas ?? d.prog_horas ?? 0), 0)
    .toFixed(1)
}

// Total horas de todos los empleados en un ccosto en un día específico
function totalHorasDiaCcosto(offset, ccostoId) {
  const fecha = addDays(semanaActual.value?.semana_inicio, offset)
  if (!fecha) return '0.0'
  return detalle.value
    .filter(d => d.ccosto === ccostoId && d.fecha?.split('T')[0] === fecha && !d.es_dia_libre)
    .reduce((s, d) => s + parseFloat(d.real_horas ?? d.prog_horas ?? 0), 0)
    .toFixed(1)
}

// Total horas del centro completo en la semana
function totalHorasCcosto(ccostoId) {
  const seen = new Set()
  return detalle.value
    .filter(d => {
      if (d.ccosto !== ccostoId || d.es_dia_libre) return false
      const key = `${d.empleado_id}-${String(d.fecha).split('T')[0]}-${d.ccosto}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .reduce((s, d) => s + parseFloat(d.real_horas ?? d.prog_horas ?? 0), 0)
    .toFixed(1)
}

function fmtHoras(v) { return parseFloat(v ?? 0).toFixed(2) }

function addDays(dateStr, days) {
  if (!dateStr) return null
  try {
    const dateOnly = String(dateStr).split('T')[0]
    const d = new Date(dateOnly + 'T00:00:00')
    if (isNaN(d.getTime())) return null
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
  } catch { return null }
}

function fmtFecha(f) {
  if (!f) return '—'
  const s = String(f).split('T')[0]; const [y,m,d] = s.split('-')
  return `${m}/${d}/${y}`
}

function fmtDiaMes(inicio, offset) {
  if (!inicio) return '—'
  try {
    const f = addDays(inicio, offset)
    const [,m,d] = f.split('-')
    return `${parseInt(d)}/${parseInt(m)}`
  } catch { return '—' }
}

async function cargarSemanas() {
  const [semsR, ccR] = await Promise.all([
    api.get('/nomina/semanas', { params: { empresa: empresa.value } }),
    api.get('/ccostos',        { params: { empresa: empresa.value } }),
  ])
  semanas.value = semsR.data?.data || []
  ccostos.value = ccR.data?.data || ccR.data || []
  // Si viene semana por query param, usarla; sino la primera
  const semanaParam = route.query.semana
  if (semanaParam && semanas.value.find(s => String(s.id) === String(semanaParam))) {
    semanaSelId.value = parseInt(semanaParam)
  } else if (semanas.value.length) {
    semanaSelId.value = semanas.value[0].id
  }
  if (semanaSelId.value) cargarDetalle()
}

async function cargarDetalle() {
  if (!semanaSelId.value) return
  const r = await api.get(`/nomina/semanas/${semanaSelId.value}/detalle`)
  semanaActual.value = r.data.semana
  detalle.value = r.data.detalle || []
}

function imprimirPDF() {
  const ventana = window.open('', '_blank')
  if (!ventana) { alert('Activa los pop-ups para abrir el reporte en nueva pestaña'); return }

  const separacion = separacionPaginas.value
  const estilos = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; background: white; color: #111; }
    .pagina { padding: 24px 20px; ${separacion === 'cc' ? 'page-break-after: always;' : ''} }
    .pagina:last-child { page-break-after: auto; }
    .encabezado { text-align: center; margin-bottom: 14px; }
    .titulo { font-size: 20px; font-weight: 900; letter-spacing: 1px; margin-bottom: 4px; }
    .ccosto-nombre { font-size: 14px; font-weight: 800; color: #0088aa; margin-bottom: 3px; text-transform: uppercase; }
    .periodo { font-size: 11px; color: #666; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px; table-layout: fixed; }
    th { background: #1e3a5f; color: white; padding: 6px 5px; text-align: center; font-size: 9px; font-weight: 700; border: 1px solid rgba(255,255,255,0.2); }
    th.th-emp { text-align: left; width: 225px; padding-left: 8px; }
    .rh-fecha { font-size: 7px; font-weight: 400; display: block; }
    td { border: 1px solid #ddd; padding: 5px 4px; vertical-align: middle; text-align: center; }
    td.td-emp { text-align: left; padding: 6px 8px; }
    .emp-nombre { font-weight: 700; font-size: 10px; }
    .emp-sub { font-size: 8px; color: #888; margin-top: 1px; }
    .turno-horas { font-size: 9px; font-weight: 700; color: #006688; line-height: 1.3; }
    .turno-h { font-size: 8px; color: #888; }
    .libre { font-size: 8px; color: #aaa; font-style: italic; text-transform: uppercase; }
    .vacio { font-size: 11px; color: #ccc; }
    .td-verde { background: #d1fae5 !important; }
    .check-verde { font-size: 14px; color: #059669; font-weight: 900; }
    .td-total { font-weight: 800; font-size: 11px; text-align: center; white-space: nowrap; }
    .ot { display: block; font-size: 7px; background: #fee; color: #c00; padding: 1px 3px; border-radius: 2px; margin-top: 1px; font-weight: 800; }
    tr.footer-row td { background: #f5f5f5; font-size: 8px; font-weight: 700; color: #555; }
    tr.footer-row td.td-emp { text-align: left; font-size: 8px; }
    .pie { font-size: 8px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 6px; margin-top: 6px; }
    @media print {
      .pagina:not(.no-page-break-print) { page-break-after: always; }
      table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      tr.footer-row td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .td-verde { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `

  const modo = modoImpresion.value
  const genTurno = (t) => {
    if (modo === 'verde') {
      if (!t) return ''
      if (t.es_dia_libre) return `<span class="libre">${t.ausencia_tipo || 'LIBRE'}</span>`
      return `<span class="check-verde">✓</span>`
    }
    if (!t) return `<span class="vacio">—</span>`
    if (t.es_dia_libre) return `<span class="libre">${t.ausencia_tipo || 'LIBRE'}</span>`
    const ini = (t.real_inicio || t.prog_inicio || '').slice(0,5)
    const fin = (t.real_fin   || t.prog_fin   || '').slice(0,5)
    const hrs = parseFloat(t.real_horas ?? t.prog_horas ?? 0).toFixed(2)
    return `<div class="turno-horas">${ini}<br/>${fin}</div><div class="turno-h">${hrs}h</div>`
  }

  let body = ''
  ccostosConEmpleados.value.forEach(cc => {
    const emps = empleadosDelCcosto(cc.codigo)
    const claseNoPageBreak = separacion !== 'cc' ? ' no-page-break-print' : ''
    body += `<div class="pagina${claseNoPageBreak}">
      <div class="encabezado">
        <div class="titulo">SCHEDULE</div>
        <div class="ccosto-nombre">${cc.nombre}</div>
        <div class="periodo">${fmtFecha(semanaActual.value.semana_inicio)} &mdash; ${fmtFecha(semanaActual.value.semana_fin)}</div>
      </div>`

    if (emps.length) {
      body += `<table><thead><tr>
        <th class="th-emp">EMPLEADO</th>
        ${DIAS.map(d => `<th>${d.label}<span class="rh-fecha">${fmtDiaMes(semanaActual.value.semana_inicio, d.offset)}</span></th>`).join('')}
        </tr></thead><tbody>`

      emps.forEach(emp => {
        body += `<tr>
          <td class="td-emp">
            <div class="emp-nombre">${emp.apellido}, ${emp.nombre}</div>
          </td>
          ${DIAS.map(d => {
            const t = getTurnoCcosto(emp.id, d.offset, cc.codigo)
            const esVerde = modo === 'verde' && t && !t.es_dia_libre
            return `<td${esVerde ? ' class="td-verde"' : ''}>${genTurno(t)}</td>`
          }).join('')}
        </tr>`
      })

      body += `</tbody></table>`
    } else {
      body += `<p style="text-align:center;color:#aaa;padding:20px;font-size:11px">Sin empleados asignados a este centro esta semana.</p>`
    }

    body += `</div>`
  })

  ventana.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Horario de Trabajo — ${fmtFecha(semanaActual.value.semana_inicio)}</title>
    <style>${estilos}</style></head><body>${body}</body></html>`)
  ventana.document.close()
  ventana.focus()
}

function irAEditarNomina() {
  router.push({
    path: '/nomina/procesos/horario',
    query: { semana: semanaSelId.value }
  })
}

onMounted(cargarSemanas)
</script>

<style scoped>
.nom-wrap { display: flex; flex-direction: column; gap: 16px; }
.nom-header { display: flex; align-items: center; gap: 14px; background: linear-gradient(135deg,#0c2340,#1a3a6e); border-radius: 14px; padding: 20px 24px; flex-wrap: wrap; }
.nom-header-icon { width: 42px; height: 42px; border-radius: 10px; background: rgba(6,182,212,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nom-title { font-size: 17px; font-weight: 800; color: #fff; margin: 0; }
.nom-sub   { font-size: 12px; color: rgba(255,255,255,0.45); margin: 0; }
.flex-1 { flex: 1; }
.drw-select { height: 34px; padding: 0 8px; border-radius: 7px; border: 1px solid rgba(var(--v-theme-on-surface),0.2); background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); font-size: 12px; outline: none; }

/* Una página por ccosto */
.rh-pagina {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface),0.07);
  border-radius: 14px;
  padding: 24px;
  overflow-x: auto;
  margin-bottom: 16px;
}

.rh-encabezado { text-align: center; margin-bottom: 16px; }
.rh-titulo     { font-size: 22px; font-weight: 900; letter-spacing: 1.5px; color: rgb(var(--v-theme-on-surface)); margin-bottom: 4px; }
.rh-ccosto-nombre { font-size: 15px; font-weight: 800; color: #06b6d4; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.8px; }
.rh-periodo    { font-size: 12px; color: rgba(var(--v-theme-on-surface),0.5); }
.rh-sin-emp    { padding: 20px; text-align: center; color: rgba(var(--v-theme-on-surface),0.4); font-size: 12px; }

/* Tabla */
.rh-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 12px; table-layout: fixed; }
.rh-table th { background: #1e3a5f; color: #fff; padding: 7px 6px; text-align: center; font-size: 10px; font-weight: 700; border: 1px solid rgba(255,255,255,0.15); }
.th-emp { text-align: left !important; width: 270px; padding-left: 10px !important; }
.th-total { min-width: 60px; }
.rh-fecha { font-size: 8px; font-weight: 400; opacity: 0.75; }

.rh-emp { padding: 8px 10px; border: 1px solid rgba(var(--v-theme-on-surface),0.1); vertical-align: middle; }
.rh-emp-nombre { font-weight: 700; font-size: 11px; }
.rh-emp-sub { font-size: 9px; color: rgba(var(--v-theme-on-surface),0.4); margin-top: 2px; }

.rh-turno { border: 1px solid rgba(var(--v-theme-on-surface),0.1); text-align: center; padding: 6px 4px; vertical-align: middle; }
.rh-verde { background: #d1fae5 !important; }
.rh-verde-check { font-size: 16px; color: #059669; font-weight: 900; }
.rh-horas { font-size: 10px; font-weight: 700; color: #06b6d4; line-height: 1.3; }
.rh-h     { font-size: 9px; color: rgba(var(--v-theme-on-surface),0.45); margin-top: 1px; }
.rh-libre { font-size: 9px; color: rgba(var(--v-theme-on-surface),0.3); text-transform: uppercase; font-style: italic; }
.rh-vacio { font-size: 11px; color: rgba(var(--v-theme-on-surface),0.15); }

.rh-total { border: 1px solid rgba(var(--v-theme-on-surface),0.1); text-align: center; font-weight: 800; font-size: 12px; padding: 6px 4px; white-space: nowrap; }
.rh-ot    { display: block; font-size: 8px; background: rgba(239,68,68,0.15); color: #ef4444; padding: 1px 4px; border-radius: 3px; margin-top: 2px; font-weight: 800; }
.ta-c     { text-align: center !important; }

/* Fila de totales del centro */
.rh-footer-row td { background: rgba(var(--v-theme-on-surface),0.05); font-size: 10px; font-weight: 700; border: 1px solid rgba(var(--v-theme-on-surface),0.15); padding: 5px 6px; color: rgba(var(--v-theme-on-surface),0.6); }
.rh-footer-row td:first-child { text-align: left; padding-left: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-size: 9px; }

.rh-footer { font-size: 9px; color: rgba(var(--v-theme-on-surface),0.3); text-align: center; padding-top: 8px; border-top: 1px solid rgba(var(--v-theme-on-surface),0.06); margin-top: 8px; }

/* ESTILOS DE IMPRESIÓN */
@media print {
  .no-print { display: none !important; }
  .nom-wrap { gap: 0; background: white; }

  .rh-pagina {
    border: none !important;
    border-radius: 0 !important;
    padding: 20px !important;
    margin-bottom: 0 !important;
    background: white !important;
    box-shadow: none !important;
  }

  /* Salto de página entre centros de costo */
  .page-break { page-break-after: always; }
  .no-page-break-print { page-break-after: auto !important; }

  /* Forzar colores al imprimir */
  .rh-table th { background: #1e3a5f !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .rh-footer-row td { background: #f5f5f5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .rh-verde { background: #d1fae5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .rh-horas { color: #0088aa !important; }
  .rh-ccosto-nombre { color: #0088aa !important; }

  .rh-titulo { font-size: 18px; }
  .rh-table  { font-size: 10px; }
}
</style>
