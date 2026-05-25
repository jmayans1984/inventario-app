<template>
  <MainLayout>
    <div class="pg-container">

      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">PRODUCCIÓN</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Configuración</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Grupo de Productos</span>
      </div>

      <!-- HEADER -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <v-icon size="24" color="white">mdi-folder-multiple-outline</v-icon>
          </div>
          <div>
            <h1 class="page-title">GRUPO DE PRODUCTOS</h1>
            <p class="page-sub">Categorías para organizar el catálogo de productos de venta</p>
          </div>
        </div>
        <v-btn color="#06b6d4" variant="flat" prepend-icon="mdi-plus" @click="abrirModal()">
          Nuevo Grupo
        </v-btn>
      </div>

      <!-- BUSCADOR + CONTADOR -->
      <div class="toolbar">
        <div class="search-wrap">
          <v-icon size="17" color="rgba(var(--v-theme-on-surface),.4)">mdi-magnify</v-icon>
          <input v-model="busqueda" type="text" placeholder="Buscar grupo..." class="search-input" />
        </div>
        <span class="count-badge">{{ filasFiltradas.length }} grupos</span>
      </div>

      <!-- TABLA -->
      <div class="tabla-card">
        <div v-if="loading" class="loading-wrap">
          <v-progress-circular indeterminate color="#06b6d4" size="36" />
        </div>
        <table v-else class="crud-table">
          <thead>
            <tr>
              <th>CÓDIGO</th>
              <th>NOMBRE</th>
              <th class="col-acc">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filasFiltradas.length === 0">
              <td colspan="3" class="empty-row">
                <v-icon size="40" color="rgba(var(--v-theme-on-surface),.15)">mdi-folder-open-outline</v-icon>
                <p>No hay grupos registrados</p>
              </td>
            </tr>
            <tr v-for="g in filasFiltradas" :key="g.codigo" class="data-row">
              <td><span class="cod-badge">{{ g.codigo }}</span></td>
              <td class="nombre-cell">{{ g.nombre }}</td>
              <td class="col-acc">
                <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" color="primary" @click="abrirModal(g)" />
                <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" @click="confirmarEliminar(g)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MODAL CREAR / EDITAR -->
      <v-dialog v-model="modal" max-width="420" persistent>
        <v-card class="modal-card">
          <div class="modal-header">
            <v-icon color="#06b6d4" class="mr-2">mdi-folder-outline</v-icon>
            <span>{{ editando ? 'Editar Grupo' : 'Nuevo Grupo' }}</span>
            <v-spacer />
            <v-btn icon="mdi-close" size="small" variant="text" @click="modal = false" />
          </div>
          <div class="modal-body">
            <div class="field-group">
              <label class="field-label">Código *</label>
              <input
                v-model="form.codigo"
                :disabled="editando"
                type="text"
                maxlength="10"
                placeholder="Ej: GRP001"
                class="field-input"
                :class="{ 'field-error': errores.codigo }"
                @input="form.codigo = form.codigo.toUpperCase()"
              />
              <span v-if="errores.codigo" class="error-txt">{{ errores.codigo }}</span>
            </div>
            <div class="field-group">
              <label class="field-label">Nombre *</label>
              <input
                v-model="form.nombre"
                type="text"
                maxlength="80"
                placeholder="Nombre del grupo"
                class="field-input"
                :class="{ 'field-error': errores.nombre }"
              />
              <span v-if="errores.nombre" class="error-txt">{{ errores.nombre }}</span>
            </div>
            <div v-if="msgError" class="api-error">{{ msgError }}</div>
          </div>
          <div class="modal-footer">
            <v-btn variant="text" @click="modal = false">Cancelar</v-btn>
            <v-btn color="#06b6d4" variant="flat" :loading="guardando" @click="guardar">
              {{ editando ? 'Guardar Cambios' : 'Crear Grupo' }}
            </v-btn>
          </div>
        </v-card>
      </v-dialog>

      <!-- CONFIRM ELIMINAR -->
      <v-dialog v-model="confirmModal" max-width="360">
        <v-card class="modal-card">
          <div class="modal-header">
            <v-icon color="#ef4444" class="mr-2">mdi-alert-circle-outline</v-icon>
            <span>Eliminar Grupo</span>
          </div>
          <div class="modal-body">
            <p>¿Eliminar el grupo <strong>{{ eliminando?.nombre }}</strong>? Esta acción no se puede deshacer.</p>
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

const grupos    = ref([])
const busqueda  = ref('')
const loading   = ref(false)
const guardando = ref(false)
const modal     = ref(false)
const confirmModal = ref(false)
const editando  = ref(false)
const eliminando = ref(null)
const msgError  = ref('')
const form      = ref({ codigo: '', nombre: '' })
const errores   = ref({})

const filasFiltradas = computed(() => {
  const q = busqueda.value.toLowerCase()
  return grupos.value.filter(g =>
    g.codigo.toLowerCase().includes(q) || g.nombre.toLowerCase().includes(q)
  )
})

async function cargar() {
  const emp = getEmpresa()
  if (!emp) return
  loading.value = true
  try {
    const r = await api.get('/produccion/grupo-productos', { params: { empresa: emp } })
    grupos.value = r.data?.data || []
  } catch (e) { console.error(e) } finally { loading.value = false }
}

function abrirModal(g = null) {
  errores.value = {}
  msgError.value = ''
  editando.value = !!g
  form.value = g ? { codigo: g.codigo, nombre: g.nombre } : { codigo: '', nombre: '' }
  modal.value = true
}

function validar() {
  const e = {}
  if (!form.value.codigo.trim()) e.codigo = 'Requerido'
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
      await api.put(`/produccion/grupo-productos/${form.value.codigo}`, { ...form.value, empresa: emp })
      const idx = grupos.value.findIndex(g => g.codigo === form.value.codigo)
      if (idx >= 0) grupos.value[idx].nombre = form.value.nombre
    } else {
      const r = await api.post('/produccion/grupo-productos', { ...form.value, empresa: emp })
      grupos.value.push(r.data.data)
    }
    modal.value = false
  } catch (e) {
    msgError.value = e?.response?.data?.error || e.message
  } finally { guardando.value = false }
}

function confirmarEliminar(g) { eliminando.value = g; confirmModal.value = true }

async function eliminar() {
  guardando.value = true
  try {
    await api.delete(`/produccion/grupo-productos/${eliminando.value.codigo}`, {
      params: { empresa: getEmpresa() }
    })
    grupos.value = grupos.value.filter(g => g.codigo !== eliminando.value.codigo)
    confirmModal.value = false
  } catch (e) { console.error(e) } finally { guardando.value = false }
}

onMounted(cargar)
</script>

<style scoped>
.pg-container { padding: 24px; max-width: 900px; margin: 0 auto; }

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
.col-acc { width: 90px; text-align: center !important; }
.data-row td { padding: 10px 14px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); color: rgb(var(--v-theme-on-surface)); }
.data-row:last-child td { border-bottom: none; }
.data-row:hover td { background: rgba(var(--v-theme-on-surface),.02); }
.cod-badge { background: rgba(6,182,212,.12); color: #06b6d4; padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 700; font-family: monospace; }
.nombre-cell { font-weight: 500; }
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
.field-input:disabled { opacity: .55; cursor: not-allowed; }
.error-txt { font-size: 11px; color: #ef4444; margin-top: 3px; display: block; }
.api-error { background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.2); border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #ef4444; margin-top: 8px; }
</style>
