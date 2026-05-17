<template>
  <div class="prov-table-wrapper">
    <!-- TOOLBAR -->
    <div class="prov-toolbar">
      <div class="toolbar-left">
        <v-text-field
          v-model="busqueda"
          placeholder="Buscar por código, nombre o dirección..."
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
          icon="mdi-download-outline"
          color="primary"
          variant="text"
          size="small"
          @click="handleExportar"
          title="Exportar a Excel"
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
      v-if="store.proveedores.length > 0"
      density="comfortable"
      class="prov-data-table"
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
        <tr v-for="prov in store.proveedores" :key="prov.codigo" class="data-row">
          <td class="td-checkbox">
            <v-checkbox
              :model-value="selectedIds.includes(prov.codigo)"
              @update:model-value="(val) => toggleSeleccion(prov.codigo, val)"
              hide-details
            />
          </td>
          <td class="td codigo-col">
            <span class="codigo-badge">{{ prov.codigo }}</span>
          </td>
          <td class="td nombre-col">
            <p class="nombre-text">{{ prov.nombre }}</p>
          </td>
          <td class="td direccion-col">
            <div class="direccion-wrap">
              <v-icon size="12" class="addr-icon">mdi-map-marker</v-icon>
              <span>{{ prov.direccion || '—' }}</span>
            </div>
          </td>
          <td class="td telefono-col">
            <a v-if="prov.telefono1" :href="`tel:${prov.telefono1}`" class="tel-link">
              <v-icon size="12">mdi-phone</v-icon>
              {{ prov.telefono1 }}
            </a>
            <span v-else>—</span>
          </td>
          <td class="td-acciones">
            <div class="action-buttons">
              <v-btn
                icon="mdi-pencil-outline"
                size="x-small"
                variant="text"
                color="primary"
                @click="handleEditar(prov)"
                title="Editar"
              />
              <v-btn
                icon="mdi-trash-can-outline"
                size="x-small"
                variant="text"
                color="error"
                @click="abrirConfirmacion(prov.codigo, prov.nombre)"
                title="Eliminar"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- ESTADO VACÍO -->
    <div v-else class="empty-state">
      <v-icon size="64" color="rgba(var(--v-theme-on-surface), 0.2)">
        mdi-inbox-outline
      </v-icon>
      <p class="empty-title">{{ busqueda ? 'Sin resultados' : 'Sin proveedores' }}</p>
      <p class="empty-sub">
        {{ busqueda ? 'Intenta con otro término de búsqueda' : 'Crea tu primer proveedor' }}
      </p>
    </div>

    <!-- PAGINACIÓN -->
    <div v-if="store.paginasTotales > 1" class="pagination-wrapper">
      <v-pagination
        v-model="store.filters.page"
        :length="store.paginasTotales"
        @update:model-value="fetchProveedores"
      />
      <div class="page-info">
        {{ store.proveedores.length }} de {{ store.totalProveedores }}
      </div>
    </div>

    <!-- DIÁLOGO DE CONFIRMACIÓN (Eliminar uno) -->
    <v-dialog v-model="dialogConfirmacion" max-width="400">
      <v-card>
        <v-card-text class="pa-6">
          <div class="confirm-icon">
            <v-icon size="48" color="error">mdi-alert-circle-outline</v-icon>
          </div>
          <p class="confirm-title">¿Eliminar proveedor?</p>
          <p class="confirm-message">
            Se eliminará permanentemente <strong>{{ proveedorAEliminar }}</strong>
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogConfirmacion = false">
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :loading="store.loading"
            @click="handleEliminar"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIÁLOGO DE CONFIRMACIÓN (Eliminar múltiples) -->
    <v-dialog v-model="dialogConfirmacionBatch" max-width="400">
      <v-card>
        <v-card-text class="pa-6">
          <div class="confirm-icon">
            <v-icon size="48" color="error">mdi-alert-circle-outline</v-icon>
          </div>
          <p class="confirm-title">¿Eliminar {{ selectedIds.length }} proveedor(es)?</p>
          <p class="confirm-message">
            Esta acción no se puede deshacer.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogConfirmacionBatch = false">
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :loading="store.loading"
            @click="handleEliminarMultiples"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useProveedoresStore } from '../../../stores/proveedores'

const store = useProveedoresStore()

const props = defineProps({
  onEditar: Function,
})

const emit = defineEmits(['editar'])

// ─── STATE ───────────────────────────────────────────
const busqueda = ref('')
const selectedIds = ref([])
const dialogConfirmacion = ref(false)
const dialogConfirmacionBatch = ref(false)
const proveedorAEliminar = ref('')
const idAEliminar = ref(null)

const columnas = [
  { key: 'codigo', label: 'CÓDIGO', sortable: true },
  { key: 'nombre', label: 'NOMBRE', sortable: true },
  { key: 'direccion', label: 'DIRECCIÓN', sortable: false },
  { key: 'telefono1', label: 'TELÉFONO', sortable: false },
]

// ─── COMPUTED ────────────────────────────────────────

const todosSeleccionados = computed(
  () => selectedIds.value.length > 0 && selectedIds.value.length === store.proveedores.length
)

const algunoSeleccionados = computed(
  () => selectedIds.value.length > 0 && selectedIds.value.length < store.proveedores.length
)

// ─── METHODS ─────────────────────────────────────────

async function handleBusqueda(query) {
  store.filters.search = query
  store.filters.page = 1
  if (query.length >= 3 || query.length === 0) {
    if (query) {
      await store.buscar(query)
    } else {
      await store.fetchProveedores()
    }
  }
}

function handleSort(key) {
  if (store.filters.sortBy === key) {
    store.filters.sortOrder = store.filters.sortOrder === 'asc' ? 'desc' : 'asc'
  } else {
    store.filters.sortBy = key
    store.filters.sortOrder = 'asc'
  }
  fetchProveedores()
}

function handleEditar(proveedor) {
  emit('editar', proveedor)
}

function abrirConfirmacion(id, nombre) {
  idAEliminar.value = id
  proveedorAEliminar.value = nombre
  dialogConfirmacion.value = true
}

function abrirConfirmacionBatch() {
  dialogConfirmacionBatch.value = true
}

async function handleEliminar() {
  if (!idAEliminar.value) return
  try {
    await store.eliminarProveedor(idAEliminar.value)
    dialogConfirmacion.value = false
    idAEliminar.value = null
    proveedorAEliminar.value = ''
  } catch (error) {
    console.error('Error eliminando:', error)
  }
}

async function handleEliminarMultiples() {
  try {
    await store.eliminarMultiples(selectedIds.value)
    dialogConfirmacionBatch.value = false
    selectedIds.value = []
  } catch (error) {
    console.error('Error eliminando múltiples:', error)
  }
}

async function handleExportar() {
  try {
    await store.service.exportarExcel(store.filters)
  } catch (error) {
    console.error('Error exportando:', error)
  }
}

async function recargar() {
  await store.fetchProveedores()
}

function toggleTodos(val) {
  if (val) {
    selectedIds.value = store.proveedores.map(p => p.codigo)
  } else {
    selectedIds.value = []
  }
}

function toggleSeleccion(id, val) {
  if (val) {
    selectedIds.value.push(id)
  } else {
    selectedIds.value = selectedIds.value.filter(sid => sid !== id)
  }
}

async function fetchProveedores() {
  await store.fetchProveedores()
}
</script>

<style scoped>
.prov-table-wrapper {
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  transition: all 0.3s ease;
}

/* Toolbar */
.prov-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  flex-wrap: wrap;
}

.toolbar-left {
  flex: 1;
  min-width: 250px;
}

.search-field {
  width: 100%;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

/* Tabla */
.prov-data-table {
  background: transparent !important;
  width: 100%;
}

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

.th.sortable {
  cursor: pointer;
  transition: all 0.2s;
}

.th.sortable:hover {
  color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.1) !important;
}

.sort-icon {
  margin-left: 4px;
  opacity: 0.5;
}

.th-checkbox {
  width: 40px !important;
}

.th-acciones {
  width: 100px !important;
  text-align: center !important;
}

/* Data Rows */
.data-row {
  transition: background 0.15s;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06) !important;
}

.data-row:hover {
  background: rgba(var(--v-theme-primary), 0.04) !important;
}

.data-row:last-child {
  border-bottom: none !important;
}

.td {
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
  padding: 12px 14px !important;
  vertical-align: middle;
}

.td-checkbox {
  width: 40px !important;
  text-align: center !important;
}

.codigo-col {
  font-family: 'Courier New', monospace;
  font-weight: 700;
}

.codigo-badge {
  display: inline-block;
  background: rgba(var(--v-theme-primary), 0.15);
  color: rgb(var(--v-theme-primary));
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.nombre-text {
  font-weight: 700;
  margin: 0;
}

.direccion-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

.addr-icon {
  flex-shrink: 0;
  color: rgba(var(--v-theme-on-surface), 0.4);
}

.telefono-col {
  font-family: 'Courier New', monospace;
}

.tel-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.tel-link:hover {
  text-decoration: underline;
}

.text-muted {
  color: rgba(var(--v-theme-on-surface), 0.4);
}

.td-acciones {
  text-align: center !important;
  width: 100px !important;
}

.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: center;
}

/* Empty State */
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

/* Pagination */
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
.confirm-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.confirm-title {
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  margin: 12px 0 8px;
}

.confirm-message {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  text-align: center;
  margin: 0;
}
</style>
