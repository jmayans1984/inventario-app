<template>
  <MainLayout>
    <div class="pg-container">

      <PageHeader
        title="Ubicación de Productos en Bodega"
        description="Asigna la posición física de cada producto en el almacén para agilizar el packing"
        :crumbs="['Almacén', 'Configuración', 'Ubicación de Productos']"
      />

      <div class="toolbar">
        <div class="search-wrap">
          <v-icon size="17" color="rgba(var(--v-theme-on-surface),.4)">mdi-magnify</v-icon>
          <input v-model="busqueda" type="text" placeholder="Buscar producto..." class="search-input" />
        </div>
        <span class="count-badge">{{ totalFiltrados }} productos</span>
      </div>

      <div v-if="loading" class="loading-wrap">
        <v-progress-circular indeterminate color="success" size="36" />
      </div>

      <template v-else>
        <div v-for="grupo in gruposFiltrados" :key="grupo.key" class="grupo-block">
          <div class="grupo-header">
            <v-icon size="15" color="success" class="mr-1">mdi-folder-outline</v-icon>
            {{ grupo.nombre }}
            <span class="grupo-cnt">{{ grupo.items.length }}</span>
          </div>
          <div class="tabla-card">
            <table class="crud-table">
              <thead>
                <tr>
                  <th style="width:120px">CÓDIGO</th>
                  <th>PRODUCTO</th>
                  <th style="width:260px">UBICACIÓN EN BODEGA</th>
                  <th style="width:70px" class="col-center">EST.</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in grupo.items" :key="item.codigo" class="data-row">
                  <td><span class="cod-badge">{{ item.codigo }}</span></td>
                  <td class="fw500">{{ item.nombre }}</td>
                  <td>
                    <input
                      v-model="item.ubicacion_draft"
                      type="text"
                      maxlength="80"
                      placeholder="Ej: Pasillo A - Estante 3"
                      class="ub-input"
                      :data-cod="item.codigo"
                      @keydown.enter.prevent="navegarYGuardar(item, 1)"
                      @keydown.arrow-down.prevent="navegarYGuardar(item, 1)"
                      @keydown.arrow-up.prevent="navegarYGuardar(item, -1)"
                      @blur="guardar(item)"
                    />
                  </td>
                  <td class="col-center">
                    <span v-if="guardando[item.codigo]" class="est-saving">
                      <v-progress-circular indeterminate size="14" width="2" color="success" />
                    </span>
                    <span v-else-if="guardado[item.codigo]" class="est-ok">✓</span>
                    <span v-else-if="error[item.codigo]" class="est-err" :title="error[item.codigo]">!</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="gruposFiltrados.length === 0" class="empty-state">
          <v-icon size="48" color="rgba(var(--v-theme-on-surface),.15)">mdi-map-marker-off-outline</v-icon>
          <p>No se encontraron productos</p>
        </div>
      </template>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import { useAuthStore } from '../../stores/auth.js'
import { API_BASE } from '../../utils/constants.js'

const auth    = useAuthStore()
const empresa = computed(() => auth.empresaCodigo)

const productos  = ref([])
const busqueda   = ref('')
const loading    = ref(false)
const guardando  = ref({})
const guardado   = ref({})
const error      = ref({})

async function cargar() {
  loading.value = true
  try {
    const r = await fetch(`${API_BASE}/almacen/productos?empresa=${empresa.value}`)
    const j = await r.json()
    productos.value = (j.data || [])
      .filter(p => p.control === 'SI')
      .map(p => ({ ...p, ubicacion_draft: p.ubicacion || '' }))
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const grupos = computed(() => {
  const map = {}
  productos.value.forEach(p => {
    const key  = `${p.grupo || ''}|${p.grupo_nombre || 'Sin grupo'}`
    if (!map[key]) map[key] = { key, nombre: p.grupo_nombre || 'Sin grupo', codigo: p.grupo || '', items: [] }
    map[key].items.push(p)
  })
  return Object.values(map).sort((a, b) => a.codigo.localeCompare(b.codigo))
})

const gruposFiltrados = computed(() => {
  const q = busqueda.value.toLowerCase().trim()
  if (!q) return grupos.value
  return grupos.value
    .map(g => ({ ...g, items: g.items.filter(p => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)) }))
    .filter(g => g.items.length > 0)
})

const totalFiltrados = computed(() => gruposFiltrados.value.reduce((s, g) => s + g.items.length, 0))

const productosFlat = computed(() => gruposFiltrados.value.flatMap(g => g.items))

function navegarYGuardar(item, delta) {
  guardar(item)
  const idx = productosFlat.value.findIndex(p => p.codigo === item.codigo)
  const siguiente = productosFlat.value[idx + delta]
  if (!siguiente) return
  const input = document.querySelector(`.ub-input[data-cod="${siguiente.codigo}"]`)
  if (input) { input.focus(); input.select() }
}

async function guardar(item) {
  const nueva = (item.ubicacion_draft || '').trim()
  const actual = (item.ubicacion || '').trim()
  if (nueva === actual) return

  guardando.value = { ...guardando.value, [item.codigo]: true }
  delete guardado.value[item.codigo]
  delete error.value[item.codigo]

  try {
    const r = await fetch(`${API_BASE}/almacen/productos/${item.codigo}/ubicacion`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ubicacion: nueva })
    })
    const j = await r.json()
    if (!j.success) throw new Error(j.error)
    item.ubicacion = nueva
    guardado.value = { ...guardado.value, [item.codigo]: true }
    setTimeout(() => { delete guardado.value[item.codigo] }, 2500)
  } catch (e) {
    error.value = { ...error.value, [item.codigo]: e.message }
    item.ubicacion_draft = actual
  } finally {
    guardando.value = { ...guardando.value, [item.codigo]: false }
    delete guardando.value[item.codigo]
  }
}

onMounted(cargar)
</script>

<style scoped>
.pg-container { padding: 24px; max-width: 1100px; margin: 0 auto; }

.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface),.45); }
.bc-root { color: var(--success); }
.bc-sep  { color: rgba(var(--v-theme-on-surface),.25) !important; }
.bc-current { color: rgba(var(--v-theme-on-surface),.7); }

.page-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
.header-left { display: flex; align-items: center; gap: 14px; }
.header-icon { width: 46px; height: 46px; border-radius: 12px; background: linear-gradient(135deg,var(--success),var(--success)); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.page-title { font-size: 17px; font-weight: 800; letter-spacing: .5px; margin: 0; color: rgb(var(--v-theme-on-surface)); }
.page-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }

.toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.search-wrap { display: flex; align-items: center; gap: 8px; flex: 1; padding: 8px 12px; background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.1); border-radius: 8px; }
.search-input { flex: 1; border: none; background: transparent; outline: none; font-size: 13px; color: rgb(var(--v-theme-on-surface)); }
.search-input::placeholder { color: rgba(var(--v-theme-on-surface),.35); }
.count-badge { font-size: 12px; font-weight: 600; color: rgba(var(--v-theme-on-surface),.45); white-space: nowrap; }

.loading-wrap { display: flex; justify-content: center; padding: 60px; }

.grupo-block { margin-bottom: 20px; }
.grupo-header { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: rgba(var(--v-theme-on-surface),.5); margin-bottom: 8px; padding: 0 2px; }
.grupo-cnt { background: rgba(var(--v-theme-on-surface),.08); color: rgba(var(--v-theme-on-surface),.5); padding: 1px 7px; border-radius: 10px; font-size: 10px; font-weight: 700; margin-left: 4px; }

.tabla-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 12px; overflow: hidden; }
.crud-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.crud-table thead th { padding: 10px 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface),.45); border-bottom: 1px solid rgba(var(--v-theme-on-surface),.08); text-align: left; }
.col-center { text-align: center !important; }
.data-row td { padding: 8px 14px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); color: rgb(var(--v-theme-on-surface)); vertical-align: middle; }
.data-row:last-child td { border-bottom: none; }
.data-row:hover td { background: rgba(var(--v-theme-on-surface),.02); }
.cod-badge { background: rgba(16,185,129,.12); color: var(--success); padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 700; font-family: monospace; }
.fw500 { font-weight: 500; }

.ub-input { width: 100%; padding: 7px 10px; border: 1px solid rgba(var(--v-theme-on-surface),.15); border-radius: 7px; font-size: 13px; background: rgba(var(--v-theme-on-surface),.03); color: rgb(var(--v-theme-on-surface)); outline: none; transition: border-color .2s; box-sizing: border-box; }
.ub-input:focus { border-color: var(--success); background: rgba(16,185,129,.04); }
.ub-input::placeholder { color: rgba(var(--v-theme-on-surface),.3); font-style: italic; }

.est-ok   { color: var(--success); font-size: 16px; font-weight: 700; }
.est-err  { color: var(--error); font-size: 16px; font-weight: 700; cursor: help; }
.est-saving { display: flex; justify-content: center; }

.empty-state { text-align: center; padding: 60px; color: rgba(var(--v-theme-on-surface),.35); }
.empty-state p { margin: 12px 0 0; font-size: 14px; }
</style>
