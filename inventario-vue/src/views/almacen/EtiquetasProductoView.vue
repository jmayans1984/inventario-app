<template>
  <MainLayout>
    <div class="pg-container">

      <PageHeader
        title="Etiquetas de Producto"
        description="Configura las características de cada etiqueta de producto fabricado"
        :crumbs="['Almacén', 'Configuración', 'Etiquetas de Producto']"
      >
        <template #actions>
          <v-btn color="primary" variant="flat" size="large" prepend-icon="mdi-plus" @click="abrirModal()">
            Nueva Etiqueta
          </v-btn>
        </template>
      </PageHeader>

      <div class="toolbar">
        <div class="search-wrap">
          <v-icon size="17" color="rgba(var(--v-theme-on-surface),.4)">mdi-magnify</v-icon>
          <input v-model="busqueda" type="text" placeholder="Buscar por código o producto..." class="search-input" />
        </div>
        <span class="count-badge">{{ filtradas.length }} etiquetas</span>
      </div>

      <div class="tabla-card">
        <div v-if="loading" class="loading-wrap">
          <v-progress-circular indeterminate color="var(--success)" size="36" />
        </div>
        <table v-else class="crud-table">
          <thead>
            <tr>
              <th>CÓDIGO</th>
              <th>PRODUCTO</th>
              <th class="col-r">PESO NETO (g)</th>
              <th class="col-r">PORCIONES</th>
              <th class="col-r">DÍAS VENC.</th>
              <th class="col-center">ESTADO</th>
              <th class="col-acc">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filtradas.length === 0">
              <td colspan="7" class="empty-row">
                <v-icon size="40" color="rgba(var(--v-theme-on-surface),.15)">mdi-label-off-outline</v-icon>
                <p>No hay etiquetas registradas</p>
              </td>
            </tr>
            <tr v-for="e in filtradas" :key="e.codigo" class="data-row">
              <td><span class="cod-badge">{{ e.codigo }}</span></td>
              <td class="fw500">{{ e.producto }}</td>
              <td class="col-r mono">{{ e.peso_neto_g ?? '—' }}</td>
              <td class="col-r mono">{{ e.porciones ?? '—' }}</td>
              <td class="col-r mono">{{ e.dias_vencimiento ?? '—' }}</td>
              <td class="col-center">
                <span :class="e.activo === 'SI' ? 'chip-activo' : 'chip-inactivo'">
                  {{ e.activo === 'SI' ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="col-acc">
                <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
                  <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" color="primary" @click="abrirModal(e)" />
                  <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error"
                    :loading="eliminando === e.codigo" @click="eliminar(e)" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MODAL -->
      <v-dialog v-model="modal" max-width="700" scrollable>
        <v-card class="modal-card">
          <div class="modal-header">
            <v-icon color="var(--success)" class="mr-2">mdi-label-outline</v-icon>
            <span>{{ editando ? 'Editar Etiqueta' : 'Nueva Etiqueta' }}</span>
            <v-spacer />
            <v-btn icon="mdi-close" size="small" variant="text" @click="modal = false" />
          </div>
          <div class="modal-body">
            <div class="form-row-2">
              <div class="field-group">
                <label class="field-label">Código *</label>
                <input v-model="form.codigo" :disabled="editando" type="text" maxlength="50"
                  class="field-input cod-input" :class="{ 'field-error': err.codigo }"
                  @input="form.codigo = form.codigo.toUpperCase()" />
                <span v-if="err.codigo" class="error-txt">{{ err.codigo }}</span>
              </div>
              <div class="field-group">
                <label class="field-label">Producto *</label>
                <input v-model="form.producto" type="text" maxlength="50" class="field-input"
                  :class="{ 'field-error': err.producto }"
                  @input="form.producto = form.producto.toUpperCase()" />
                <span v-if="err.producto" class="error-txt">{{ err.producto }}</span>
              </div>
            </div>

            <div class="form-row-3">
              <div class="field-group">
                <label class="field-label">Peso Neto (oz)</label>
                <input v-model="form.peso_neto_oz" type="number" step="0.01" class="field-input col-r" />
              </div>
              <div class="field-group">
                <label class="field-label">Peso Neto (g)</label>
                <input v-model="form.peso_neto_g" type="number" step="0.01" class="field-input col-r" />
              </div>
              <div class="field-group">
                <label class="field-label">Porciones</label>
                <input v-model="form.porciones" type="number" step="0.01" class="field-input col-r" />
              </div>
            </div>

            <div class="form-row-2">
              <div class="field-group">
                <label class="field-label">Tamaño de Porción</label>
                <input v-model="form.tamano_porcion" type="text" maxlength="50" class="field-input" />
              </div>
              <div class="field-group">
                <label class="field-label">Días de Vencimiento</label>
                <input v-model="form.dias_vencimiento" type="number" class="field-input col-r" />
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">Código de Barras</label>
              <input v-model="form.barcode" type="text" maxlength="100" class="field-input"
                placeholder="Ej. 0068778788407" />
            </div>

            <div class="field-group">
              <label class="field-label">Ingredientes</label>
              <textarea v-model="form.ingredientes" rows="3" class="field-input field-textarea"
                placeholder="Lista de ingredientes..." />
            </div>

            <div class="field-group">
              <label class="field-label">Alérgenos</label>
              <textarea v-model="form.alergenos" rows="2" class="field-input field-textarea"
                placeholder="Contiene: gluten, lácteos..." />
            </div>

            <div class="field-group">
              <label class="field-label">Instrucciones</label>
              <textarea v-model="form.instrucciones" rows="2" class="field-input field-textarea"
                placeholder="Instrucciones de preparación o conservación..." />
            </div>

            <div class="field-group">
              <label class="field-label">Estado</label>
              <div class="radio-group">
                <label class="radio-opt"><input type="radio" v-model="form.activo" value="SI" /><span>Activo</span></label>
                <label class="radio-opt"><input type="radio" v-model="form.activo" value="NO" /><span>Inactivo</span></label>
              </div>
            </div>

            <div v-if="msgError" class="api-error">{{ msgError }}</div>
          </div>
          <div class="modal-footer">
            <v-btn variant="text" @click="modal = false">Cancelar</v-btn>
            <v-btn color="primary" variant="flat" :loading="guardando" @click="guardar">
              {{ editando ? 'Guardar Cambios' : 'Crear Etiqueta' }}
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
import PageHeader from '../../components/common/PageHeader.vue'
import { useAuthStore } from '../../stores/auth.js'
import { API_BASE } from '../../utils/constants.js'

const auth = useAuthStore()
const empresa = computed(() => auth.empresaCodigo)

const etiquetas  = ref([])
const busqueda   = ref('')
const loading    = ref(false)
const guardando  = ref(false)
const eliminando = ref(null)
const modal      = ref(false)
const editando   = ref(false)
const msgError   = ref('')
const err        = ref({})

const formVacio = () => ({
  codigo: '', producto: '', peso_neto_oz: '', peso_neto_g: '',
  porciones: '', tamano_porcion: '', ingredientes: '',
  alergenos: '', instrucciones: '', dias_vencimiento: '', activo: 'SI', barcode: ''
})
const form = ref(formVacio())

const filtradas = computed(() => {
  const q = busqueda.value.toLowerCase()
  return etiquetas.value.filter(e =>
    e.codigo.toLowerCase().includes(q) || e.producto.toLowerCase().includes(q)
  )
})

async function cargar() {
  loading.value = true
  try {
    const r = await fetch(`${API_BASE}/almacen/etiquetas-producto?empresa=${empresa.value}`)
    const j = await r.json()
    etiquetas.value = j.data || []
  } catch (e) { console.error(e) } finally { loading.value = false }
}

function abrirModal(e = null) {
  err.value = {}
  msgError.value = ''
  editando.value = !!e
  form.value = e
    ? { ...e, peso_neto_oz: e.peso_neto_oz ?? '', peso_neto_g: e.peso_neto_g ?? '',
        porciones: e.porciones ?? '', dias_vencimiento: e.dias_vencimiento ?? '' }
    : formVacio()
  modal.value = true
}

function validar() {
  const e = {}
  if (!form.value.codigo.trim())   e.codigo   = 'Requerido'
  if (!form.value.producto.trim()) e.producto = 'Requerido'
  err.value = e
  return Object.keys(e).length === 0
}

async function guardar() {
  if (!validar()) return
  guardando.value = true
  msgError.value = ''
  try {
    const payload = { ...form.value, empresa: empresa.value }
    const url = editando.value
      ? `${API_BASE}/almacen/etiquetas-producto/${form.value.codigo}`
      : `${API_BASE}/almacen/etiquetas-producto`
    const r = await fetch(url, {
      method: editando.value ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    if (editando.value) {
      const idx = etiquetas.value.findIndex(x => x.codigo === form.value.codigo)
      if (idx >= 0) etiquetas.value[idx] = j.data
    } else {
      etiquetas.value.push(j.data)
    }
    modal.value = false
  } catch (e) {
    msgError.value = e.message
  } finally { guardando.value = false }
}

async function eliminar(e) {
  eliminando.value = e.codigo
  try {
    const r = await fetch(`${API_BASE}/almacen/etiquetas-producto/${e.codigo}`, { method: 'DELETE' })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    etiquetas.value = etiquetas.value.filter(x => x.codigo !== e.codigo)
  } catch (ex) {
    alert(ex.message)
  } finally { eliminando.value = null }
}

onMounted(cargar)
</script>

<style scoped>
.pg-container { padding: 24px; max-width: 1100px; margin: 0 auto; }

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
.col-r { text-align: right !important; }
.col-acc { width: 90px; text-align: center !important; }
.data-row td { padding: 10px 14px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); color: rgb(var(--v-theme-on-surface)); }
.data-row:last-child td { border-bottom: none; }
.data-row:hover td { background: rgba(var(--v-theme-on-surface),.02); }
.cod-badge { background: var(--success-wash); color: var(--success); padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 700; font-variant-numeric: tabular-nums; }
.fw500 { font-weight: 500; }
.mono { font-variant-numeric: tabular-nums; }
.chip-activo { background: var(--success-wash); color: var(--success); padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.chip-inactivo { background: var(--error-wash); color: var(--error); padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.empty-row { text-align: center !important; padding: 48px !important; color: rgba(var(--v-theme-on-surface),.35); }
.empty-row p { margin: 10px 0 0; font-size: 13px; }

.modal-card { border-radius: 14px !important; overflow: hidden; }
.modal-header { display: flex; align-items: center; padding: 16px 20px; background: rgba(var(--v-theme-on-surface),.03); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); font-weight: 700; font-size: 15px; }
.modal-body { padding: 20px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid rgba(var(--v-theme-on-surface),.07); }

.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
.field-group { margin-bottom: 14px; }
.field-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.5); margin-bottom: 6px; }
.field-input { width: 100%; padding: 9px 12px; border: 1px solid rgba(var(--v-theme-on-surface),.15); border-radius: 8px; font-size: 13px; background: rgba(var(--v-theme-on-surface),.03); color: rgb(var(--v-theme-on-surface)); outline: none; transition: border-color .2s; box-sizing: border-box; }
.field-input:focus { border-color: var(--success); }
.field-input.field-error { border-color: var(--error); }
.field-input:disabled { opacity: .55; cursor: not-allowed; }
.field-textarea { resize: vertical; min-height: 72px; font-family: inherit; }
.cod-input { text-align: center; font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: 2px; font-size: 15px; }
.error-txt { font-size: 11px; color: var(--error); margin-top: 3px; display: block; }
.api-error { background: var(--error-wash); border: 1px solid var(--error); border-radius: 8px; padding: 10px 14px; font-size: 12px; color: var(--error); margin-top: 8px; }
.radio-group { display: flex; gap: 20px; }
.radio-opt { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 13px; color: rgb(var(--v-theme-on-surface)); }
.radio-opt input[type="radio"] { accent-color: var(--success); width: 15px; height: 15px; }
</style>
