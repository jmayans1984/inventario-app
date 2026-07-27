<template>
  <div class="cb-table-wrapper">
    <!-- TOOLBAR -->
    <div class="cb-toolbar">
      <div class="toolbar-left">
        <v-text-field
          v-model="busqueda"
          placeholder="Buscar por código, banco o cuenta..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          class="search-field"
          @update:model-value="handleBusqueda"
        />
      </div>
      <div class="toolbar-right">
        <!-- Filtro estado -->
        <v-btn-toggle v-model="filtroEstado" density="compact" rounded="lg" @update:model-value="aplicarFiltro">
          <v-btn value="TODOS" size="small">Todos</v-btn>
          <v-btn value="ACTIVA" size="small">Activas</v-btn>
          <v-btn value="INACTIVA" size="small">Inactivas</v-btn>
        </v-btn-toggle>
        <v-btn
          icon="mdi-refresh"
          color="primary"
          variant="text"
          size="small"
          :loading="store.loading"
          @click="recargar"
          title="Recargar"
        />
      </div>
    </div>

    <!-- TABLA -->
    <v-table
      v-if="cuentasFiltradas.length > 0"
      density="comfortable"
      class="cb-data-table"
    >
      <thead>
        <tr class="table-header">
          <th
            v-for="col in columnas"
            :key="col.key"
            class="th"
            :class="{ sortable: col.sortable, 'th-center': col.center }"
            @click="col.sortable && handleSort(col.key)"
          >
            <span>{{ col.label }}</span>
            <v-icon v-if="col.sortable" size="14" class="sort-icon">
              {{
                store.filters.sortBy === col.key
                  ? store.filters.sortOrder === 'asc' ? 'mdi-sort-ascending' : 'mdi-sort-descending'
                  : 'mdi-sort'
              }}
            </v-icon>
          </th>
          <th class="th-acciones">ACCIONES</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="cuenta in cuentasFiltradas"
          :key="cuenta.codigo"
          class="data-row"
          :class="{ 'row-inactiva': cuenta.estado === 'INACTIVA' }"
        >
          <!-- CÓDIGO -->
          <td class="td">
            <span class="codigo-badge">{{ cuenta.codigo }}</span>
          </td>

          <!-- BANCO -->
          <td class="td">
            <div class="banco-wrap">
              <div class="banco-icon">
                <v-icon size="14" color="white">mdi-bank</v-icon>
              </div>
              <span class="banco-name">{{ cuenta.nombre_banco }}</span>
            </div>
          </td>

          <!-- NOMBRE CUENTA -->
          <td class="td">
            <span class="cta-name">{{ cuenta.nombre_cta }}</span>
          </td>

          <!-- CHEQUE -->
          <td class="td td-center">
            <span v-if="cuenta.cheque !== null && cuenta.cheque !== undefined && cuenta.cheque !== '' && cuenta.cheque !== 0" class="cheque-num">
              {{ cuenta.cheque }}
            </span>
            <span v-else class="text-muted">—</span>
          </td>

          <!-- ESTADO -->
          <td class="td td-center">
            <v-chip
              :color="cuenta.estado === 'ACTIVA' ? 'success' : 'default'"
              size="small"
              label
              variant="tonal"
              class="estado-chip"
            >
              <v-icon start size="10">
                {{ cuenta.estado === 'ACTIVA' ? 'mdi-circle' : 'mdi-circle-outline' }}
              </v-icon>
              {{ cuenta.estado }}
            </v-chip>
          </td>

          <!-- ACCIONES -->
          <td class="td-acciones">
            <div class="action-buttons">
              <!-- Editar -->
              <v-btn
                icon="mdi-pencil-outline"
                size="x-small"
                variant="text"
                color="primary"
                @click="handleEditar(cuenta)"
                title="Editar"
              />
              <!-- Toggle Estado -->
              <v-btn
                :icon="cuenta.estado === 'ACTIVA' ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                size="x-small"
                variant="text"
                :color="cuenta.estado === 'ACTIVA' ? 'warning' : 'success'"
                :title="cuenta.estado === 'ACTIVA' ? 'Desactivar cuenta' : 'Activar cuenta'"
                :loading="toggleLoading === cuenta.codigo"
                @click="handleToggleEstado(cuenta)"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- VACÍO -->
    <div v-else-if="!store.loading" class="empty-state">
      <v-icon size="64" color="rgba(var(--v-theme-on-surface), 0.2)">mdi-bank-outline</v-icon>
      <p class="empty-title">{{ busqueda ? 'Sin resultados' : 'Sin cuentas bancarias' }}</p>
      <p class="empty-sub">
        {{ busqueda ? 'Intenta con otro término' : 'Registra tu primera cuenta bancaria' }}
      </p>
    </div>

    <!-- LOADING -->
    <div v-if="store.loading" class="loading-state">
      <v-progress-circular indeterminate color="primary" size="36" />
      <p class="loading-text">Cargando cuentas...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCuentasBancariasStore } from '../../../stores/cuentasbancarias'

const store = useCuentasBancariasStore()
const emit  = defineEmits(['editar'])

const busqueda    = ref('')
const filtroEstado = ref('TODOS')
const toggleLoading = ref(null)

const columnas = [
  { key: 'codigo',      label: 'CÓDIGO',     sortable: true,  center: false },
  { key: 'nombre_banco',label: 'BANCO',      sortable: true,  center: false },
  { key: 'nombre_cta',  label: 'NOMBRE CTA', sortable: true,  center: false },
  { key: 'cheque',      label: 'CHEQUE',     sortable: false, center: true  },
  { key: 'estado',      label: 'ESTADO',     sortable: false, center: true  },
]

// Filtrado local por estado + búsqueda
const cuentasFiltradas = computed(() => {
  let lista = store.cuentas
  if (filtroEstado.value !== 'TODOS') {
    lista = lista.filter(c => c.estado === filtroEstado.value)
  }
  if (busqueda.value.length >= 2) {
    const q = busqueda.value.toLowerCase()
    lista = lista.filter(c =>
      c.codigo?.toLowerCase().includes(q) ||
      c.nombre_banco?.toLowerCase().includes(q) ||
      c.nombre_cta?.toLowerCase().includes(q)
    )
  }
  return lista
})

async function handleBusqueda(query) {
  if (query.length >= 3 || query.length === 0) {
    if (!query) await store.fetchCuentas()
  }
}

function aplicarFiltro() {
  store.filters.estado = filtroEstado.value
}

function handleSort(key) {
  if (store.filters.sortBy === key) {
    store.filters.sortOrder = store.filters.sortOrder === 'asc' ? 'desc' : 'asc'
  } else {
    store.filters.sortBy = key
    store.filters.sortOrder = 'asc'
  }
  store.fetchCuentas()
}

function handleEditar(cuenta) {
  emit('editar', cuenta)
}

async function handleToggleEstado(cuenta) {
  toggleLoading.value = cuenta.codigo
  try {
    await store.toggleEstado(cuenta.codigo)
  } finally {
    toggleLoading.value = null
  }
}

async function recargar() {
  await store.fetchCuentas()
}
</script>

<style scoped>
.cb-table-wrapper {
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

/* Toolbar */
.cb-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  flex-wrap: wrap;
}

.toolbar-left { flex: 1; min-width: 200px; }
.toolbar-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.search-field { width: 100%; }

/* Tabla */
.cb-data-table { background: transparent !important; width: 100%; }

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
  white-space: nowrap;
}

.th.sortable { cursor: pointer; transition: all 0.2s; }
.th.sortable:hover { color: rgb(var(--v-theme-primary)) !important; background: rgba(var(--v-theme-primary), 0.08) !important; }
.th-center { text-align: center !important; }
.th-acciones { width: 90px !important; text-align: center !important; font-size: 10px !important; font-weight: 800 !important; letter-spacing: 1.2px !important; text-transform: uppercase !important; color: rgba(var(--v-theme-on-surface), 0.6) !important; }
.sort-icon { margin-left: 4px; opacity: 0.5; }

/* Filas */
.data-row {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06) !important;
  transition: background 0.15s;
}
.data-row:hover { background: rgba(var(--v-theme-primary), 0.04) !important; }
.data-row:last-child { border-bottom: none !important; }
.row-inactiva { opacity: 0.55; }

.td {
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
  padding: 14px 14px !important;
  vertical-align: middle;
}

.td-center { text-align: center !important; }

/* Código */
.codigo-badge {
  display: inline-block;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1px;
  font-variant-numeric: tabular-nums;
}

/* Banco */
.banco-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.banco-icon {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, var(--indigo), var(--gold));
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.banco-name {
  font-weight: 700;
  font-size: 13px;
}

.cta-name {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.85);
}

/* Cheque */
.cheque-num {
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.text-muted { color: rgba(var(--v-theme-on-surface), 0.3); font-size: 13px; }

/* Estado chip */
.estado-chip { font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.5px; }

/* Acciones */
.td-acciones { text-align: center !important; width: 90px !important; }
.action-buttons { display: flex; gap: 2px; justify-content: center; }

/* Vacío / Loading */
.empty-state { padding: 64px 24px; text-align: center; }
.empty-title { font-size: 16px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); margin-top: 12px; }
.empty-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin-top: 6px; }
.loading-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 24px; }
.loading-text { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 0; }
</style>
