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
          <th class="th-checkbox">
            <v-checkbox
              :model-value="todosSeleccionados"
              :indeterminate="algunoSeleccionados"
              @update:model-value="toggleTodos"
              hide-details
            />
          </th>
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
          <!-- Checkbox -->
          <td class="td-checkbox">
            <v-checkbox
              :model-value="selectedIds.includes(cc.codigo)"
              @update:model-value="(val) => toggleSeleccion(cc.codigo, val)"
              hide-details
            />
          </td>

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

          <!-- SQUARE LOCATION ID -->
          <td class="td">
            <span v-if="cc.square_location_id" class="location-id">
              <v-icon size="12" class="mr-1" style="opacity:0.5">mdi-identifier</v-icon>
              {{ cc.square_location_id }}
            </span>
            <span v-else class="text-muted">—</span>
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
  { key: 'codigo', label: 'CÓDIGO',    sortable: true  },
  { key: 'nombre', label: 'NOMBRE',    sortable: true  },
  { key: 'square_location_id', label: 'SQUARE LOCATION ID', sortable: false },
]

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
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

/* Toolbar */
.cc-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  flex-wrap: wrap;
}

.toolbar-left { flex: 1; min-width: 250px; }
.toolbar-right { display: flex; gap: 8px; }
.search-field { width: 100%; }

/* Tabla */
.cc-data-table { background: transparent !important; width: 100%; }

.table-header {
  background: rgba(var(--v-theme-primary), 0.05) !important;
  border-bottom: 2px solid rgba(var(--v-theme-primary), 0.2) !important;
}

.th {
  font-size: 10px !important;
  font-weight: 800 !important;
  letter-spacing: 1.2px !important;
  text-transform: uppercase !important;
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
  padding: 12px 14px !important;
  user-select: none;
}

.th.sortable { cursor: pointer; transition: all 0.2s; }
.th.sortable:hover {
  color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.1) !important;
}

.sort-icon { margin-left: 4px; opacity: 0.5; }
.th-checkbox { width: 40px !important; }
.th-acciones { width: 100px !important; text-align: center !important; }

/* Filas */
.data-row {
  transition: background 0.15s;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06) !important;
}
.data-row:hover { background: rgba(var(--v-theme-primary), 0.04) !important; }
.data-row:last-child { border-bottom: none !important; }

.td {
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
  padding: 14px 14px !important;
  vertical-align: middle;
}

.td-checkbox { width: 40px !important; }

.codigo-badge {
  display: inline-block;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1px;
  font-family: 'Courier New', monospace;
}

.nombre-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cc-icon {
  color: rgba(var(--v-theme-primary), 0.7);
  flex-shrink: 0;
}

.nombre-text {
  font-weight: 600;
  font-size: 14px;
}

.location-id {
  font-size: 11px;
  font-family: 'Courier New', monospace;
  color: rgba(var(--v-theme-on-surface), 0.6);
  background: rgba(var(--v-theme-on-surface), 0.05);
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
}

.text-muted { color: rgba(var(--v-theme-on-surface), 0.3); font-size: 13px; }

.td-acciones { text-align: center !important; width: 100px !important; }
.action-buttons { display: flex; gap: 4px; justify-content: center; }

/* Empty / Loading */
.empty-state {
  padding: 64px 24px;
  text-align: center;
}

.empty-title {
  font-size: 16px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  margin-top: 12px;
}

.empty-sub {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin-top: 6px;
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
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin: 0;
}

/* Paginación */
.pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.page-info {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

/* Diálogos */
.confirm-icon { display: flex; justify-content: center; margin-bottom: 12px; }
.confirm-title { font-size: 16px; font-weight: 700; text-align: center; margin: 12px 0 8px; }
.confirm-message { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.6); text-align: center; margin: 0; }
</style>
