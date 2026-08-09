<template>
  <MainLayout>
    <div class="view-container">
      <PageHeader
        title="Conciliación de Cuentas"
        description="Selecciona una cuenta y marca los movimientos como conciliados"
        :crumbs="['Tesorería', 'Procesos', 'Conciliación de Cuentas']"
      >
        <template #actions>
          <v-btn
            v-if="selectedNros.length > 0"
            color="success"
            prepend-icon="mdi-check-all"
            @click="marcarSeleccionados"
            :loading="store.loading"
          >
            Conciliar {{ selectedNros.length }}
          </v-btn>
        </template>
      </PageHeader>

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
        />
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
          <KpiCard :index="0" label="Saldo Inicial Conciliado" :value="formatMoneda(store.saldoInicialConciliado)" icon="mdi-bank-check" color="var(--indigo)" hint="Balance ya conciliado" />
          <KpiCard :index="1" label="Ingresos por Conciliar" :value="formatMoneda(store.ingresosPendientes)" icon="mdi-arrow-down-circle" color="var(--success)" :hint="`${store.movimientos.filter(m => m.ingreso > 0 && m.conciliado !== 'SI').length} movimientos`" />
          <KpiCard :index="2" label="Egresos por Conciliar" :value="formatMoneda(store.egresosPendientes)" icon="mdi-arrow-up-circle" color="var(--gold)" :hint="`${store.movimientos.filter(m => m.egreso > 0 && m.conciliado !== 'SI').length} movimientos`" />
          <KpiCard
            :index="3"
            label="Saldo Final Conciliado"
            :value="formatMoneda(store.saldoFinalConciliado)"
            icon="mdi-scale-balance"
            :color="store.saldoFinalConciliado >= 0 ? 'var(--success)' : 'var(--error)'"
            :value-color="store.saldoFinalConciliado >= 0 ? 'var(--success)' : 'var(--error)'"
            hint="Si se concilian todos"
          />
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
            <div class="toggle-conciliados-wrap">
              <label class="toggle-conciliados-label">
                <input
                  type="checkbox"
                  v-model="mostrarConciliados"
                  @change="onToggleConciliados"
                  class="toggle-check"
                />
                <span class="toggle-track" :class="{ 'toggle-track--on': mostrarConciliados }">
                  <span class="toggle-thumb" />
                </span>
                <span class="toggle-text">Mostrar conciliados</span>
              </label>
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
                      :disabled="pendientesFiltrados.length === 0"
                    />
                  </th>
                  <th class="col-numero">NÚMERO</th>
                  <th class="col-fecha">FECHA</th>
                  <th class="col-beneficia">BENEFICIARIO</th>
                  <th class="col-concepto">CONCEPTO</th>
                  <th class="col-cheque">CHEQUE / REF</th>
                  <th class="col-ingreso">INGRESO</th>
                  <th class="col-egreso">EGRESO</th>
                  <th v-if="mostrarConciliados" class="col-estado">ESTADO</th>
                  <th class="col-acciones">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="store.loading">
                  <td :colspan="mostrarConciliados ? 10 : 9" class="tabla-empty">
                    <v-progress-circular indeterminate color="primary" size="28" />
                    <p class="empty-text mt-2">Cargando movimientos...</p>
                  </td>
                </tr>
                <tr v-else-if="movimientosFiltrados.length === 0">
                  <td :colspan="mostrarConciliados ? 10 : 9" class="tabla-empty">
                    <v-icon size="32" class="empty-icon">mdi-check-circle-outline</v-icon>
                    <p class="empty-text">No hay movimientos pendientes de conciliar</p>
                  </td>
                </tr>
                <tr
                  v-for="mov in movimientosFiltrados"
                  :key="mov.numero"
                  class="tabla-row"
                  :class="{
                    'row-selected': selectedNros.includes(mov.numero),
                    'row-conciliado': mov.conciliado === 'SI'
                  }"
                >
                  <td class="col-checkbox">
                    <input
                      type="checkbox"
                      :checked="selectedNros.includes(mov.numero)"
                      :disabled="mov.conciliado === 'SI'"
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
                  <td v-if="mostrarConciliados" class="col-estado">
                    <v-chip
                      :color="mov.conciliado === 'SI' ? 'success' : 'warning'"
                      variant="flat"
                      size="small"
                    >
                      {{ mov.conciliado === 'SI' ? 'CONCILIADO' : 'PENDIENTE' }}
                    </v-chip>
                  </td>
                  <td class="col-acciones">
                    <v-btn
                      v-if="mov.conciliado !== 'SI'"
                      icon="mdi-check-circle-outline"
                      size="x-small"
                      variant="text"
                      color="success"
                      @click="marcar(mov.numero)"
                      :loading="store.loading"
                      title="Marcar como conciliado"
                    />
                    <v-btn
                      v-else
                      icon="mdi-close-circle-outline"
                      size="x-small"
                      variant="text"
                      color="warning"
                      @click="revertir(mov.numero)"
                      :loading="store.loading"
                      title="Revertir a pendiente"
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
import PageHeader from '../../components/common/PageHeader.vue'
import KpiCard from '../../components/common/KpiCard.vue'
import { useConciliacionBancariaStore } from '../../stores/conciliacion-bancaria'
import { useCuentasBancariasStore } from '../../stores/cuentasbancarias'
import { formatMoneda, formatFecha } from '../../utils/formatters'

const store = useConciliacionBancariaStore()
const cuentasStore = useCuentasBancariasStore()

const searchQuery = ref('')
const selectedNros = ref([])
const cuentaSeleccionada = ref(null)
const mostrarConciliados = ref(false)

// Solo cuentas ACTIVAS para el combobox
const cuentasActivas = computed(() =>
  cuentasStore.cuentas.filter(c => c.estado === 'ACTIVA')
)

// Todos los movimientos filtrados por búsqueda (incluye conciliados si el toggle está ON)
const movimientosFiltrados = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return store.movimientos
  return store.movimientos.filter(m =>
    (m.numero && String(m.numero).toLowerCase().includes(q)) ||
    (m.beneficia && m.beneficia.toLowerCase().includes(q)) ||
    (m.concepto && m.concepto.toLowerCase().includes(q)) ||
    (m.cheque && String(m.cheque).toLowerCase().includes(q))
  )
})

// Solo pendientes dentro de los filtrados (para checkbox header y bulk action)
const pendientesFiltrados = computed(() =>
  movimientosFiltrados.value.filter(m => m.conciliado !== 'SI')
)

const todoSeleccionado = computed(() =>
  pendientesFiltrados.value.length > 0 &&
  selectedNros.value.length === pendientesFiltrados.value.length
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
    selectedNros.value = pendientesFiltrados.value.map(m => m.numero)
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

async function revertir(numero) {
  try {
    await store.marcarPendiente(numero)
  } catch (err) {
    console.error('Error al revertir:', err)
  }
}

async function onToggleConciliados() {
  selectedNros.value = []
  store.setIncluyeConciliados(mostrarConciliados.value)
  if (cuentaSeleccionada.value) {
    await store.fetchMovimientos()
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

/* SELECTOR CUENTA */
.cuenta-selector-wrap { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface), 0.08); border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center; gap: 16px; }
.cuenta-selector-label { font-size: 13px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.7); white-space: nowrap; display: flex; align-items: center; }
.cuenta-select { flex: 1; max-width: 400px; }

/* EMPTY STATE */
.empty-state-cuenta { background: rgb(var(--v-theme-surface)); border: 1px dashed rgba(var(--v-theme-on-surface), 0.15); border-radius: 12px; padding: 60px 24px; text-align: center; }
.empty-state-icon { color: rgba(var(--v-theme-on-surface), 0.2); display: block; margin: 0 auto 16px; }
.empty-state-title { font-size: 16px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); margin: 0 0 8px; }
.empty-state-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.35); margin: 0; }

/* KPI */
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
@media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 500px) { .kpi-grid { grid-template-columns: 1fr; } }

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
.row-selected { background: var(--indigo-wash) !important; }

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

.badge-numero { background: var(--indigo-wash); color: var(--indigo); padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 11px; font-variant-numeric: tabular-nums; }
.badge-cheque { background: rgba(var(--v-theme-on-surface),0.07); color: rgba(var(--v-theme-on-surface),0.7); padding: 2px 7px; border-radius: 5px; font-size: 12px; font-variant-numeric: tabular-nums; }

.monto-ingreso { font-weight: 700; color: var(--success); font-variant-numeric: tabular-nums; }
.monto-egreso { font-weight: 700; color: var(--gold); font-variant-numeric: tabular-nums; }
.text-muted { color: rgba(var(--v-theme-on-surface), 0.3); font-size: 12px; }

.tabla-empty { text-align: center !important; padding: 40px !important; }
.empty-icon { color: rgba(var(--v-theme-on-surface), 0.2); display: block; margin: 0 auto 8px; }
.empty-text { color: rgba(var(--v-theme-on-surface), 0.4); font-size: 14px; margin: 0; }

.col-estado { width: 120px; }
.row-conciliado td { opacity: 0.5; }
.row-conciliado:hover td { opacity: 0.7; }

/* Toggle "Mostrar conciliados" */
.toggle-conciliados-wrap { display: flex; align-items: center; padding: 0 12px; }
.toggle-conciliados-label { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; }
.toggle-check { position: absolute; opacity: 0; width: 0; height: 0; }
.toggle-track {
  position: relative; width: 34px; height: 18px;
  background: rgba(var(--v-theme-on-surface), 0.15);
  border-radius: 9px; transition: background 0.2s;
  flex-shrink: 0;
}
.toggle-track--on { background: rgb(var(--v-theme-success, 76, 175, 80)); }
.toggle-thumb {
  position: absolute; top: 2px; left: 2px;
  width: 14px; height: 14px; border-radius: 50%;
  background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.25);
  transition: left 0.2s;
}
.toggle-track--on .toggle-thumb { left: 18px; }
.toggle-text { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.7); white-space: nowrap; }
</style>
