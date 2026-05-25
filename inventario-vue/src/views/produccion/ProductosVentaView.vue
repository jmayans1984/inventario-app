<template>
  <MainLayout>
    <div class="pg-container">

      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">PRODUCCIÓN</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Configuración</span>
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Productos para Venta</span>
      </div>

      <!-- HEADER -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <v-icon size="24" color="white">mdi-package-variant</v-icon>
          </div>
          <div>
            <h1 class="page-title">PRODUCTOS PARA VENTA</h1>
            <p class="page-sub">Catálogo de productos disponibles para ofrecer a los clientes</p>
          </div>
        </div>
        <v-btn color="#06b6d4" variant="flat" prepend-icon="mdi-plus" @click="abrirModal()">
          Nuevo Producto
        </v-btn>
      </div>

      <!-- KPIs -->
      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(6,182,212,.13)">
            <v-icon size="20" color="#06b6d4">mdi-package-variant-closed</v-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-val">{{ productos.length }}</span>
            <span class="kpi-lbl">Total Productos</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(16,185,129,.13)">
            <v-icon size="20" color="#10b981">mdi-check-circle-outline</v-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-val">{{ activos }}</span>
            <span class="kpi-lbl">Activos</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(245,158,11,.13)">
            <v-icon size="20" color="#f59e0b">mdi-folder-multiple-outline</v-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-val">{{ grupos.length }}</span>
            <span class="kpi-lbl">Grupos</span>
          </div>
        </div>
      </div>

      <!-- TOOLBAR -->
      <div class="toolbar">
        <div class="search-wrap">
          <v-icon size="17" color="rgba(var(--v-theme-on-surface),.4)">mdi-magnify</v-icon>
          <input v-model="busqueda" type="text" placeholder="Buscar producto..." class="search-input" />
        </div>
        <select v-model="filtroGrupo" class="fil-select">
          <option value="">Todos los grupos</option>
          <option v-for="g in grupos" :key="g.codigo" :value="g.codigo">{{ g.nombre }}</option>
        </select>
        <select v-model="filtroControl" class="fil-select">
          <option value="">Todos</option>
          <option value="SI">Activos</option>
          <option value="NO">Inactivos</option>
        </select>
        <span class="count-badge">{{ filasFiltradas.length }} productos</span>
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
              <th>GRUPO</th>
              <th>UND</th>
              <th class="col-num">P. VENTA 1</th>
              <th class="col-num">P. VENTA 2</th>
              <th class="col-num">P. VENTA 3</th>
              <th>ESTADO</th>
              <th class="col-acc">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filasFiltradas.length === 0">
              <td colspan="9" class="empty-row">
                <v-icon size="40" color="rgba(var(--v-theme-on-surface),.15)">mdi-package-variant-closed</v-icon>
                <p>No hay productos registrados</p>
              </td>
            </tr>
            <tr v-for="p in filasFiltradas" :key="p.codigo" class="data-row">
              <td><span class="cod-badge">{{ p.codigo }}</span></td>
              <td class="nombre-cell">{{ p.nombre }}</td>
              <td class="dim-cell">{{ p.grupo_nombre || p.grupo || '—' }}</td>
              <td class="dim-cell">{{ p.unidad }}</td>
              <td class="col-num">{{ fmt(p.precio_venta1) }}</td>
              <td class="col-num dim-cell">{{ fmt(p.precio_venta2) }}</td>
              <td class="col-num dim-cell">{{ fmt(p.precio_venta3) }}</td>
              <td>
                <span class="estado-chip" :class="p.control === 'SI' ? 'activo' : 'inactivo'">
                  {{ p.control === 'SI' ? 'ACTIVO' : 'INACTIVO' }}
                </span>
              </td>
              <td class="col-acc">
                <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" color="primary" @click="abrirModal(p)" />
                <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" @click="confirmarEliminar(p)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MODAL CREAR / EDITAR -->
      <v-dialog v-model="modal" max-width="600" persistent>
        <v-card class="modal-card">
          <div class="modal-header">
            <v-icon color="#06b6d4" class="mr-2">mdi-package-variant</v-icon>
            <span>{{ editando ? 'Editar Producto' : 'Nuevo Producto' }}</span>
            <v-spacer />
            <v-btn icon="mdi-close" size="small" variant="text" @click="modal = false" />
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="field-group half">
                <label class="field-label">Código *</label>
                <input v-model="form.codigo" :disabled="editando" type="text" maxlength="15"
                  placeholder="Ej: PROD001" class="field-input" :class="{'field-error':errores.codigo}"
                  @input="form.codigo = form.codigo.toUpperCase()" />
                <span v-if="errores.codigo" class="error-txt">{{ errores.codigo }}</span>
              </div>
              <div class="field-group half">
                <label class="field-label">Unidad</label>
                <input v-model="form.unidad" type="text" maxlength="10" placeholder="UND, KG, LT..." class="field-input" />
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">Nombre *</label>
              <input v-model="form.nombre" type="text" maxlength="100" placeholder="Nombre del producto" class="field-input" :class="{'field-error':errores.nombre}" />
              <span v-if="errores.nombre" class="error-txt">{{ errores.nombre }}</span>
            </div>
            <div class="form-row">
              <div class="field-group half">
                <label class="field-label">Grupo</label>
                <select v-model="form.grupo" class="field-input">
                  <option value="">Sin grupo</option>
                  <option v-for="g in grupos" :key="g.codigo" :value="g.codigo">{{ g.nombre }}</option>
                </select>
              </div>
              <div class="field-group half">
                <label class="field-label">Estado</label>
                <select v-model="form.control" class="field-input">
                  <option value="SI">Activo</option>
                  <option value="NO">Inactivo</option>
                </select>
              </div>
            </div>
            <div class="section-title">Precios de Venta</div>
            <div class="form-row three">
              <div class="field-group">
                <label class="field-label">Lista 1 *</label>
                <input v-model="form.precio_venta1" type="number" min="0" step="0.01" placeholder="0.00" class="field-input" />
              </div>
              <div class="field-group">
                <label class="field-label">Lista 2</label>
                <input v-model="form.precio_venta2" type="number" min="0" step="0.01" placeholder="0.00" class="field-input" />
              </div>
              <div class="field-group">
                <label class="field-label">Lista 3</label>
                <input v-model="form.precio_venta3" type="number" min="0" step="0.01" placeholder="0.00" class="field-input" />
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">Precio de Costo</label>
              <input v-model="form.precio_costo" type="number" min="0" step="0.01" placeholder="0.00" class="field-input" style="max-width:180px" />
            </div>
            <div v-if="msgError" class="api-error">{{ msgError }}</div>
          </div>
          <div class="modal-footer">
            <v-btn variant="text" @click="modal = false">Cancelar</v-btn>
            <v-btn color="#06b6d4" variant="flat" :loading="guardando" @click="guardar">
              {{ editando ? 'Guardar Cambios' : 'Crear Producto' }}
            </v-btn>
          </div>
        </v-card>
      </v-dialog>

      <!-- CONFIRM ELIMINAR -->
      <v-dialog v-model="confirmModal" max-width="360">
        <v-card class="modal-card">
          <div class="modal-header">
            <v-icon color="#ef4444" class="mr-2">mdi-alert-circle-outline</v-icon>
            <span>Eliminar Producto</span>
          </div>
          <div class="modal-body">
            <p>¿Eliminar el producto <strong>{{ eliminando?.nombre }}</strong>? Esta acción no se puede deshacer.</p>
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

const productos    = ref([])
const grupos       = ref([])
const busqueda     = ref('')
const filtroGrupo  = ref('')
const filtroControl = ref('')
const loading      = ref(false)
const guardando    = ref(false)
const modal        = ref(false)
const confirmModal = ref(false)
const editando     = ref(false)
const eliminando   = ref(null)
const msgError     = ref('')
const errores      = ref({})
const form = ref({
  codigo: '', nombre: '', unidad: 'UND', grupo: '',
  precio_costo: 0, precio_venta1: 0, precio_venta2: 0, precio_venta3: 0, control: 'SI'
})

const activos = computed(() => productos.value.filter(p => p.control === 'SI').length)

const filasFiltradas = computed(() => {
  const q = busqueda.value.toLowerCase()
  return productos.value.filter(p => {
    const matchQ = !q || p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q)
    const matchG = !filtroGrupo.value || p.grupo === filtroGrupo.value
    const matchC = !filtroControl.value || p.control === filtroControl.value
    return matchQ && matchG && matchC
  })
})

function fmt(n) {
  return (parseFloat(n) || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function cargar() {
  const emp = getEmpresa()
  if (!emp) return
  loading.value = true
  try {
    const [rp, rg] = await Promise.all([
      api.get('/produccion/productos-venta', { params: { empresa: emp } }),
      api.get('/produccion/grupo-productos', { params: { empresa: emp } })
    ])
    productos.value = rp.data?.data || []
    grupos.value    = rg.data?.data || []
  } catch (e) { console.error(e) } finally { loading.value = false }
}

function abrirModal(p = null) {
  errores.value = {}
  msgError.value = ''
  editando.value = !!p
  form.value = p
    ? { codigo: p.codigo, nombre: p.nombre, unidad: p.unidad, grupo: p.grupo || '',
        precio_costo: p.precio_costo, precio_venta1: p.precio_venta1,
        precio_venta2: p.precio_venta2, precio_venta3: p.precio_venta3, control: p.control }
    : { codigo: '', nombre: '', unidad: 'UND', grupo: '',
        precio_costo: 0, precio_venta1: 0, precio_venta2: 0, precio_venta3: 0, control: 'SI' }
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
      await api.put(`/produccion/productos-venta/${form.value.codigo}`, { ...form.value, empresa: emp })
      await cargar()
    } else {
      await api.post('/produccion/productos-venta', { ...form.value, empresa: emp })
      await cargar()
    }
    modal.value = false
  } catch (e) {
    msgError.value = e?.response?.data?.error || e.message
  } finally { guardando.value = false }
}

function confirmarEliminar(p) { eliminando.value = p; confirmModal.value = true }

async function eliminar() {
  guardando.value = true
  try {
    await api.delete(`/produccion/productos-venta/${eliminando.value.codigo}`, {
      params: { empresa: getEmpresa() }
    })
    productos.value = productos.value.filter(p => p.codigo !== eliminando.value.codigo)
    confirmModal.value = false
  } catch (e) { console.error(e) } finally { guardando.value = false }
}

onMounted(cargar)
</script>

<style scoped>
.pg-container { padding: 24px; max-width: 1300px; margin: 0 auto; }

.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface),.45); }
.bc-root { color: #06b6d4; }
.bc-sep  { color: rgba(var(--v-theme-on-surface),.25) !important; }
.bc-current { color: rgba(var(--v-theme-on-surface),.7); }

.page-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
.header-left { display: flex; align-items: center; gap: 14px; }
.header-icon { width: 46px; height: 46px; border-radius: 12px; background: linear-gradient(135deg,#06b6d4,#0891b2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.page-title { font-size: 17px; font-weight: 800; letter-spacing: .5px; margin: 0; color: rgb(var(--v-theme-on-surface)); }
.page-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }

.kpi-row { display: flex; gap: 12px; margin-bottom: 20px; }
.kpi-card { flex: 1; min-width: 140px; background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 10px; padding: 14px 16px; display: flex; align-items: center; gap: 12px; }
.kpi-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.kpi-info { display: flex; flex-direction: column; gap: 2px; }
.kpi-val  { font-size: 18px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); }
.kpi-lbl  { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.45); }

.toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.search-wrap { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 200px; padding: 8px 12px; background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.1); border-radius: 8px; }
.search-input { flex: 1; border: none; background: transparent; outline: none; font-size: 13px; color: rgb(var(--v-theme-on-surface)); }
.search-input::placeholder { color: rgba(var(--v-theme-on-surface),.35); }
.fil-select { padding: 8px 10px; border: 1px solid rgba(var(--v-theme-on-surface),.12); border-radius: 8px; font-size: 13px; background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface)); outline: none; }
.count-badge { font-size: 12px; font-weight: 600; color: rgba(var(--v-theme-on-surface),.45); white-space: nowrap; }

.tabla-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 12px; overflow-x: auto; }
.loading-wrap { display: flex; justify-content: center; padding: 40px; }
.crud-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.crud-table thead th { padding: 10px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.45); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); text-align: left; white-space: nowrap; }
.col-num { text-align: right !important; }
.col-acc { width: 80px; text-align: center !important; }
.data-row td { padding: 9px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); color: rgb(var(--v-theme-on-surface)); white-space: nowrap; }
.data-row:last-child td { border-bottom: none; }
.data-row:hover td { background: rgba(var(--v-theme-on-surface),.02); }
.cod-badge { background: rgba(6,182,212,.12); color: #06b6d4; padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 700; font-family: monospace; }
.nombre-cell { font-weight: 500; }
.dim-cell { color: rgba(var(--v-theme-on-surface),.55); font-size: 12px; }
.col-num { font-family: 'Courier New', monospace; }
.estado-chip { padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: .4px; }
.activo   { background: rgba(16,185,129,.12); color: #10b981; }
.inactivo { background: rgba(var(--v-theme-on-surface),.07); color: rgba(var(--v-theme-on-surface),.45); }
.empty-row { text-align: center !important; padding: 48px !important; color: rgba(var(--v-theme-on-surface),.35); }
.empty-row p { margin: 10px 0 0; font-size: 13px; }

/* Modal */
.modal-card { border-radius: 14px !important; overflow: hidden; }
.modal-header { display: flex; align-items: center; padding: 16px 20px; background: rgba(var(--v-theme-on-surface),.03); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); font-weight: 700; font-size: 15px; }
.modal-body { padding: 20px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid rgba(var(--v-theme-on-surface),.07); }
.section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #06b6d4; margin: 16px 0 10px; padding-bottom: 6px; border-bottom: 1px solid rgba(6,182,212,.2); }
.form-row { display: flex; gap: 12px; }
.form-row.three > * { flex: 1; }
.field-group { margin-bottom: 14px; }
.field-group.half { flex: 1; }
.field-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.5); margin-bottom: 5px; }
.field-input { width: 100%; padding: 9px 12px; border: 1px solid rgba(var(--v-theme-on-surface),.15); border-radius: 8px; font-size: 13px; background: rgba(var(--v-theme-on-surface),.03); color: rgb(var(--v-theme-on-surface)); outline: none; transition: border-color .2s; box-sizing: border-box; }
.field-input:focus { border-color: #06b6d4; }
.field-input.field-error { border-color: #ef4444; }
.field-input:disabled { opacity: .55; cursor: not-allowed; }
.error-txt { font-size: 11px; color: #ef4444; margin-top: 3px; display: block; }
.api-error { background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.2); border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #ef4444; margin-top: 8px; }
</style>
