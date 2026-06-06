<template>
  <MainLayout>
    <div class="pg-container">

      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">PROVEEDURÍA</span>
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
            <p class="page-sub">Categorías para organizar el catálogo de productos</p>
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
              <th class="col-center">ESTADO</th>
              <th class="col-acc">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filasFiltradas.length === 0">
              <td colspan="4" class="empty-row">
                <v-icon size="40" color="rgba(var(--v-theme-on-surface),.15)">mdi-folder-open-outline</v-icon>
                <p>No hay grupos registrados</p>
              </td>
            </tr>
            <tr v-for="g in filasFiltradas" :key="g.codigo" class="data-row">
              <td><span class="cod-badge">{{ g.codigo }}</span></td>
              <td class="nombre-cell">{{ g.nombre }}</td>
              <td class="col-center">
                <span :class="g.activo === 'SI' ? 'chip-activo' : 'chip-inactivo'">
                  {{ g.activo === 'SI' ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="col-acc">
                <v-btn
                  :icon="g.activo === 'SI' ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
                  size="x-small"
                  variant="text"
                  :color="g.activo === 'SI' ? '#10b981' : 'rgba(var(--v-theme-on-surface),.35)'"
                  :loading="toggling === g.codigo"
                  @click="toggleActivo(g)"
                />
                <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" color="primary" @click="abrirModal(g)" />
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
            <!-- CÓDIGO -->
            <div class="field-group">
              <label class="field-label">Código</label>
              <input
                v-model="form.codigo"
                :disabled="editando"
                type="text"
                maxlength="10"
                class="field-input cod-input"
                :class="{ 'field-error': errores.codigo }"
                @input="form.codigo = form.codigo.toUpperCase()"
              />
              <span v-if="errores.codigo" class="error-txt">{{ errores.codigo }}</span>
              <span v-if="!editando" class="hint-txt">Generado automáticamente — puedes modificarlo</span>
            </div>
            <!-- NOMBRE -->
            <div class="field-group">
              <label class="field-label">Nombre *</label>
              <input
                v-model="form.nombre"
                type="text"
                maxlength="80"
                placeholder="Nombre del grupo"
                class="field-input"
                :class="{ 'field-error': errores.nombre }"
                @input="form.nombre = form.nombre.toUpperCase()"
              />
              <span v-if="errores.nombre" class="error-txt">{{ errores.nombre }}</span>
            </div>
            <!-- ACTIVO -->
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
              {{ editando ? 'Guardar Cambios' : 'Crear Grupo' }}
            </v-btn>
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

const grupos    = ref([])
const busqueda  = ref('')
const loading   = ref(false)
const guardando = ref(false)
const toggling  = ref(null)
const modal     = ref(false)
const editando  = ref(false)
const msgError  = ref('')
const form      = ref({ codigo: '', nombre: '', activo: 'SI' })
const errores   = ref({})

const filasFiltradas = computed(() => {
  const q = busqueda.value.toLowerCase()
  return grupos.value.filter(g =>
    g.codigo.toLowerCase().includes(q) || g.nombre.toLowerCase().includes(q)
  )
})

async function cargar() {
  loading.value = true
  try {
    const r = await api.get('/produccion/grupo-productos')
    grupos.value = r.data?.data || []
  } catch (e) { console.error(e) } finally { loading.value = false }
}

async function generarCodigo() {
  try {
    const r = await api.get('/produccion/grupo-productos/proximo-codigo')
    return r.data?.codigo || '001'
  } catch { return '001' }
}

async function abrirModal(g = null) {
  errores.value = {}
  msgError.value = ''
  editando.value = !!g
  if (g) {
    form.value = { codigo: g.codigo, nombre: g.nombre, activo: g.activo || 'SI' }
  } else {
    const cod = await generarCodigo()
    form.value = { codigo: cod, nombre: '', activo: 'SI' }
  }
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
  try {
    if (editando.value) {
      await api.put(`/produccion/grupo-productos/${form.value.codigo}`, { nombre: form.value.nombre, activo: form.value.activo })
      const idx = grupos.value.findIndex(g => g.codigo === form.value.codigo)
      if (idx >= 0) grupos.value[idx] = { ...grupos.value[idx], nombre: form.value.nombre, activo: form.value.activo }
    } else {
      const r = await api.post('/produccion/grupo-productos', { ...form.value })
      grupos.value.push(r.data.data)
    }
    modal.value = false
  } catch (e) {
    msgError.value = e?.response?.data?.error || e.message
  } finally { guardando.value = false }
}

async function toggleActivo(g) {
  toggling.value = g.codigo
  const nuevoActivo = g.activo === 'SI' ? 'NO' : 'SI'
  try {
    await api.put(`/produccion/grupo-productos/${g.codigo}`, { nombre: g.nombre, activo: nuevoActivo })
    const idx = grupos.value.findIndex(x => x.codigo === g.codigo)
    if (idx >= 0) grupos.value[idx] = { ...grupos.value[idx], activo: nuevoActivo }
  } catch (e) { console.error(e) } finally { toggling.value = null }
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
.col-center { text-align: center !important; }
.col-acc { width: 90px; text-align: center !important; white-space: nowrap; }
.data-row td { padding: 10px 14px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); color: rgb(var(--v-theme-on-surface)); }
.data-row:last-child td { border-bottom: none; }
.data-row:hover td { background: rgba(var(--v-theme-on-surface),.02); }
.cod-badge { background: rgba(6,182,212,.12); color: #06b6d4; padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 700; font-family: monospace; }
.nombre-cell { font-weight: 500; }
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
.field-input:disabled { opacity: .55; cursor: not-allowed; }
.cod-input { text-align: center; font-weight: 700; font-family: monospace; letter-spacing: 2px; font-size: 15px; }
.error-txt { font-size: 11px; color: #ef4444; margin-top: 3px; display: block; }
.hint-txt { font-size: 11px; color: rgba(var(--v-theme-on-surface),.4); margin-top: 3px; display: block; }
.api-error { background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.2); border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #ef4444; margin-top: 8px; }

.radio-group { display: flex; gap: 20px; }
.radio-opt { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 13px; color: rgb(var(--v-theme-on-surface)); }
.radio-opt input[type="radio"] { accent-color: #06b6d4; width: 15px; height: 15px; }
</style>
