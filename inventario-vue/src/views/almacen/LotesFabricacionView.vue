<template>
  <MainLayout>
    <div class="pg-container">

      <div class="breadcrumb">
        <span class="bc-root">ALMACÉN</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Procesos</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Órdenes de Producción</span>
      </div>

      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <v-icon size="24" color="white">mdi-factory</v-icon>
          </div>
          <div>
            <h1 class="page-title">ÓRDENES DE PRODUCCIÓN</h1>
            <p class="page-sub">Lotes de fabricación por etiqueta de producto</p>
          </div>
        </div>
        <v-btn color="#047857" variant="flat" prepend-icon="mdi-plus" @click="abrirModal()">
          Nuevo Lote
        </v-btn>
      </div>

      <div class="toolbar">
        <div class="search-wrap">
          <v-icon size="17" color="rgba(var(--v-theme-on-surface),.4)">mdi-magnify</v-icon>
          <input v-model="busqueda" type="text" placeholder="Buscar por código, etiqueta o responsable..." class="search-input" />
        </div>
        <span class="count-badge">{{ filtrados.length }} lotes</span>
      </div>

      <div class="tabla-card">
        <div v-if="loading" class="loading-wrap">
          <v-progress-circular indeterminate color="#10b981" size="36" />
        </div>
        <table v-else class="crud-table">
          <thead>
            <tr>
              <th>CÓDIGO LOTE</th>
              <th>PRODUCTO / ETIQUETA</th>
              <th class="col-center">FECHA FABRICACIÓN</th>
              <th class="col-center">FECHA VENCIMIENTO</th>
              <th>RESPONSABLE</th>
              <th class="col-acc">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filtrados.length === 0">
              <td colspan="6" class="empty-row">
                <v-icon size="40" color="rgba(var(--v-theme-on-surface),.15)">mdi-factory</v-icon>
                <p>No hay lotes registrados</p>
              </td>
            </tr>
            <tr v-for="l in filtrados" :key="l.codigo" class="data-row">
              <td><span class="cod-badge">{{ l.codigo }}</span></td>
              <td>
                <div class="fw500">{{ l.etiqueta_nombre || '—' }}</div>
                <div class="sub-txt">{{ l.etiqueta }}</div>
              </td>
              <td class="col-center">{{ fmtFecha(l.fecha_fab) }}</td>
              <td class="col-center">
                <span :class="venceProximo(l.fecha_vence) ? 'chip-warn' : ''">
                  {{ fmtFecha(l.fecha_vence) }}
                </span>
              </td>
              <td>{{ l.responsable || '—' }}</td>
              <td class="col-acc">
                <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" color="primary" @click="abrirModal(l)" />
                <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error"
                  :loading="eliminando === l.codigo" @click="eliminar(l)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MODAL -->
      <v-dialog v-model="modal" max-width="560">
        <v-card class="modal-card">
          <div class="modal-header">
            <v-icon color="#10b981" class="mr-2">mdi-factory</v-icon>
            <span>{{ editando ? 'Editar Lote' : 'Nuevo Lote de Fabricación' }}</span>
            <v-spacer />
            <v-btn icon="mdi-close" size="small" variant="text" @click="modal = false" />
          </div>
          <div class="modal-body">

            <!-- CÓDIGO (auto-generado, editable) -->
            <div class="field-group">
              <label class="field-label">Código de Lote</label>
              <div class="cod-wrap">
                <input v-model="form.codigo" :disabled="editando" type="text" maxlength="20"
                  class="field-input cod-input" :class="{ 'field-error': err.codigo }" />
                <span class="cod-hint">Formato: MMDDAAXXX (ej. {{ ejemploCodigo }})</span>
              </div>
              <span v-if="err.codigo" class="error-txt">{{ err.codigo }}</span>
            </div>

            <!-- ETIQUETA (select de etiquetas_producto) -->
            <div class="field-group">
              <label class="field-label">Etiqueta de Producto *</label>
              <select v-model="form.etiqueta" class="field-input field-select" :class="{ 'field-error': err.etiqueta }">
                <option value="">— Seleccionar —</option>
                <option v-for="e in etiquetas" :key="e.codigo" :value="e.codigo">
                  {{ e.codigo }} — {{ e.producto }}
                </option>
              </select>
              <span v-if="err.etiqueta" class="error-txt">{{ err.etiqueta }}</span>
            </div>

            <div class="form-row-2">
              <div class="field-group">
                <label class="field-label">Fecha de Fabricación *</label>
                <input v-model="form.fecha_fab" type="date" class="field-input" :class="{ 'field-error': err.fecha_fab }" />
                <span v-if="err.fecha_fab" class="error-txt">{{ err.fecha_fab }}</span>
              </div>
              <div class="field-group">
                <label class="field-label">Fecha de Vencimiento</label>
                <input v-model="form.fecha_vence" type="date" class="field-input" />
                <span class="hint-txt" v-if="diasVencimiento">
                  Sugerido: {{ diasVencimientoStr }} ({{ diasVencimiento }} días)
                </span>
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">Responsable</label>
              <select v-model="form.responsable" class="field-input field-select">
                <option value="">— Seleccionar —</option>
                <option v-for="emp in empleados" :key="emp.id" :value="`${emp.nombre} ${emp.apellido}`">
                  {{ emp.nombre }} {{ emp.apellido }}
                </option>
              </select>
            </div>

            <div class="field-group">
              <label class="field-label">Observaciones</label>
              <textarea v-model="form.observaciones" rows="2" class="field-input field-textarea" />
            </div>

            <div v-if="msgError" class="api-error">{{ msgError }}</div>
          </div>
          <div class="modal-footer">
            <v-btn variant="text" @click="modal = false">Cancelar</v-btn>
            <v-btn color="#047857" variant="flat" :loading="guardando" @click="guardar">
              {{ editando ? 'Guardar Cambios' : 'Crear Lote' }}
            </v-btn>
          </div>
        </v-card>
      </v-dialog>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { useAuthStore } from '../../stores/auth.js'
import { API_BASE } from '../../utils/constants.js'

const auth    = useAuthStore()
const empresa = computed(() => auth.empresaCodigo)

const lotes    = ref([])
const etiquetas = ref([])
const empleados = ref([])
const busqueda  = ref('')
const loading   = ref(false)
const guardando = ref(false)
const eliminando = ref(null)
const modal     = ref(false)
const editando  = ref(false)
const msgError  = ref('')
const err       = ref({})

const formVacio = () => ({
  codigo: '', etiqueta: '', fecha_fab: new Date().toISOString().split('T')[0],
  fecha_vence: '', responsable: '', observaciones: ''
})
const form = ref(formVacio())

const hoy = new Date()
const ejemploCodigo = computed(() => {
  const mm = String(hoy.getMonth() + 1).padStart(2, '0')
  const dd = String(hoy.getDate()).padStart(2, '0')
  const aa = String(hoy.getFullYear()).slice(-2)
  return `${mm}${dd}${aa}001`
})

// Auto-calcular fecha vencimiento cuando seleccionan etiqueta
const diasVencimiento = computed(() => {
  if (!form.value.etiqueta || !form.value.fecha_fab) return null
  const et = etiquetas.value.find(e => e.codigo === form.value.etiqueta)
  return et?.dias_vencimiento || null
})

const diasVencimientoStr = computed(() => {
  if (!diasVencimiento.value || !form.value.fecha_fab) return ''
  const d = new Date(form.value.fecha_fab + 'T12:00:00')
  d.setDate(d.getDate() + diasVencimiento.value)
  return d.toISOString().split('T')[0]
})

watch([() => form.value.etiqueta, () => form.value.fecha_fab], () => {
  if (diasVencimientoStr.value) {
    form.value.fecha_vence = diasVencimientoStr.value
  }
})

const filtrados = computed(() => {
  const q = busqueda.value.toLowerCase()
  return lotes.value.filter(l =>
    l.codigo.toLowerCase().includes(q) ||
    (l.etiqueta_nombre || '').toLowerCase().includes(q) ||
    (l.etiqueta || '').toLowerCase().includes(q) ||
    (l.responsable || '').toLowerCase().includes(q)
  )
})

function fmtFecha(f) {
  if (!f) return '—'
  const d = new Date(String(f).substring(0, 10) + 'T12:00:00')
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
}

function venceProximo(f) {
  if (!f) return false
  const d = new Date(String(f).substring(0, 10) + 'T12:00:00')
  const diff = (d - new Date()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= 7
}

async function cargar() {
  loading.value = true
  try {
    const [rLotes, rEtiq, rEmp] = await Promise.all([
      fetch(`${API_BASE}/almacen/lotes-fabricacion?empresa=${empresa.value}`).then(r => r.json()),
      fetch(`${API_BASE}/almacen/etiquetas-producto?empresa=${empresa.value}`).then(r => r.json()),
      fetch(`${API_BASE}/nomina/empleados-basico?empresa=${empresa.value}`).then(r => r.json())
    ])
    lotes.value     = rLotes.data || []
    etiquetas.value = rEtiq.data || []
    empleados.value = rEmp.data || []
  } catch (e) { console.error(e) } finally { loading.value = false }
}

async function proximoCodigo() {
  try {
    const r = await fetch(`${API_BASE}/almacen/lotes-fabricacion/proximo-codigo`)
    const j = await r.json()
    return j.codigo || ejemploCodigo.value
  } catch { return ejemploCodigo.value }
}

async function abrirModal(l = null) {
  err.value = {}
  msgError.value = ''
  editando.value = !!l
  if (l) {
    form.value = {
      codigo:       l.codigo,
      etiqueta:     l.etiqueta,
      fecha_fab:    String(l.fecha_fab).substring(0, 10),
      fecha_vence:  l.fecha_vence ? String(l.fecha_vence).substring(0, 10) : '',
      responsable:  l.responsable || '',
      observaciones: l.observaciones || ''
    }
  } else {
    const cod = await proximoCodigo()
    form.value = { ...formVacio(), codigo: cod }
  }
  modal.value = true
}

function validar() {
  const e = {}
  if (!form.value.codigo.trim())   e.codigo    = 'Requerido'
  if (!form.value.etiqueta)        e.etiqueta  = 'Requerido'
  if (!form.value.fecha_fab)       e.fecha_fab = 'Requerido'
  err.value = e
  return Object.keys(e).length === 0
}

async function guardar() {
  if (!validar()) return
  guardando.value = true
  msgError.value = ''
  try {
    const url = editando.value
      ? `${API_BASE}/almacen/lotes-fabricacion/${form.value.codigo}`
      : `${API_BASE}/almacen/lotes-fabricacion`
    const r = await fetch(url, {
      method: editando.value ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    if (editando.value) {
      const idx = lotes.value.findIndex(x => x.codigo === form.value.codigo)
      if (idx >= 0) lotes.value[idx] = j.data
    } else {
      lotes.value.unshift(j.data)
    }
    modal.value = false
  } catch (e) {
    msgError.value = e.message
  } finally { guardando.value = false }
}

async function eliminar(l) {
  eliminando.value = l.codigo
  try {
    const r = await fetch(`${API_BASE}/almacen/lotes-fabricacion/${l.codigo}`, { method: 'DELETE' })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    lotes.value = lotes.value.filter(x => x.codigo !== l.codigo)
  } catch (e) {
    alert(e.message)
  } finally { eliminando.value = null }
}

onMounted(cargar)
</script>

<style scoped>
.pg-container { padding: 24px; max-width: 1200px; margin: 0 auto; }

.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface),.45); }
.bc-root { color: #047857; }
.bc-sep  { color: rgba(var(--v-theme-on-surface),.25) !important; }
.bc-current { color: rgba(var(--v-theme-on-surface),.7); }

.page-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
.header-left { display: flex; align-items: center; gap: 14px; }
.header-icon { width: 46px; height: 46px; border-radius: 12px; background: linear-gradient(135deg,#047857,#10b981); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
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
.data-row td { padding: 10px 14px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); color: rgb(var(--v-theme-on-surface)); vertical-align: middle; }
.data-row:last-child td { border-bottom: none; }
.data-row:hover td { background: rgba(var(--v-theme-on-surface),.02); }
.cod-badge { background: rgba(16,185,129,.12); color: #10b981; padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 700; font-family: monospace; letter-spacing: 1px; }
.fw500 { font-weight: 500; }
.sub-txt { font-size: 11px; color: rgba(var(--v-theme-on-surface),.45); margin-top: 2px; font-family: monospace; }
.chip-warn { background: rgba(245,158,11,.12); color: #d97706; padding: 2px 8px; border-radius: 5px; font-size: 12px; font-weight: 600; }
.empty-row { text-align: center !important; padding: 48px !important; color: rgba(var(--v-theme-on-surface),.35); }
.empty-row p { margin: 10px 0 0; font-size: 13px; }

.modal-card { border-radius: 14px !important; overflow: hidden; }
.modal-header { display: flex; align-items: center; padding: 16px 20px; background: rgba(var(--v-theme-on-surface),.03); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); font-weight: 700; font-size: 15px; }
.modal-body { padding: 20px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid rgba(var(--v-theme-on-surface),.07); }

.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field-group { margin-bottom: 14px; }
.field-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.5); margin-bottom: 6px; }
.field-input { width: 100%; padding: 9px 12px; border: 1px solid rgba(var(--v-theme-on-surface),.15); border-radius: 8px; font-size: 13px; background: rgba(var(--v-theme-on-surface),.03); color: rgb(var(--v-theme-on-surface)); outline: none; transition: border-color .2s; box-sizing: border-box; }
.field-input:focus { border-color: #10b981; }
.field-input.field-error { border-color: #ef4444; }
.field-input:disabled { opacity: .55; cursor: not-allowed; }
.field-select { appearance: auto; cursor: pointer; }
.field-textarea { resize: vertical; min-height: 60px; font-family: inherit; }
.cod-input { text-align: center; font-weight: 700; font-family: monospace; letter-spacing: 2px; font-size: 15px; }
.cod-wrap { position: relative; }
.cod-hint { font-size: 11px; color: rgba(var(--v-theme-on-surface),.4); margin-top: 3px; display: block; }
.error-txt { font-size: 11px; color: #ef4444; margin-top: 3px; display: block; }
.hint-txt { font-size: 11px; color: #10b981; margin-top: 3px; display: block; font-weight: 600; }
.api-error { background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.2); border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #ef4444; margin-top: 8px; }
</style>
