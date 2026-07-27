<template>
  <MainLayout>
    <div class="view-container">
      <PageHeader
        title="Conciliación de Cuentas"
        description="Marca los movimientos bancarios como conciliados"
        :crumbs="['Tesorería', 'Procesos', 'Conciliación de Cuentas']"
      >
        <template #actions>
          <v-btn
            v-if="selectedIds.length > 0"
            color="success"
            prepend-icon="mdi-check-all"
            @click="marcarSeleccionados"
            :loading="store.loading"
          >
            Conciliar {{ selectedIds.length }}
          </v-btn>
        </template>
      </PageHeader>

      <!-- KPI CARDS -->
      <div class="kpi-grid mb-5">
        <KpiCard
          v-for="(kpi, i) in kpis"
          :key="kpi.label"
          :index="i"
          :label="kpi.label"
          :value="kpi.value"
          :icon="kpi.icon"
          :color="kpi.color"
          :value-color="kpi.color"
          :hint="kpi.hint"
        />
      </div>

      <!-- FILTROS -->
      <div class="filtros-bar">
        <v-btn-toggle v-model="filtroLocal" class="filtro-toggle">
          <v-btn value="PENDIENTE" size="small">Pendientes</v-btn>
          <v-btn value="CONCILIADO" size="small">Conciliados</v-btn>
          <v-btn value="TODOS" size="small">Todos</v-btn>
        </v-btn-toggle>
      </div>

      <!-- TABLA -->
      <div class="tabla-container">
        <div class="tabla-header">
          <div class="search-bar">
            <v-icon size="18" class="search-icon">mdi-magnify</v-icon>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar por referencia, concepto..."
              class="search-input"
            />
          </div>
        </div>

        <div class="tabla-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-checkbox">
                  <input
                    type="checkbox"
                    :checked="todoSeleccionado"
                    @change="toggleTodos"
                  />
                </th>
                <th class="col-fecha">FECHA</th>
                <th class="col-referencia">REFERENCIA</th>
                <th class="col-concepto">CONCEPTO</th>
                <th class="col-monto">MONTO</th>
                <th class="col-estado">ESTADO</th>
                <th class="col-acciones">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="movimientosFiltrados.length === 0">
                <td colspan="7" class="tabla-empty">
                  <v-icon size="32" class="empty-icon">mdi-inbox-outline</v-icon>
                  <p class="empty-text">No hay movimientos para conciliar</p>
                </td>
              </tr>
              <tr v-for="mov in movimientosFiltrados" :key="mov.id" class="tabla-row">
                <td class="col-checkbox">
                  <input
                    type="checkbox"
                    :checked="selectedIds.includes(mov.id)"
                    @change="toggleSeleccion(mov.id)"
                  />
                </td>
                <td class="col-fecha">{{ formatFecha(mov.fecha) }}</td>
                <td class="col-referencia">
                  <span class="badge-referencia">{{ mov.referencia || '-' }}</span>
                </td>
                <td class="col-concepto">{{ mov.concepto || '-' }}</td>
                <td class="col-monto">
                  <span class="monto-bold">{{ formatMoneda(mov.monto) }}</span>
                </td>
                <td class="col-estado">
                  <v-chip
                    :color="mov.estado === 'CONCILIADO' ? 'success' : 'warning'"
                    variant="flat"
                    size="small"
                  >
                    {{ mov.estado }}
                  </v-chip>
                </td>
                <td class="col-acciones">
                  <div class="action-buttons">
                    <v-btn
                      v-if="mov.estado === 'PENDIENTE'"
                      icon="mdi-check-circle-outline"
                      size="x-small"
                      variant="text"
                      color="success"
                      @click="marcar(mov.id, 'CONCILIADO')"
                      :loading="store.loading"
                      title="Marcar como conciliado"
                    />
                    <v-btn
                      v-else
                      icon="mdi-close-circle-outline"
                      size="x-small"
                      variant="text"
                      color="warning"
                      @click="marcar(mov.id, 'PENDIENTE')"
                      :loading="store.loading"
                      title="Marcar como pendiente"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ERROR -->
      <v-alert v-if="store.error" type="error" closable @click:close="store.clearError()" class="mt-4">
        {{ store.error }}
      </v-alert>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { useConciliacionBancariaStore } from '../../stores/conciliacion-bancaria'
import { formatMoneda, formatFecha } from '../../utils/formatters'

const store = useConciliacionBancariaStore()
const searchQuery = ref('')
const filtroLocal = ref('PENDIENTE')
const selectedIds = ref([])

const movimientosFiltrados = computed(() => {
  let list = [...store.movimientos]

  // Filtro de estado
  if (filtroLocal.value !== 'TODOS') {
    list = list.filter(m => m.estado === filtroLocal.value)
  }

  // Filtro de búsqueda
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(m =>
      (m.referencia && m.referencia.toLowerCase().includes(q)) ||
      (m.concepto && m.concepto.toLowerCase().includes(q))
    )
  }

  return list
})

const todoSeleccionado = computed(() => {
  const visibles = movimientosFiltrados.value.filter(m => m.estado === 'PENDIENTE')
  return visibles.length > 0 && selectedIds.value.length === visibles.length
})

function toggleSeleccion(id) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

function toggleTodos() {
  const visibles = movimientosFiltrados.value.filter(m => m.estado === 'PENDIENTE')
  if (todoSeleccionado.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = visibles.map(m => m.id)
  }
}

async function marcar(id, estado) {
  try {
    if (estado === 'CONCILIADO') {
      await store.marcarConciliado(id)
    } else {
      await store.marcarPendiente(id)
    }
    // Remover de seleccionados si se cambia a conciliado
    if (estado === 'CONCILIADO') {
      const idx = selectedIds.value.indexOf(id)
      if (idx >= 0) selectedIds.value.splice(idx, 1)
    }
  } catch (err) {
    console.error('Error al marcar:', err)
  }
}

async function marcarSeleccionados() {
  try {
    await store.marcarMultiplesConciliados()
    selectedIds.value = []
  } catch (err) {
    console.error('Error al marcar múltiples:', err)
  }
}

onMounted(async () => {
  await store.fetchMovimientos()
})
</script>

<style scoped>
.view-container { padding: 24px; max-width: 1400px; margin: 0 auto; }

.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }

.filtros-bar { margin-bottom: 20px; }
.filtro-toggle { border: 1px solid rgba(var(--v-theme-on-surface), 0.12); border-radius: 8px; }

.tabla-container { background: rgb(var(--v-theme-surface)); border-radius: 12px; border: 1px solid rgba(var(--v-theme-on-surface), 0.08); overflow: hidden; }
.tabla-header { display: flex; align-items: center; padding: 16px 20px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08); }
.search-bar { display: flex; align-items: center; flex: 1; gap: 8px; padding: 8px 12px; background: rgba(var(--v-theme-on-surface), 0.03); border-radius: 8px; border: 1px solid rgba(var(--v-theme-on-surface), 0.08); }
.search-icon { color: rgba(var(--v-theme-on-surface), 0.4); }
.search-input { flex: 1; border: none; background: transparent; outline: none; font-size: 14px; }
.search-input::placeholder { color: rgba(var(--v-theme-on-surface), 0.4); }

.tabla-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table thead { background: rgba(var(--v-theme-on-surface), 0.04); }
.data-table thead th { padding: 12px 10px; text-align: left; font-weight: 700; font-size: 11px; letter-spacing: 0.5px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface), 0.6); border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08); }
.data-table tbody tr { border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); }
.data-table tbody tr:hover { background: rgba(var(--v-theme-on-surface), 0.02); }
.data-table tbody td { padding: 11px 10px; color: rgb(var(--v-theme-on-surface)); }

.col-checkbox { width: 40px; }
.col-checkbox input { cursor: pointer; }
.col-fecha { width: 100px; }
.col-referencia { width: 120px; }
.col-concepto { width: 30%; }
.col-monto { width: 120px; text-align: right; }
.col-estado { width: 120px; }
.col-acciones { width: 80px; text-align: center; }

.badge-referencia { background: var(--indigo-wash); color: var(--indigo); padding: 3px 8px; border-radius: 6px; font-weight: 600; font-size: 12px; }
.monto-bold { font-weight: 700; color: var(--indigo); font-variant-numeric: tabular-nums; }
.action-buttons { display: flex; gap: 2px; justify-content: center; }

.tabla-empty { text-align: center !important; padding: 40px !important; }
.empty-icon { color: rgba(var(--v-theme-on-surface), 0.2); display: block; margin: 0 auto 8px; }
.empty-text { color: rgba(var(--v-theme-on-surface), 0.4); font-size: 14px; margin: 0; }
</style>
