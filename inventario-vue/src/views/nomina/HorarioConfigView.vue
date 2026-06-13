<template>
  <MainLayout>
    <div class="nom-wrap">
      <div class="nom-header">
        <div class="nom-header-icon"><v-icon size="20" color="white">mdi-clock-outline</v-icon></div>
        <div class="flex-1">
          <h1 class="nom-title">PLANTILLAS DE HORARIO</h1>
          <p class="nom-sub">Configura los horarios base por día de la semana</p>
        </div>
        <v-btn color="#06b6d4" variant="flat" size="small" prepend-icon="mdi-plus" @click="abrirNuevo">
          Nueva Plantilla
        </v-btn>
      </div>

      <div v-if="cargando" class="nom-card" style="padding:24px">
        <v-progress-circular indeterminate color="#06b6d4" size="24"/>
      </div>

      <div v-for="config in configs" :key="config.id" class="nom-card">
        <div class="cfg-header">
          <div>
            <div style="font-weight:700;font-size:14px">{{ config.nombre }}</div>
            <div style="font-size:11px;color:rgba(var(--v-theme-on-surface),0.4)">{{ config.descripcion }}</div>
          </div>
          <v-btn size="x-small" variant="text" color="#8b5cf6" @click="editar(config)">
            <v-icon size="14">mdi-pencil</v-icon> Editar
          </v-btn>
        </div>
        <div class="cfg-dias-grid">
          <div v-for="dia in DIAS" :key="dia.num" class="cfg-dia">
            <div class="cfg-dia-nombre">{{ dia.label }}</div>
            <div v-if="getDia(config, dia.num)" class="cfg-dia-horas">
              {{ getDia(config, dia.num).hora_inicio }} – {{ getDia(config, dia.num).hora_fin }}
              <span v-if="getDia(config, dia.num).cruza_medianoche" class="cfg-midnight">+1</span>
              <div class="cfg-dia-hrs">{{ getDia(config, dia.num).horas_default }}h</div>
            </div>
            <div v-else class="cfg-dia-libre">LIBRE</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog editar/crear -->
    <v-dialog v-model="dlg" max-width="700" scrollable>
      <v-card rounded="lg">
        <v-card-title class="pa-4 d-flex justify-space-between align-center">
          <span style="font-size:15px;font-weight:700">{{ editForm.id ? 'Editar' : 'Nueva' }} Plantilla</span>
          <v-btn icon="mdi-close" size="small" variant="text" @click="dlg=false"/>
        </v-card-title>
        <v-card-text>
          <div class="drw-grid-2 mb-4">
            <div class="drw-field"><label>Nombre *</label><input v-model="editForm.nombre" class="drw-input"/></div>
            <div class="drw-field"><label>Descripción</label><input v-model="editForm.descripcion" class="drw-input"/></div>
          </div>
          <div class="cfg-section-title mb-2">HORARIOS POR DÍA</div>
          <div v-for="dia in DIAS" :key="dia.num" class="cfg-edit-row">
            <div class="cfg-edit-dia">{{ dia.label }}</div>
            <label class="cfg-edit-check">
              <input type="checkbox" v-model="editForm.dias[dia.num].activo" />
              <span>Trabaja</span>
            </label>
            <template v-if="editForm.dias[dia.num].activo">
              <div class="cfg-edit-time">
                <label>Entrada</label>
                <input v-model="editForm.dias[dia.num].hora_inicio" type="time" class="drw-input" style="width:110px"/>
              </div>
              <div class="cfg-edit-time">
                <label>Salida</label>
                <input v-model="editForm.dias[dia.num].hora_fin" type="time" class="drw-input" style="width:110px"/>
              </div>
              <label class="cfg-edit-check">
                <input type="checkbox" v-model="editForm.dias[dia.num].cruza_medianoche"/>
                <span>Pasa medianoche</span>
              </label>
              <div class="cfg-edit-time">
                <label>Horas (automático)</label>
                <input :value="editForm.dias[dia.num].horas_default" type="number" class="drw-input" readonly style="width:70px;opacity:0.6;background:rgba(var(--v-theme-on-surface),0.05)"/>
              </div>
            </template>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="dlg=false">Cancelar</v-btn>
          <v-btn color="#06b6d4" variant="flat" :loading="guardando" @click="guardar">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </MainLayout>
</template>
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'
const authStore = useAuthStore()
const empresa = computed(() => authStore.empresa || authStore.user?.empresa || localStorage.getItem('empresaActual') || '')

const DIAS = [
  { num:1, label:'Lunes' },{ num:2, label:'Martes' },{ num:3, label:'Miércoles' },
  { num:4, label:'Jueves' },{ num:5, label:'Viernes' },{ num:6, label:'Sábado' },{ num:7, label:'Domingo' }
]

const configs = ref([])
const cargando = ref(false)
const dlg = ref(false)
const guardando = ref(false)

function diasDefault() {
  const d = {}
  DIAS.forEach(dia => { d[dia.num] = { activo:false, hora_inicio:'18:00', hora_fin:'23:30', cruza_medianoche:false, horas_default:5.5 } })
  return d
}
const editForm = ref({ id:null, nombre:'', descripcion:'', dias: diasDefault() })

function getDia(config, num) {
  return config.dias?.find(d => d.dia_semana === num)
}

async function cargar() {
  cargando.value = true
  try {
    const r = await api.get('/nomina/horario-config', { params: { empresa: empresa.value } })
    configs.value = r.data?.data || []
  } finally { cargando.value = false }
}

function abrirNuevo() {
  editForm.value = { id:null, nombre:'', descripcion:'', dias: diasDefault() }
  // Pre-fill with typical restaurant schedule
  ;[1,2,3,4].forEach(d => {
    editForm.value.dias[d] = { activo:true, hora_inicio:'18:00', hora_fin:'23:30', cruza_medianoche:false, horas_default:5.5 }
  })
  ;[4,5,6,7].forEach(d => {
    editForm.value.dias[d] = { activo:true, hora_inicio:'18:00', hora_fin:'00:30', cruza_medianoche:true, horas_default:6.5 }
  })
  dlg.value = true
}

function editar(c) {
  const dias = diasDefault()
  c.dias?.forEach(d => {
    dias[d.dia_semana] = { activo: d.activo, hora_inicio: d.hora_inicio?.slice(0,5)||'18:00',
      hora_fin: d.hora_fin?.slice(0,5)||'23:30', cruza_medianoche: d.cruza_medianoche, horas_default: d.horas_default }
  })
  editForm.value = { id: c.id, nombre: c.nombre, descripcion: c.descripcion||'', dias }
  dlg.value = true
}

function calcularHoras(hora_inicio, hora_fin, cruza_medianoche) {
  if (!hora_inicio || !hora_fin) return 0
  const [h1, m1] = hora_inicio.split(':').map(Number)
  const [h2, m2] = hora_fin.split(':').map(Number)
  let minutos = (h2 * 60 + m2) - (h1 * 60 + m1)
  if (minutos < 0 || cruza_medianoche) minutos += 24 * 60
  return parseFloat((minutos / 60).toFixed(2))
}

watch(() => editForm.value.dias, (newDias) => {
  DIAS.forEach(dia => {
    if (newDias[dia.num]?.activo && newDias[dia.num].hora_inicio && newDias[dia.num].hora_fin) {
      newDias[dia.num].horas_default = calcularHoras(
        newDias[dia.num].hora_inicio,
        newDias[dia.num].hora_fin,
        newDias[dia.num].cruza_medianoche
      )
    }
  })
}, { deep: true })

async function guardar() {
  if (!editForm.value.nombre) return
  guardando.value = true
  try {
    const diasArr = DIAS
      .filter(d => editForm.value.dias[d.num]?.activo)
      .map(d => ({ dia_semana: d.num, ...editForm.value.dias[d.num] }))
    const payload = { empresa: empresa.value, nombre: editForm.value.nombre,
                      descripcion: editForm.value.descripcion, dias: diasArr }
    if (editForm.value.id) {
      await api.put(`/nomina/horario-config/${editForm.value.id}`, payload)
    } else {
      await api.post('/nomina/horario-config', payload)
    }
    dlg.value = false; cargar()
  } finally { guardando.value = false }
}
onMounted(cargar)
</script>
<style scoped>
.nom-wrap { display: flex; flex-direction: column; gap: 16px; }
.nom-header { display: flex; align-items: center; gap: 14px; background: linear-gradient(135deg,#0c2340,#0f4f6e); border-radius: 14px; padding: 20px 24px; }
.nom-header-icon { width: 42px; height: 42px; border-radius: 10px; background: rgba(6,182,212,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nom-title { font-size: 17px; font-weight: 800; color: #fff; margin: 0; }
.nom-sub   { font-size: 12px; color: rgba(255,255,255,0.45); margin: 0; }
.flex-1 { flex: 1; }
.nom-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),0.07); border-radius: 14px; overflow: hidden; }
.cfg-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.07); }
.cfg-dias-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 0; }
.cfg-dia { padding: 12px 8px; text-align: center; border-right: 1px solid rgba(var(--v-theme-on-surface),0.06); }
.cfg-dia:last-child { border-right: none; }
.cfg-dia-nombre { font-size: 10px; font-weight: 800; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface),0.45); text-transform: uppercase; margin-bottom: 6px; }
.cfg-dia-horas { font-size: 11px; font-weight: 600; color: #06b6d4; }
.cfg-dia-hrs { font-size: 10px; color: rgba(var(--v-theme-on-surface),0.4); margin-top: 2px; }
.cfg-midnight { font-size: 9px; background: rgba(245,158,11,0.15); color: #f59e0b; padding: 1px 4px; border-radius: 3px; margin-left: 3px; }
.cfg-dia-libre { font-size: 10px; color: rgba(var(--v-theme-on-surface),0.25); }
.cfg-section-title { font-size: 10px; font-weight: 800; letter-spacing: 1px; color: rgba(var(--v-theme-on-surface),0.45); text-transform: uppercase; }
.mb-2 { margin-bottom: 8px; } .mb-4 { margin-bottom: 16px; }
.drw-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.drw-field { display: flex; flex-direction: column; gap: 4px; }
.drw-field label { font-size: 10px; font-weight: 700; color: rgba(var(--v-theme-on-surface),0.5); text-transform: uppercase; }
.drw-input { height: 34px; padding: 0 8px; border-radius: 7px; border: 1px solid rgba(var(--v-theme-on-surface),0.15); background: rgba(var(--v-theme-on-surface),0.03); color: rgb(var(--v-theme-on-surface)); font-size: 12px; outline: none; }
.drw-input:focus { border-color: #06b6d4; }
.cfg-edit-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.06); flex-wrap: wrap; }
.cfg-edit-dia { width: 80px; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.cfg-edit-check { display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; }
.cfg-edit-time { display: flex; flex-direction: column; gap: 2px; }
.cfg-edit-time label { font-size: 9px; color: rgba(var(--v-theme-on-surface),0.4); }
</style>
