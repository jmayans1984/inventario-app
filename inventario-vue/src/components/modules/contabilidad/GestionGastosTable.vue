<template>
  <div class="table-container">
    <!-- HEADER CON BÚSQUEDA Y ACCIONES -->
    <div class="table-header">
      <div class="search-bar">
        <v-icon size="18" class="search-icon">mdi-magnify</v-icon>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por código, factura, proveedor..."
          class="search-input"
          @input="handleSearch"
        />
      </div>
      <div class="header-actions">
        <v-btn
          size="small"
          variant="outlined"
          prepend-icon="mdi-download-outline"
          @click="exportarExcel"
          :loading="store.loading"
        >
          Exportar
        </v-btn>
      </div>
    </div>

    <!-- TABLA -->
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 10%">CÓDIGO</th>
            <th style="width: 10%">FECHA</th>
            <th style="width: 10%">FACTURA</th>
            <th style="width: 15%">PROVEEDOR</th>
            <th style="width: 15%">CENTRO COSTOS</th>
            <th style="width: 25%">CONCEPTO</th>
            <th style="width: 10%">TOTAL</th>
            <th style="width: 5%">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredGastos.length === 0">
            <td colspan="9" class="table-empty">
              <v-icon size="32" class="empty-icon">mdi-inbox-outline</v-icon>
              <p class="empty-text">No hay gastos registrados</p>
            </td>
          </tr>
          <tr v-for="gasto in filteredGastos" :key="gasto.codigo" class="table-row">
            <td class="cell-codigo">
              <span class="badge-codigo">{{ gasto.codigo }}</span>
            </td>
            <td class="cell-fecha">
              {{ formatFecha(gasto.fecha) }}
            </td>
            <td class="cell-factura">
              {{ gasto.numero_factura || '-' }}
            </td>
            <td class="cell-proveedor">
              <span class="nombre-text">{{ gasto.proveedor_nombre || gasto.proveedor_id }}</span>
            </td>
            <td class="cell-centro">
              <span class="badge-centro">{{ gasto.centro_costos_nombre || gasto.centro_costos_id }}</span>
            </td>
            <td class="cell-concepto">
              <span class="concepto-text">{{ gasto.concepto || '-' }}</span>
            </td>
            <td class="cell-total">
              <span class="total-bold">{{ formatMoneda(gasto.total) }}</span>
            </td>
            <td class="cell-acciones">
              <div class="action-buttons">
                <v-btn
                  icon="mdi-pencil-outline"
                  size="x-small"
                  variant="text"
                  @click="$emit('edit', gasto)"
                  title="Editar"
                />
                <v-btn
                  icon="mdi-trash-outline"
                  size="x-small"
                  variant="text"
                  color="error"
                  @click="eliminar(gasto.codigo)"
                  :loading="store.loading"
                  title="Eliminar"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PAGINACIÓN -->
    <div v-if="store.paginasTotales > 1" class="table-footer">
      <div class="pagination">
        <v-btn
          icon="mdi-chevron-left"
          size="small"
          variant="text"
          :disabled="store.filters.page <= 1"
          @click="irAPagina(store.filters.page - 1)"
        />
        <span class="page-info">
          Página {{ store.filters.page }} de {{ store.paginasTotales }}
        </span>
        <v-btn
          icon="mdi-chevron-right"
          size="small"
          variant="text"
          :disabled="store.filters.page >= store.paginasTotales"
          @click="irAPagina(store.filters.page + 1)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGestionGastosStore } from '../../../stores/gestiongastos'
import { gestionGastosService } from '../../../services/gestiongastos.service'
import { formatMoneda, formatFecha } from '../../../utils/formatters'

const emit = defineEmits(['edit'])

const store = useGestionGastosStore()
const searchQuery = ref('')

const filteredGastos = computed(() => {
  if (!searchQuery.value.trim()) {
    return store.gastos
  }
  const query = searchQuery.value.toLowerCase()
  return store.gastos.filter(gasto =>
    gasto.codigo.toLowerCase().includes(query) ||
    (gasto.numero_factura && gasto.numero_factura.toLowerCase().includes(query)) ||
    (gasto.proveedor_nombre && gasto.proveedor_nombre.toLowerCase().includes(query)) ||
    (gasto.centro_costos_nombre && gasto.centro_costos_nombre.toLowerCase().includes(query))
  )
})

function handleSearch() {
  // Búsqueda en tiempo real mediante computed property
}

async function eliminar(codigo) {
  if (confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
    try {
      await store.eliminarGasto(codigo)
    } catch (err) {
      console.error('Error al eliminar:', err)
    }
  }
}

function irAPagina(pagina) {
  store.setFilters({ page: pagina })
  store.fetchGastos()
}

async function exportarExcel() {
  try {
    await gestionGastosService.exportarExcel()
  } catch (err) {
    console.error('Error al exportar:', err)
  }
}
</script>

<style scoped>
.table-container {
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  overflow: hidden;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.search-bar {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.search-icon {
  color: rgba(var(--v-theme-on-surface), 0.4);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface));
}

.search-input::placeholder {
  color: rgba(var(--v-theme-on-surface), 0.4);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table thead {
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.data-table thead th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 11px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.data-table tbody tr {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  transition: background 0.2s;
}

.data-table tbody tr:hover {
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.table-row td {
  padding: 12px 16px;
  color: rgb(var(--v-theme-on-surface));
}

.table-empty {
  text-align: center;
  padding: 40px 20px !important;
}

.empty-icon {
  color: rgba(var(--v-theme-on-surface), 0.2);
  margin-bottom: 8px;
}

.empty-text {
  color: rgba(var(--v-theme-on-surface), 0.4);
  font-size: 14px;
  margin: 0;
}

.cell-codigo {
  font-weight: 600;
}

.badge-codigo {
  background: rgba(102, 126, 234, 0.15);
  color: #667eea;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 12px;
}

.badge-centro {
  background: rgba(118, 75, 162, 0.15);
  color: #764ba2;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 11px;
}

.nombre-text {
  color: rgb(var(--v-theme-on-surface));
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.cell-valor,
.cell-impuestos,
.cell-total {
  text-align: right;
  font-family: 'Courier New', monospace;
  font-weight: 500;
}

.total-bold {
  font-weight: 700;
  color: #667eea;
}

.cell-acciones {
  text-align: right;
}

.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 20px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.pagination {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-info {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  min-width: 120px;
  text-align: center;
}
</style>
