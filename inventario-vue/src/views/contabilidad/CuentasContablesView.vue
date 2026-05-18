<template>
  <div class="page-container">
    <!-- HEADER -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Cuentas Contables</h1>
        <p class="page-subtitle">Gestiona tu catálogo de cuentas contables</p>
      </div>
      <v-btn
        size="large"
        color="primary"
        variant="elevated"
        prepend-icon="mdi-plus"
        @click="abrirFormulario()"
      >
        Nueva Cuenta
      </v-btn>
    </div>

    <!-- KPI CARDS -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon" style="background: linear-gradient(135deg, #667eea, #764ba2)">
          <v-icon size="24" color="white">mdi-calculator-variant</v-icon>
        </div>
        <div class="kpi-content">
          <p class="kpi-label">Total Cuentas</p>
          <p class="kpi-value">{{ store.totalCuentasContables }}</p>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background: linear-gradient(135deg, #34d399, #10b981)">
          <v-icon size="24" color="white">mdi-check-circle</v-icon>
        </div>
        <div class="kpi-content">
          <p class="kpi-label">Activas</p>
          <p class="kpi-value">{{ cuentasActivas }}</p>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background: linear-gradient(135deg, #f59e0b, #d97706)">
          <v-icon size="24" color="white">mdi-alert-circle</v-icon>
        </div>
        <div class="kpi-content">
          <p class="kpi-label">Inactivas</p>
          <p class="kpi-value">{{ cuentasInactivas }}</p>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed)">
          <v-icon size="24" color="white">mdi-chart-line</v-icon>
        </div>
        <div class="kpi-content">
          <p class="kpi-label">Grupos Gastos</p>
          <p class="kpi-value">{{ gruposGastosUnicos }}</p>
        </div>
      </div>
    </div>

    <!-- TABLA -->
    <div class="table-section">
      <CuentasContablesTable @edit="abrirFormulario" />
    </div>

    <!-- MODAL FORMULARIO -->
    <CuentasContablesForm
      :open="modalOpen"
      :cuenta-contable="cuentaEditando"
      @update:open="modalOpen = $event"
      @guardar="handleGuardar"
      @close="cuentaEditando = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCuentasContablesStore } from '../../stores/cuentascontables'
import CuentasContablesTable from '../../components/modules/contabilidad/CuentasContablesTable.vue'
import CuentasContablesForm from '../../components/modules/contabilidad/CuentasContablesForm.vue'

const store = useCuentasContablesStore()
const modalOpen = ref(false)
const cuentaEditando = ref(null)

onMounted(() => {
  store.fetchCuentasContables()
})

const cuentasActivas = computed(() => {
  return store.cuentasContables.filter(c => c.estado === 'ACTIVA').length
})

const cuentasInactivas = computed(() => {
  return store.cuentasContables.filter(c => c.estado === 'INACTIVA').length
})

const gruposGastosUnicos = computed(() => {
  const grupos = new Set(store.cuentasContables.map(c => c.grupo_gastos_codigo))
  return grupos.size
})

function abrirFormulario(cuenta = null) {
  cuentaEditando.value = cuenta
  modalOpen.value = true
}

function handleGuardar(resultado) {
  // El store ya actualiza automáticamente
  // Aquí podría ir lógica adicional si es necesaria
}
</script>

<style scoped>
.page-container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
  margin: 0 0 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.page-subtitle {
  font-size: 14px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin: 0;
}

/* KPI CARDS */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.kpi-card:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.12);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-content {
  flex: 1;
  min-width: 0;
}

.kpi-label {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  font-weight: 600;
  margin: 0 0 4px;
}

.kpi-value {
  font-size: 24px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}

.table-section {
  margin-top: 24px;
}
</style>
