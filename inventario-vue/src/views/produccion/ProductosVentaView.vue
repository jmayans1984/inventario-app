<template>
  <MainLayout>
    <div class="pg-container">

      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">PROVEEDURÍA</span>
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
            <p class="page-sub">Catálogo de precios de costo y venta — productos.para_venta = 'SI'</p>
          </div>
        </div>
        <v-btn color="#8b5cf6" variant="flat" prepend-icon="mdi-cog-outline" @click="abrirMargenes">
          Márgenes de Venta
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
          <div class="kpi-icon" style="background:rgba(245,158,11,.13)">
            <v-icon size="20" color="#f59e0b">mdi-alert-outline</v-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-val">{{ sinCosto }}</span>
            <span class="kpi-lbl">Sin Precio de Costo</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(139,92,246,.13)">
            <v-icon size="20" color="#8b5cf6" >mdi-percent-outline</v-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-val">{{ margenesTxt }}</span>
            <span class="kpi-lbl">Márgenes 1 / 2 / 3</span>
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
        <span class="count-badge">{{ filasFiltradas.length }} productos</span>
        <v-spacer />
        <v-btn
          color="#10b981"
          variant="tonal"
          size="small"
          prepend-icon="mdi-refresh"
          :loading="recalculando"
          @click="recalcularPrecios"
        >
          Recalcular Precios de Venta
        </v-btn>
      </div>

      <v-alert v-if="msgRecalculo" :type="msgRecalculo.tipo" variant="tonal" density="compact" class="mb-3" closable @click:close="msgRecalculo=null">
        {{ msgRecalculo.texto }}
      </v-alert>

      <!-- TABLA AGRUPADA (solo lectura) -->
      <div class="tabla-card">
        <div v-if="loading" class="loading-wrap">
          <v-progress-circular indeterminate color="#06b6d4" size="36" />
        </div>
        <table v-else class="crud-table">
          <thead>
            <tr>
              <th>CÓDIGO</th>
              <th>NOMBRE</th>
              <th>UND</th>
              <th class="col-num">P. COSTO</th>
              <th class="col-num">P. VENTA 1</th>
              <th class="col-num">P. VENTA 2</th>
              <th class="col-num">P. VENTA 3</th>
            </tr>
          </thead>
          <tbody v-if="filasFiltradas.length === 0">
            <tr>
              <td colspan="7" class="empty-row">
                <v-icon size="40" color="rgba(var(--v-theme-on-surface),.15)">mdi-package-variant-closed</v-icon>
                <p>No hay productos marcados como "para venta" (productos.para_venta = 'SI')</p>
              </td>
            </tr>
          </tbody>
          <template v-for="([grupoNombre, items]) in gruposConProductos" :key="grupoNombre">
            <tbody>
              <!-- Fila cabecera de grupo -->
              <tr class="group-header-row">
                <td colspan="7">
                  <v-icon size="14" color="#06b6d4" class="mr-1">mdi-folder-outline</v-icon>
                  <span>{{ grupoNombre }}</span>
                  <span class="group-count">{{ items.length }} producto{{ items.length !== 1 ? 's' : '' }}</span>
                </td>
              </tr>
              <!-- Filas de productos del grupo -->
              <tr v-for="p in items" :key="p.codigo" class="data-row" :class="{ 'row-warn': !p.precio_costo }">
                <td><span class="cod-badge">{{ p.codigo }}</span></td>
                <td class="nombre-cell">{{ p.nombre }}</td>
                <td class="dim-cell">{{ p.und }}</td>
                <td class="col-num">{{ fmt(p.precio_costo) }}</td>
                <td class="col-num dim-cell">{{ fmt(p.precio_venta1) }}</td>
                <td class="col-num dim-cell">{{ fmt(p.precio_venta2) }}</td>
                <td class="col-num dim-cell">{{ fmt(p.precio_venta3) }}</td>
              </tr>
            </tbody>
          </template>
        </table>
      </div>

      <!-- MODAL MÁRGENES DE VENTA -->
      <v-dialog v-model="modalMargenes" max-width="440" persistent>
        <v-card class="modal-card">
          <div class="modal-header">
            <v-icon color="#8b5cf6" class="mr-2">mdi-percent-outline</v-icon>
            <span>Márgenes de Venta</span>
            <v-spacer />
            <v-btn icon="mdi-close" size="small" variant="text" @click="modalMargenes = false" />
          </div>
          <div class="modal-body">
            <p class="margenes-hint">
              Porcentaje de margen sobre el precio de costo para cada nivel de precio de venta.
              Ej: 30 significa que precio_venta = precio_costo / (1 − 0.30).
            </p>
            <div class="form-row three">
              <div class="field-group">
                <label class="field-label">Margen Venta 1 (%)</label>
                <input v-model.number="formMargenes.margen_venta1" type="number" min="0" max="99" step="0.01" class="field-input" />
              </div>
              <div class="field-group">
                <label class="field-label">Margen Venta 2 (%)</label>
                <input v-model.number="formMargenes.margen_venta2" type="number" min="0" max="99" step="0.01" class="field-input" />
              </div>
              <div class="field-group">
                <label class="field-label">Margen Venta 3 (%)</label>
                <input v-model.number="formMargenes.margen_venta3" type="number" min="0" max="99" step="0.01" class="field-input" />
              </div>
            </div>
            <div v-if="msgErrorMargenes" class="api-error">{{ msgErrorMargenes }}</div>
          </div>
          <div class="modal-footer">
            <v-btn variant="text" @click="modalMargenes = false">Cancelar</v-btn>
            <v-btn color="#8b5cf6" variant="flat" :loading="guardandoMargenes" @click="guardarMargenes">
              Guardar Márgenes
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

const productos    = ref([])
const grupos       = ref([])
const busqueda     = ref('')
const filtroGrupo  = ref('')
const loading      = ref(false)
const recalculando = ref(false)
const msgRecalculo = ref(null)

const margenes = ref({ margen_venta1: 0, margen_venta2: 0, margen_venta3: 0 })
const modalMargenes     = ref(false)
const guardandoMargenes = ref(false)
const msgErrorMargenes  = ref('')
const formMargenes = ref({ margen_venta1: 0, margen_venta2: 0, margen_venta3: 0 })

const sinCosto = computed(() => productos.value.filter(p => !parseFloat(p.precio_costo)).length)

const margenesTxt = computed(() => {
  const pct = (v) => `${(parseFloat(v) * 100).toFixed(0)}%`
  return `${pct(margenes.value.margen_venta1)} / ${pct(margenes.value.margen_venta2)} / ${pct(margenes.value.margen_venta3)}`
})

const filasFiltradas = computed(() => {
  const q = busqueda.value.toLowerCase()
  return productos.value.filter(p => {
    const matchQ = !q || p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q)
    const matchG = !filtroGrupo.value || p.grupo === filtroGrupo.value
    return matchQ && matchG
  })
})

// Agrupa filasFiltradas por nombre de grupo, ordenado alfabéticamente
const gruposConProductos = computed(() => {
  const map = {}
  filasFiltradas.value.forEach(p => {
    const key = p.grupo_nombre || (p.grupo ? p.grupo : 'SIN GRUPO')
    if (!map[key]) map[key] = []
    map[key].push(p)
  })
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b, 'es'))
})

function fmt(n) {
  return (parseFloat(n) || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function cargar() {
  loading.value = true
  try {
    const [rp, rg] = await Promise.all([
      api.get('/produccion/productos-venta'),
      api.get('/almacen/grupo-productos')
    ])
    productos.value = rp.data?.data || []
    grupos.value    = rg.data?.data || []
  } catch (e) { console.error(e) } finally { loading.value = false }
}

async function cargarMargenes() {
  try {
    const r = await api.get('/produccion/margenes-venta')
    if (r.data?.data) margenes.value = r.data.data
  } catch (e) { console.error(e) }
}

function abrirMargenes() {
  msgErrorMargenes.value = ''
  formMargenes.value = {
    margen_venta1: Math.round((parseFloat(margenes.value.margen_venta1) || 0) * 10000) / 100,
    margen_venta2: Math.round((parseFloat(margenes.value.margen_venta2) || 0) * 10000) / 100,
    margen_venta3: Math.round((parseFloat(margenes.value.margen_venta3) || 0) * 10000) / 100,
  }
  modalMargenes.value = true
}

async function guardarMargenes() {
  guardandoMargenes.value = true
  msgErrorMargenes.value = ''
  try {
    await api.put('/produccion/margenes-venta', {
      margen_venta1: (parseFloat(formMargenes.value.margen_venta1) || 0) / 100,
      margen_venta2: (parseFloat(formMargenes.value.margen_venta2) || 0) / 100,
      margen_venta3: (parseFloat(formMargenes.value.margen_venta3) || 0) / 100,
    })
    await cargarMargenes()
    modalMargenes.value = false
  } catch (e) {
    msgErrorMargenes.value = e?.response?.data?.error || e.message
  } finally { guardandoMargenes.value = false }
}

async function recalcularPrecios() {
  recalculando.value = true
  msgRecalculo.value  = null
  try {
    const r = await api.post('/produccion/productos-venta/recalcular-precios')
    if (!r.data?.success) throw new Error(r.data?.error || 'No se pudo recalcular')
    msgRecalculo.value = { tipo: 'success', texto: `Precios recalculados en ${r.data.actualizados} producto(s)` }
    await cargar()
  } catch (e) {
    msgRecalculo.value = { tipo: 'error', texto: e?.response?.data?.error || e.message }
  } finally { recalculando.value = false }
}

onMounted(async () => {
  await cargarMargenes()
  await cargar()
})
</script>

<style scoped>
.pg-container { padding: 24px; max-width: 1200px; margin: 0 auto; }

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

/* Fila cabecera de grupo */
.group-header-row td { padding: 8px 12px 6px; background: rgba(6,182,212,.05); border-top: 1px solid rgba(6,182,212,.12); border-bottom: 1px solid rgba(6,182,212,.08); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #06b6d4; }
.group-count { margin-left: 8px; font-weight: 500; color: rgba(var(--v-theme-on-surface),.4); font-size: 10px; text-transform: none; letter-spacing: 0; }

.col-num { text-align: right !important; font-family: 'Courier New', monospace; }
.data-row td { padding: 9px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); color: rgb(var(--v-theme-on-surface)); white-space: nowrap; }
.data-row:last-child td { border-bottom: none; }
.data-row:hover td { background: rgba(var(--v-theme-on-surface),.02); }
.row-warn td:nth-child(4) { color: #f59e0b; font-weight: 700; }
.cod-badge { background: rgba(6,182,212,.12); color: #06b6d4; padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 700; font-family: monospace; }
.nombre-cell { font-weight: 500; }
.dim-cell { color: rgba(var(--v-theme-on-surface),.55); font-size: 12px; }
.empty-row { text-align: center !important; padding: 48px !important; color: rgba(var(--v-theme-on-surface),.35); }
.empty-row p { margin: 10px 0 0; font-size: 13px; }

/* Modal */
.modal-card { border-radius: 14px !important; overflow: hidden; }
.modal-header { display: flex; align-items: center; padding: 16px 20px; background: rgba(var(--v-theme-on-surface),.03); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); font-weight: 700; font-size: 15px; }
.modal-body { padding: 20px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid rgba(var(--v-theme-on-surface),.07); }
.margenes-hint { font-size: 12px; color: rgba(var(--v-theme-on-surface),.55); margin: 0 0 16px; line-height: 1.5; }
.form-row { display: flex; gap: 12px; }
.form-row.three > * { flex: 1; }
.field-group { margin-bottom: 14px; }
.field-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.5); margin-bottom: 5px; }
.field-input { width: 100%; padding: 9px 12px; border: 1px solid rgba(var(--v-theme-on-surface),.15); border-radius: 8px; font-size: 13px; background: rgba(var(--v-theme-on-surface),.03); color: rgb(var(--v-theme-on-surface)); outline: none; transition: border-color .2s; box-sizing: border-box; }
.field-input:focus { border-color: #8b5cf6; }
.api-error { background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.2); border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #ef4444; margin-top: 8px; }
</style>
