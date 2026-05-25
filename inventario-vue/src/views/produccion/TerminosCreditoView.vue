<template>
  <MainLayout>
    <div class="pg-container">

      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">PRODUCCIÓN</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Configuración</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Términos de Crédito</span>
      </div>

      <!-- HEADER -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <v-icon size="24" color="white">mdi-file-sign</v-icon>
          </div>
          <div>
            <h1 class="page-title">TÉRMINOS DE CRÉDITO</h1>
            <p class="page-sub">Condiciones de pago y plazos de crédito para clientes</p>
          </div>
        </div>
        <v-btn color="#06b6d4" variant="flat" prepend-icon="mdi-plus" @click="abrirModal()">
          Nuevo Término
        </v-btn>
      </div>

      <!-- BUSCADOR + CONTADOR -->
      <div class="toolbar">
        <div class="search-wrap">
          <v-icon size="17" color="rgba(var(--v-theme-on-surface),.4)">mdi-magnify</v-icon>
          <input v-model="busqueda" type="text" placeholder="Buscar término..." class="search-input" />
        </div>
        <span class="count-badge">{{ filasFiltradas.length }} términos</span>
      </div>

      <!-- TABLA -->
      <div class="tabla-card">
        <div v-if="loading" class="loading-wrap">
          <v-progress-circular indeterminate color="#06b6d4" size="36" />
        </div>
        <table v-else class="crud-table">
          <thead>
            <tr>
              <th>NOMBRE</th>
              <th class="col-center">DÍAS DE PAGO</th>
              <th>DESCRIPCIÓN</th>
              <th class="col-center">ESTADO</th>
              <th class="col-acc">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filasFiltradas.length === 0">
              <td colspan="5" class="empty-row">
                <v-icon size="40" color="rgba(var(--v-theme-on-surface),.15)">mdi-file-document-outline</v-icon>
                <p>No hay términos de crédito registrados</p>
              </td>
            </tr>
            <tr v-for="tc in filasFiltradas" :key="tc.id" class="data-row">
              <td class="nombre-cell">{{ tc.nombre }}</td>
              <td class="col-center">
                <span class="dias-badge">{{ tc.dias_pago ?? 0 }} días</span>
              </td>
              <td class="desc-cell">{{ tc.descripcion || '—' }}</td>
              <td class="col-center">
                <span :class="tc.activo === 'SI' ? 'chip-activo' : 'chip-inactivo'">
                  {{ tc.activo === 'SI' ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="col-acc">
                <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" color="primary" @click="abrirModal(tc)" />
                <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" @click="confirmarEliminar(tc)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MODAL CREAR / EDITAR -->
      <v-dialog v-model="modal" max-width="460" persistent>
        <v-card class="modal-card">
          <div class="modal-header">
            <v-icon color="#06b6d4" class="mr-2">mdi-file-sign</v-icon>
            <span>{{ editando ? 'Editar Término' : 'Nuevo Término de Crédito' }}</span>
            <v-spacer />
            <v-btn icon="mdi-close" size="small" variant="text" @click="modal = false" />
          </div>
          <div class="modal-body">
            <div class="field-group">
              <label class="field-label">Nombre *</label>
              <input
                v-model="form.nombre"
                type="text"
                maxlength="100"
                placeholder="Ej: CONTADO, 30 DÍAS, NET 60"
                class="field-input"
                :class="{ 'field-error': errores.nombre }"
              />
              <span v-if="errores.nombre" class="error-txt">{{ errores.nombre }}</span>
            </div>
            <div class="field-group">
              <label class="field-label">Días de Pago</label>
              <input
                v-model.number="form.dias_pago"
                type="number"
                min="0"
                max="365"
                placeholder="0"
                class="field-input"
              />
              <span class="hint-txt">0 = pago inmediato (contado)</span>
            </div>
            <div class="field-group">
              <label class="field-label">Descripción</label>
              <textarea
                v-model="form.descripcion"
                rows="2"
                maxlength="255"
                placeholder="Descripción opcional del término de crédito"
                class="field-input field-textarea"
              />
            </div>
            <div class="field-group">
              <label class="field-label">Estado</label>
              <div class="radio-group">
                <label class="radio-opt">
                  <input type="radio" v-model="form.activo" value="SI" />
                  <span>Activo</span>
                </label>
                <label class="radio-opt">
                  <input type="radio" v-model="form.activo" value="NO" />
                  <span>Inactivo</span>
                </label>
              </div>
            </div>
            <div v-if="msgError" class="api-error">{{ msgError }}</div>
          </div>
          <div class="modal-footer">
            <v-btn variant="text" @click="modal = false">Cancelar</v-btn>
            <v-btn color="#06b6d4" variant="flat" :loading="guardando" @click="guardar">
              {{ editando ? 'Guardar Cambios' : 'Crear Término' }}
            </v-btn>
          </div>
        </v-card>
      </v-dialog>

      <!-- CONFIRM ELIMINAR -->
      <v-dialog v-model="confirmModal" max-width="360">
        <v-card class="modal-card">
          <div class="modal-header">
            <v-icon color="#ef4444" class="mr-2">mdi-alert-circle-outline</v-icon>
            <span>Eliminar Término</span>
          </div>
          <div class="modal-body">
            <p>¿Eliminar el término <strong>{{ eliminando?.nombre }}</strong>? Esta acción no se puede deshacer.</p>
          </div>
          <div class="modal-footer">
            <v-btn variant="text" @click="confirmModal = false">Cancelar</v-btn>
            <v-btn color="error" variant="flat" :loading="guardando" @click="eliminar">Eliminar</v-btn>
          </div>
        </v-card>
      </v-dialog>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
function getEmpresa() {
  return authStore.empresaCodigo || authStore.empresa || localStorage.getItem('empresaActual') || ''
}

const terminos    = ref([])
const busqueda    = ref('')
const loading     = ref(false)
const guardando   = ref(false)
const modal       = ref(false)
const confirmModal = ref(false)
const editando    = ref(false)
const eliminando  = ref(null)
const msgError    = ref('')
const form        = ref({ nombre: '', dias_pago: 0, descripcion: '', activo: 'SI' })
const errores     = ref({})

const filasFiltradas = computed(() => {
  const q = busqueda.value.toLowerCase()
  return terminos.value.filter(t =>
    t.nombre.toLowerCase().includes(q) ||
    (t.descripcion || '').toLowerCase().includes(q)
  )
})

async function cargar() {
  const emp = getEmpresa()
  if (!emp) return
  loading.value = true
  try {
    const r = await api.get('/produccion/terminos-credito', { params: { empresa: emp } })
    terminos.value = r.data?.data || []
  } catch (e) { console.error(e) } finally { loading.value = false }
}

function abrirModal(tc = null) {
  errores.value = {}
  msgError.value = ''
  editando.value = !!tc
  form.value = tc
    ? { id: tc.id, nombre: tc.nombre, dias_pago: tc.dias_pago ?? 0, descripcion: tc.descripcion || '', activo: tc.activo || 'SI' }
    : { nombre: '', dias_pago: 0, descripcion: '', activo: 'SI' }
  modal.value = true
}

function validar() {
  const e = {}
  if (!form.value.nombre.trim()) e.nombre = 'Requerido'
  errores.value = e
  return Object.keys(e).length === 0
}

async function guardar() {
  if (!validar()) return
  guardando.value = true
  msgError.value = ''
  const emp = getEmpresa()
  try {
    if (editando.value) {
      const r = await api.put(`/produccion/terminos-credito/${form.value.id}`, { ...form.value, empresa: emp })
      const idx = terminos.value.findIndex(t => t.id === form.value.id)
      if (idx >= 0) terminos.value[idx] = r.data.data || { ...terminos.value[idx], ...form.value }
    } else {
      const r = await api.post('/produccion/terminos-credito', { ...form.value, empresa: emp })
      terminos.value.push(r.data.data)
    }
    modal.value = false
  } catch (e) {
    msgError.value = e?.response?.data?.error || e.message
  } finally { guardando.value = false }
}

function confirmarEliminar(tc) { eliminando.value = tc; confirmModal.value = true }

async function eliminar() {
  guardando.value = true
  try {
    await api.delete(`/produccion/terminos-credito/${eliminando.value.id}`, {
      params: { empresa: getEmpresa() }
    })
    terminos.value = terminos.value.filter(t => t.id !== eliminando.value.id)
    confirmModal.value = false
  } catch (e) { console.error(e) } finally { guardando.value = false }
}

onMounted(cargar)
</script>

<style scoped>
.pg-container { padding: 24px; max-width: 960px; margin: 0 auto; }

.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface),.45); }
.bc-root { color: #06b6d4; }
.bc-sep  { color: rgba(var(--v-theme-on-surface),.25) !important; }
.bc-current { color: rgba(var(--v-theme-on-surface),.7); }

.page-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
.header-left { display: flex; align-items: center; gap: 14px; }
.header-icon { width: 46px; height: 46px; border-radius: 12px; background: linear-gradient(135deg,#06b6d4,#0891b2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.page-title { font-size: 17px; font-weight: 800; letter-spacing: .5px; margin: 0; color: rgb(var(--v-theme-on-surface)); }
.page-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }

.toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.search-wrap { display: flex; align-items: center; gap: 8px; flex: 1; padding: 8px 12px; background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.1); border-radius: 8px; }
.search-input { flex: 1; border: none; background: transparent; outline: none; font-size: 13px; color: rgb(var(--v-theme-on-surface)); }
.search-input::placeholder { color: rgba(var(--v-theme-on-surface),.35); }
.count-badge { font-size: 12px; font-weight: 600; color: rgba(var(--v-theme-on-surface),.45); white-space: nowrap; }

.tabla-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 12px; overflow: hidden; }
.loading-wrap { display: flex; justify-content: center; padding: 40px; }
.crud-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.crud-table thead th { padding: 11px 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.45); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); text-align: left; }
.col-center { text-align: center !important; }
.col-acc { width: 90px; text-align: center !important; }
.data-row td { padding: 10px 14px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); color: rgb(var(--v-theme-on-surface)); }
.data-row:last-child td { border-bottom: none; }
.data-row:hover td { background: rgba(var(--v-theme-on-surface),.02); }
.nombre-cell { font-weight: 500; }
.desc-cell { color: rgba(var(--v-theme-on-surface),.6); font-size: 12px; max-width: 260px; }
.dias-badge { background: rgba(6,182,212,.1); color: #0891b2; padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 700; }
.chip-activo { background: rgba(34,197,94,.12); color: #16a34a; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.chip-inactivo { background: rgba(239,68,68,.1); color: #dc2626; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.empty-row { text-align: center !important; padding: 48px !important; color: rgba(var(--v-theme-on-surface),.35); }
.empty-row p { margin: 10px 0 0; font-size: 13px; }

/* Modal */
.modal-card { border-radius: 14px !important; overflow: hidden; }
.modal-header { display: flex; align-items: center; padding: 16px 20px; background: rgba(var(--v-theme-on-surface),.03); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); font-weight: 700; font-size: 15px; }
.modal-body { padding: 20px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid rgba(var(--v-theme-on-surface),.07); }

.field-group { margin-bottom: 16px; }
.field-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.5); margin-bottom: 6px; }
.field-input { width: 100%; padding: 9px 12px; border: 1px solid rgba(var(--v-theme-on-surface),.15); border-radius: 8px; font-size: 13px; background: rgba(var(--v-theme-on-surface),.03); color: rgb(var(--v-theme-on-surface)); outline: none; transition: border-color .2s; box-sizing: border-box; }
.field-input:focus { border-color: #06b6d4; }
.field-input.field-error { border-color: #ef4444; }
.field-textarea { resize: vertical; min-height: 60px; font-family: inherit; }
.error-txt { font-size: 11px; color: #ef4444; margin-top: 3px; display: block; }
.hint-txt { font-size: 11px; color: rgba(var(--v-theme-on-surface),.4); margin-top: 3px; display: block; }
.api-error { background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.2); border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #ef4444; margin-top: 8px; }

.radio-group { display: flex; gap: 20px; }
.radio-opt { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 13px; color: rgb(var(--v-theme-on-surface)); }
.radio-opt input[type="radio"] { accent-color: #06b6d4; width: 15px; height: 15px; }
</style>
