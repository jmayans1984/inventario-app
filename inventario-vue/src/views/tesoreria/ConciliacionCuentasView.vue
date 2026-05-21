<template>
  <MainLayout>
    <div class="view-container">
      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">TESORERÍA</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Procesos</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Conciliación de Cuentas</span>
      </div>

      <!-- HEADER -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon-wrap">
            <v-icon size="22" color="white">mdi-bank-check</v-icon>
          </div>
          <div>
            <h1 class="page-title">CONCILIACIÓN DE CUENTAS</h1>
            <p class="page-sub">Selecciona una cuenta y marca los movimientos como conciliados</p>
          </div>
        </div>
        <div class="header-actions">
          <v-btn
            v-if="selectedNros.length > 0"
            color="success"
            prepend-icon="mdi-check-all"
            @click="marcarSeleccionados"
            :loading="store.loading"
          >
            Conciliar {{ selectedNros.length }}
          </v-btn>
        </div>
      </div>

      <!-- SELECTOR DE CUENTA BANCARIA (solo ACTIVAS) -->
      <div class="cuenta-selector-wrap">
        <div class="cuenta-selector-label">
          <v-icon size="16" class="mr-1">mdi-bank-outline</v-icon>
          Cuenta bancaria
        </div>
        <v-select
          v-model="cuentaSeleccionada"
          :items="cuentasActivas"
          item-title="nombre_cta"
          item-value="codigo"
          label="Selecciona una cuenta para conciliar..."
          variant="outlined"
          density="comfortable"
          clearable
          :loading="cuentasStore.loading"
          class="cuenta-select"
          @update:modelValue="onCuentaChange"
        >
          <template #item="{ props, item }">
            <v-list-item v-bind="props">
              <template #prepend>
                <v-icon size="18" color="primary">mdi-bank-outline</v-icon>
              </template>
              <template #subtitle>
                <span class="text-caption">{{ item.raw.nombre_banco }} · {{ item.raw.nro_cta || '' }}</span>
              </template>
            </v-list-item>
          </template>
          <template #selection="{ item }">
            <div class="selected-cuenta">
              <v-icon size="16" color="primary" class="mr-2">mdi-bank-outline</v-icon>
              <span class="selected-nombre">{{ item.raw.nombre_cta }}</span>
              <span class="selected-banco ml-2">· {{ item.raw.nombre_banco }}</span>
            </div>
          </template>
        </v-select>
      </div>

      <!-- SIN CUENTA SELECCIONADA -->
      <div v-if="!cuentaSeleccionada" class="empty-state-cuenta">
        <v-icon size="48" class="empty-state-icon">mdi-bank-outline</v-icon>
        <p class="empty-state-title">Selecciona una cuenta bancaria</p>
        <p class="empty-state-sub">Elige una cuenta activa para ver sus movimientos pendientes de conciliar</p>
      </div>

      <template v-else>
        <!-- KPI CARDS -->
        <div class="kpi-grid">
          <div class="kpi-card kpi-pendiente">
            <div class="kpi-label">PENDIENTES</div>
            <div class="kpi-value">{{ store.movimientos.length }}</div>
            <div class="kpi-sub">Total pendientes por conciliar</div>
          </div>
          <div class="kpi-card kpi-ingreso">
            <div class="kpi-label">TOTAL INGRESOS</div>
            <div class="kpi-value kpi-verde">{{ formatMoneda(totalIngresos) }}</div>
            <div class="kpi-sub">Créditos pendientes</div>
          </div>
          <div class="kpi-card kpi-egreso">
            <div class="kpi-label">TOTAL EGRESOS</div>
            <div class="kpi-value kpi-ambar">{{ formatMoneda(totalEgresos) }}</div>
            <div class="kpi-sub">Débitos pendientes</div>
          </div>
        </div>

        <!-- TABLA -->
        <div class="tabla-container">
          <div class="tabla-header">
            <div class="search-bar">
              <v-icon size="18" class="search-icon">mdi-magnify</v-icon>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar por número, beneficiario, concepto..."
                class="search-input"
              />
            </div>
            <v-btn
              variant="text"
              prepend-icon="mdi-refresh"
              size="small"
              @click="recargar"
              :loading="store.loading"
              class="ml-2"
            >
              Actualizar
            </v-btn>
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
                      :disabled="movimientosFiltrados.length === 0"
                    />
                  </th>
                  <th class="col-numero">NÚMERO</th>
                  <th class="col-fecha">FECHA</th>
                  <th class="col-beneficia">BENEFICIARIO</th>
                  <th class="col-concepto">CONCEPTO</th>
                  <th class="col-cheque">CHEQUE / REF</th>
                  <th class="col-ingreso">INGRESO</th>
                  <th class="col-egreso">EGRESO</th>
                  <th class="col-acciones">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="store.loading">
                  <td colspan="9" class="tabla-empty">
                    <v-progress-circular indeterminate color="primary" size="28" />
                    <p class="empty-text mt-2">Cargando movimientos...</p>
                  </td>
                </tr>
                <tr v-else-if="movimientosFiltrados.length === 0">
                  <td colspan="9" class="tabla-empty">
                    <v-icon size="32" class="empty-icon">mdi-check-circle-outline</v-icon>
                    <p class="empty-text">No hay movimientos pendientes de conciliar</p>
                  </td>
                </tr>
                <tr
                  v-for="mov in movimientosFiltrados"
                  :key="mov.numero"
                  class="tabla-row"
                  :class="{ 'row-selected': selectedNros.includes(mov.numero) }"
                >
                  <td class="col-checkbox">
                    <input
                      type="checkbox"
                      :checked="selectedNros.includes(mov.numero)"
                      @change="toggleSeleccion(mov.numero)"
                    />
                  </td>
                  <td class="col-numero">
                    <span class="badge-numero">{{ mov.numero }}</span>
                  </td>
                  <td class="col-fecha">{{ formatFecha(mov.fecha) }}</td>
                  <td class="col-beneficia">{{ mov.beneficia || '-' }}</td>
                  <td class="col-concepto">{{ mov.concepto || '-' }}</td>
                  <td class="col-cheque">
                    <span v-if="mov.cheque" class="badge-cheque">{{ mov.cheque }}</span>
                    <span v-else class="text-muted">-</span>
                  </td>
                  <td class="col-ingreso">
                    <span v-if="mov.ingreso > 0" class="monto-ingreso">
                      {{ formatMoneda(mov.ingreso) }}
                    </span>
                    <span v-else class="text-muted">-</span>
                  </td>
                  <td class="col-egreso">
                    <span v-if="mov.egreso > 0" class="monto-egreso">
                      {{ formatMoneda(mov.egreso) }}
                    </span>
                    <span v-else class="text-muted">-</span>
                  </td>
                  <td class="col-acciones">
                    <v-btn
                      icon="mdi-check-circle-outline"
                      size="x-small"
                      variant="text"
                      color="success"
                      @click="marcar(mov.numero)"
                      :loading="store.loading"
                      title="Marcar como conciliado"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

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
import { useCuentasBancariasStore } from '../../stores/cuentasbancarias'
import { formatMoneda, formatFecha } from '../../utils/formatters'

const store = useConciliacionBancariaStore()
const cuentasStore = useCuentasBancariasStore()

const searchQuery = ref('')
const selectedNros = ref([])
const cuentaSeleccionada = ref(null)

// Solo cuentas ACTIVAS para el combobox
const cuentasActivas = computed(() =>
  cuentasStore.cuentas.filter(c => c.estado === 'ACTIVA')
)

// KPI calculados desde ingreso/egreso
const totalIngresos = computed(() =>
  store.movimientos.reduce((s, m) => s + parseFloat(m.ingreso || 0), 0)
)
const totalEgresos = computed(() =>
  store.movimientos.reduce((s, m) => s + parseFloat(m.egreso || 0), 0)
)

// Movimientos filtrados por búsqueda
const movimientosFiltrados = computed(() => {
  if (!searchQuery.value.trim()) return store.movimientos
  const q = searchQuery.value.toLowerCase()
  return store.movimientos.filter(m =>
    (m.numero && m.numero.toLowerCase().includes(q)) ||
    (m.beneficia && m.beneficia.toLowerCase().includes(q)) ||
    (m.concepto && m.concepto.toLowerCase().includes(q)) ||
    (m.cheque && m.cheque.toLowerCase().includes(q))
  )
})

const todoSeleccionado = computed(() =>
  movimientosFiltrados.value.length > 0 &&
  selectedNros.value.length === movimientosFiltrados.value.length
)

// Al cambiar cuenta → cargar movimientos
async function onCuentaChange(codigo) {
  selectedNros.value = []
  searchQuery.value = ''
  if (codigo) {
    store.setBanco(codigo)
    await store.fetchMovimientos()
  } else {
    store.setBanco(null)
  }
}

async function recargar() {
  if (!cuentaSeleccionada.value) return
  selectedNros.value = []
  await store.fetchMovimientos()
}

function toggleSeleccion(numero) {
  const idx = selectedNros.value.indexOf(numero)
  if (idx >= 0) selectedNros.value.splice(idx, 1)
  else selectedNros.value.push(numero)
}

function toggleTodos() {
  if (todoSeleccionado.value) {
    selectedNros.value = []
  } else {
    selectedNros.value = movimientosFiltrados.value.map(m => m.numero)
  }
}

async function marcar(numero) {
  try {
    await store.marcarConciliado(numero)
    const idx = selectedNros.value.indexOf(numero)
    if (idx >= 0) selectedNros.value.splice(idx, 1)
  } catch (err) {
    console.error('Error al conciliar:', err)
  }
}

async function marcarSeleccionados() {
  try {
    store.setSelectedIds(selectedNros.value)
    await store.marcarMultiplesConciliados()
    selectedNros.value = []
  } catch (err) {
    console.error('Error al conciliar múltiples:', err)
  }
}

onMounted(async () => {
  await cuentasStore.fetchCuentas()
})
</script>

<style scoped>
.view-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 12px; font-weight: 700; color: #06b6d4; text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.3); }
.bc-cat { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.8); font-weight: 500; }

.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.header-left { display: flex; align-items: center; gap: 16px; }
.header-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#06b6d4,#0891b2); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(6,182,212,0.35); }
.page-title { font-size: 20px; font-weight: 800; margin: 0; }
.page-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 2px 0 0; }

/* SELECTOR CUENTA */
.cuenta-selector-wrap { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface), 0.08); border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center; gap: 16px; }
.cuenta-selector-label { font-size: 13px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.7); white-space: nowrap; display: flex; align-items: center; }
.cuenta-select { flex: 1; max-width: 540px; }
.selected-cuenta { display: flex; align-items: center; }
.selected-nombre { font-weight: 600; font-size: 14px; }
.selected-banco { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.5); }

/* EMPTY STATE */
.empty-state-cuenta { background: rgb(var(--v-theme-surface)); border: 1px dashed rgba(var(--v-theme-on-surface), 0.15); border-radius: 12px; padding: 60px 24px; text-align: center; }
.empty-state-icon { color: rgba(var(--v-theme-on-surface), 0.2); display: block; margin: 0 auto 16px; }
.empty-state-title { font-size: 16px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); margin: 0 0 8px; }
.empty-state-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.35); margin: 0; }

/* KPI */
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
.kpi-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface), 0.08); border-radius: 12px; padding: 20px; text-align: center; }
.kpi-pendiente { border-left: 3px solid #06b6d4; }
.kpi-ingreso { border-left: 3px solid #10b981; }
.kpi-egreso { border-left: 3px solid #f59e0b; }
.kpi-label { font-size: 11px; font-weight: 700; color: rgba(var(--v-theme-on-surface), 0.5); text-transform: uppercase; letter-spacing: 0.5px; }
.kpi-value { font-size: 26px; font-weight: 800; color: #06b6d4; margin: 8px 0; }
.kpi-verde { color: #10b981 !important; }
.kpi-ambar { color: #f59e0b !important; }
.kpi-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.6); }

/* TABLA */
.tabla-container { background: rgb(var(--v-theme-surface)); border-radius: 12px; border: 1px solid rgba(var(--v-theme-on-surface), 0.08); }
.tabla-header { display: flex; align-items: center; padding: 16px 20px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08); }
.search-bar { display: flex; align-items: center; flex: 1; gap: 8px; padding: 8px 12px; background: rgba(var(--v-theme-on-surface), 0.03); border-radius: 8px; border: 1px solid rgba(var(--v-theme-on-surface), 0.08); }
.search-icon { color: rgba(var(--v-theme-on-surface), 0.4); }
.search-input { flex: 1; border: none; background: transparent; outline: none; font-size: 14px; color: rgb(var(--v-theme-on-surface)); }
.search-input::placeholder { color: rgba(var(--v-theme-on-surface), 0.4); }

.tabla-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table thead { background: rgba(var(--v-theme-on-surface), 0.04); }
.data-table thead th { padding: 12px 10px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface), 0.6); border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08); white-space: nowrap; }
.data-table tbody tr { border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); }
.data-table tbody tr:hover { background: rgba(var(--v-theme-on-surface), 0.02); }
.data-table tbody td { padding: 10px 10px; color: rgb(var(--v-theme-on-surface)); vertical-align: middle; }
.row-selected { background: rgba(6, 182, 212, 0.06) !important; }

.col-checkbox { width: 36px; }
.col-checkbox input { cursor: pointer; }
.col-numero { width: 130px; }
.col-fecha { width: 95px; white-space: nowrap; }
.col-beneficia { width: 18%; }
.col-concepto { }
.col-cheque { width: 110px; }
.col-ingreso { width: 120px; text-align: right; }
.col-egreso { width: 120px; text-align: right; }
.col-acciones { width: 60px; text-align: center; }

.badge-numero { background: rgba(6,182,212,0.12); color: #06b6d4; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 11px; font-family: 'Courier New', monospace; }
.badge-cheque { background: rgba(var(--v-theme-on-surface),0.07); color: rgba(var(--v-theme-on-surface),0.7); padding: 2px 7px; border-radius: 5px; font-size: 12px; font-family: 'Courier New', monospace; }

.monto-ingreso { font-weight: 700; color: #10b981; font-family: 'Courier New', monospace; }
.monto-egreso { font-weight: 700; color: #f59e0b; font-family: 'Courier New', monospace; }
.text-muted { color: rgba(var(--v-theme-on-surface), 0.3); font-size: 12px; }

.tabla-empty { text-align: center !important; padding: 40px !important; }
.empty-icon { color: rgba(var(--v-theme-on-surface), 0.2); display: block; margin: 0 auto 8px; }
.empty-text { color: rgba(var(--v-theme-on-surface), 0.4); font-size: 14px; margin: 0; }
</style>
