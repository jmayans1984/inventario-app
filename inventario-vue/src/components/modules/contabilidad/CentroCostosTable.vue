<template>
  <div class="cc-table-wrapper">
    <!-- TOOLBAR -->
    <div class="cc-toolbar">
      <div class="toolbar-left">
        <v-text-field
          v-model="busqueda"
          placeholder="Buscar por código o nombre..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          class="search-field"
          @update:model-value="handleBusqueda"
        />
      </div>
      <div class="toolbar-right">
        <v-btn
          v-if="store.tieneSeleccionados"
          icon="mdi-trash-can-outline"
          color="error"
          variant="text"
          size="small"
          @click="abrirConfirmacionBatch"
          title="Eliminar seleccionados"
        />
        <v-btn
          icon="mdi-refresh"
          color="primary"
          variant="text"
          size="small"
          @click="recargar"
          :loading="store.loading"
          title="Recargar"
        />
      </div>
    </div>

    <!-- TABLA -->
    <v-table
      v-if="store.centrosCostos.length > 0"
      density="comfortable"
      class="cc-data-table"
    >
      <thead>
        <tr class="table-header">
          <th
            v-for="col in columnas"
            :key="col.key"
            class="th"
            :class="{ sortable: col.sortable }"
            @click="col.sortable && handleSort(col.key)"
          >
            <span>{{ col.label }}</span>
            <v-icon v-if="col.sortable" size="14" class="sort-icon">
              {{
                store.filters.sortBy === col.key
                  ? store.filters.sortOrder === 'asc'
                    ? 'mdi-sort-ascending'
                    : 'mdi-sort-descending'
                  : 'mdi-sort'
              }}
            </v-icon>
          </th>
          <th class="th-acciones">ACCIONES</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="cc in store.centrosCostos" :key="cc.codigo" class="data-row">
          <!-- CÓDIGO -->
          <td class="td">
            <span class="codigo-badge">{{ cc.codigo }}</span>
          </td>

          <!-- NOMBRE -->
          <td class="td nombre-col">
            <div class="nombre-wrap">
              <v-icon size="16" class="cc-icon">mdi-sitemap-outline</v-icon>
              <span class="nombre-text">{{ cc.nombre }}</span>
            </div>
          </td>

          <!-- ESTADO -->
          <td class="td td-estado">
            <button
              class="estado-toggle"
              :class="esActivo(cc) ? 'estado-on' : 'estado-off'"
              :disabled="togglingCodigo === cc.codigo"
              :title="esActivo(cc) ? 'Clic para desactivar (se ocultará en los menús)' : 'Clic para activar'"
              @click="toggleActivo(cc)"
            >
              <v-icon size="13">{{ esActivo(cc) ? 'mdi-check-circle' : 'mdi-minus-circle-outline' }}</v-icon>
              {{ esActivo(cc) ? 'ACTIVO' : 'INACTIVO' }}
            </button>
          </td>

          <!-- ACCIONES -->
          <td class="td-acciones">
            <div class="action-buttons">
              <v-btn
                icon="mdi-pencil-outline"
                size="x-small"
                variant="text"
                color="primary"
                @click="handleEditar(cc)"
                title="Editar"
              />
              <v-btn
                icon="mdi-trash-can-outline"
                size="x-small"
                variant="text"
                color="error"
                @click="abrirConfirmacion(cc.codigo, cc.nombre)"
                title="Eliminar"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- ESTADO VACÍO -->
    <div v-else-if="!store.loading" class="empty-state">
      <v-icon size="64" color="rgba(var(--v-theme-on-surface), 0.2)">mdi-sitemap</v-icon>
      <p class="empty-title">{{ busqueda ? 'Sin resultados' : 'Sin centros de costos' }}</p>
      <p class="empty-sub">
        {{ busqueda ? 'Intenta con otro término de búsqueda' : 'Crea tu primer centro de costos' }}
      </p>
    </div>

    <!-- LOADING -->
    <div v-if="store.loading" class="loading-state">
      <v-progress-circular indeterminate color="primary" size="36" />
      <p class="loading-text">Cargando centros de costos...</p>
    </div>

    <!-- PAGINACIÓN -->
    <div v-if="store.paginasTotales > 1" class="pagination-wrapper">
      <v-pagination
        v-model="store.filters.page"
        :length="store.paginasTotales"
        @update:model-value="recargar"
      />
      <div class="page-info">
        {{ store.centrosCostos.length }} de {{ store.totalCentrosCostos }}
      </div>
    </div>

    <!-- DIALOG: ELIMINAR UNO -->
    <v-dialog v-model="dialogConfirmacion" max-width="400">
      <v-card>
        <v-card-text class="pa-6">
          <div class="confirm-icon"><v-icon size="48" color="error">mdi-alert-circle-outline</v-icon></div>
          <p class="confirm-title">¿Eliminar centro de costos?</p>
          <p class="confirm-message">Se eliminará permanentemente <strong>{{ nombreAEliminar }}</strong></p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogConfirmacion = false">Cancelar</v-btn>
          <v-btn color="error" variant="elevated" :loading="store.loading" @click="handleEliminar">
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIALOG: ELIMINAR MÚLTIPLES -->
    <v-dialog v-model="dialogBatch" max-width="400">
      <v-card>
        <v-card-text class="pa-6">
          <div class="confirm-icon"><v-icon size="48" color="error">mdi-alert-circle-outline</v-icon></div>
          <p class="confirm-title">¿Eliminar {{ selectedIds.length }} centro(s) de costos?</p>
          <p class="confirm-message">Esta acción no se puede deshacer.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogBatch = false">Cancelar</v-btn>
          <v-btn color="error" variant="elevated" :loading="store.loading" @click="handleEliminarMultiples">
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCentroCostosStore } from '../../../stores/centrocostos'

const store = useCentroCostosStore()
const emit = defineEmits(['editar'])

const busqueda = ref('')
const selectedIds = ref([])
const dialogConfirmacion = ref(false)
const dialogBatch = ref(false)
const codigoAEliminar = ref(null)
const nombreAEliminar = ref('')

const columnas = [
  { key: 'codigo', label: 'CÓDIGO', sortable: true },
  { key: 'nombre', label: 'NOMBRE', sortable: true },
  { key: 'activo', label: 'ESTADO', sortable: false },
]

const togglingCodigo = ref(null)

function esActivo(cc) {
  return (cc.activo || 'SI') !== 'NO'
}

async function toggleActivo(cc) {
  togglingCodigo.value = cc.codigo
  try {
    await store.actualizarCentroCostos(cc.codigo, {
      nombre: cc.nombre,
      empresa: cc.empresa,
      square_location_id: cc.square_location_id || '',
      activo: esActivo(cc) ? 'NO' : 'SI',
    })
  } catch (err) {
    console.error('Error cambiando estado del centro de costo:', err)
  } finally {
    togglingCodigo.value = null
  }
}

const todosSeleccionados = computed(
  () => selectedIds.value.length > 0 && selectedIds.value.length === store.centrosCostos.length
)
const algunoSeleccionados = computed(
  () => selectedIds.value.length > 0 && selectedIds.value.length < store.centrosCostos.length
)

async function handleBusqueda(query) {
  store.filters.search = query
  store.filters.page = 1
  if (query.length >= 2 || query.length === 0) {
    if (query) await store.buscar(query)
    else await store.fetchCentrosCostos()
  }
}

function handleSort(key) {
  if (store.filters.sortBy === key) {
    store.filters.sortOrder = store.filters.sortOrder === 'asc' ? 'desc' : 'asc'
  } else {
    store.filters.sortBy = key
    store.filters.sortOrder = 'asc'
  }
  store.fetchCentrosCostos()
}

function handleEditar(cc) {
  emit('editar', cc)
}

function abrirConfirmacion(codigo, nombre) {
  codigoAEliminar.value = codigo
  nombreAEliminar.value = nombre
  dialogConfirmacion.value = true
}

function abrirConfirmacionBatch() {
  dialogBatch.value = true
}

async function handleEliminar() {
  if (!codigoAEliminar.value) return
  try {
    await store.eliminarCentroCostos(codigoAEliminar.value)
    dialogConfirmacion.value = false
    codigoAEliminar.value = null
    nombreAEliminar.value = ''
  } catch (err) {
    console.error('Error eliminando:', err)
  }
}

async function handleEliminarMultiples() {
  try {
    await store.eliminarMultiples(selectedIds.value)
    dialogBatch.value = false
    selectedIds.value = []
  } catch (err) {
    console.error('Error eliminando múltiples:', err)
  }
}

async function recargar() {
  await store.fetchCentrosCostos()
}

function toggleTodos(val) {
  selectedIds.value = val ? store.centrosCostos.map(c => c.codigo) : []
}

function toggleSeleccion(id, val) {
  if (val) selectedIds.value.push(id)
  else selectedIds.value = selectedIds.value.filter(sid => sid !== id)
}
</script>

<style scoped>
.cc-table-wrapper {
  background: rgb(var(--v-theme-surface));
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  animation: containerFadeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes containerFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Toolbar */
.cc-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-bottom: 1.5px solid rgba(var(--v-theme-on-surface), 0.08);
  flex-wrap: wrap;
}

.toolbar-left { flex: 1; min-width: 250px; }
.toolbar-right { display: flex; gap: 8px; }
.search-field { width: 100%; }

/* Tabla */
.cc-data-table { background: transparent !important; width: 100%; }

.table-header {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(99, 102, 241, 0.02) 100%) !important;
  border-bottom: 1.5px solid rgba(var(--v-theme-on-surface), 0.1) !important;
}

.th {
  font-size: 10px !important;
  font-weight: 800 !important;
  letter-spacing: 0.8px !important;
  text-transform: uppercase !important;
  color: rgba(var(--v-theme-on-surface), 0.65) !important;
  padding: 14px 10px !important;
  user-select: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.th.sortable { cursor: pointer; }
.th.sortable:hover {
  color: rgba(var(--v-theme-on-surface), 0.9) !important;
  background: rgba(var(--v-theme-on-surface), 0.06) !important;
}

.sort-icon { margin-left: 6px; opacity: 0.7; }
.th-checkbox { width: 40px !important; }
.th-acciones { width: 90px !important; text-align: center !important; }

/* Filas */
.data-row {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05) !important;
  animation: rowSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes rowSlideIn {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.data-row:hover { background: rgba(var(--v-theme-on-surface), 0.06) !important; box-shadow: inset 0 0 0 1px rgba(var(--v-theme-on-surface), 0.1); }
.data-row:last-child { border-bottom: none !important; }

.td {
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
  padding: 13px 10px !important;
  vertical-align: middle;
}

.td-checkbox { width: 40px !important; }

.codigo-badge {
  display: inline-block;
  background: rgba(79, 70, 229, 0.15);
  color: var(--indigo);
  padding: 4px 10px;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
  font-variant-numeric: tabular-nums;
}

.nombre-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cc-icon {
  color: rgba(79, 70, 229, 0.7);
  flex-shrink: 0;
}

.nombre-text {
  font-weight: 600;
  font-size: 13px;
}

.location-id {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: rgba(var(--v-theme-on-surface), 0.6);
  background: rgba(var(--v-theme-on-surface), 0.05);
  padding: 3px 9px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
}

.text-muted { color: rgba(var(--v-theme-on-surface), 0.4); font-size: 13px; }

/* Toggle de estado activo/inactivo */
.td-estado { width: 140px; }
.estado-toggle {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 14px; border-radius: 20px;
  font-size: 11px; font-weight: 700; letter-spacing: .4px;
  border: 1.5px solid transparent; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.estado-toggle:disabled { opacity: 0.6; cursor: wait; }
.estado-on  { background: rgba(16, 185, 129, 0.15); color: #10b981; border-color: rgba(16, 185, 129, 0.3); }
.estado-on:hover  { background: rgba(16, 185, 129, 0.25); }
.estado-off { background: rgba(148, 163, 184, 0.15); color: rgba(var(--v-theme-on-surface), 0.6); border-color: rgba(148, 163, 184, 0.3); }
.estado-off:hover { background: rgba(148, 163, 184, 0.25); }

.td-acciones { text-align: center !important; width: 90px !important; }
.action-buttons { display: flex; gap: -8px; justify-content: center; align-items: center; }
.action-buttons :deep(.v-btn) { margin: 0 -6px; padding: 0 4px; }

/* Empty / Loading */
.empty-state {
  padding: 80px 24px;
  text-align: center;
}

.empty-title {
  font-size: 18px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
  margin-top: 16px;
}

.empty-sub {
  font-size: 14px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  margin-top: 8px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 24px;
}

.loading-text {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  margin: 0;
}

/* Paginación */
.pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 18px;
  border-top: 1.5px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.page-info {
  font-size: 12px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

/* Diálogos */
.confirm-icon { display: flex; justify-content: center; margin-bottom: 16px; }
.confirm-title { font-size: 16px; font-weight: 800; text-align: center; margin: 12px 0 8px; letter-spacing: -0.3px; }
.confirm-message { font-size: 14px; color: rgba(var(--v-theme-on-surface), 0.65); text-align: center; margin: 0; }
</style>
