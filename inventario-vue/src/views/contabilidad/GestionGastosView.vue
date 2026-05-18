<template>
  <MainLayout>
    <!-- BREADCRUMB -->
    <div class="breadcrumb-bar mb-4">
      <span class="bc-root">CONTABILIDAD</span>
      <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
      <span class="bc-section">Procesos</span>
      <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
      <span class="bc-item">Gestión de Gastos</span>
    </div>

    <!-- HEADER -->
    <div class="header-section mb-5">
      <div class="header-left">
        <h1 class="header-title">Gestión de Gastos</h1>
        <p class="header-desc">Registra y controla los gastos de tu empresa</p>
      </div>
      <div class="header-right">
        <v-btn
          color="primary"
          variant="elevated"
          size="large"
          prepend-icon="mdi-plus"
          @click="abrirFormulario()"
          class="btn-crear"
        >
          Nuevo Gasto
        </v-btn>
      </div>
    </div>

    <!-- KPI CARDS -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon" style="background: linear-gradient(135deg, #667eea, #764ba2)">
          <v-icon size="24" color="white">mdi-receipt-text-outline</v-icon>
        </div>
        <div class="kpi-content">
          <p class="kpi-label">Total Gastos</p>
          <p class="kpi-value">{{ store.totalGastos }}</p>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background: linear-gradient(135deg, #f59e0b, #d97706)">
          <v-icon size="24" color="white">mdi-currency-usd</v-icon>
        </div>
        <div class="kpi-content">
          <p class="kpi-label">Valor Total</p>
          <p class="kpi-value">{{ formatMoneda(store.valorTotal) }}</p>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background: linear-gradient(135deg, #34d399, #10b981)">
          <v-icon size="24" color="white">mdi-calculator</v-icon>
        </div>
        <div class="kpi-content">
          <p class="kpi-label">Impuestos</p>
          <p class="kpi-value">{{ formatMoneda(store.totalImpuestos) }}</p>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed)">
          <v-icon size="24" color="white">mdi-calendar-month-outline</v-icon>
        </div>
        <div class="kpi-content">
          <p class="kpi-label">Este Mes</p>
          <p class="kpi-value">{{ formatMoneda(store.gastosMesActual) }}</p>
        </div>
      </div>
    </div>

    <!-- TABLA -->
    <div class="table-section">
      <GestionGastosTable @edit="abrirFormulario" />
    </div>

    <!-- MODAL FORMULARIO -->
    <GestionGastosForm
      :open="modalOpen"
      :gasto="gastoEditando"
      @update:open="modalOpen = $event"
      @guardar="handleGuardar"
      @close="gastoEditando = null"
    />
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { useGestionGastosStore } from '../../stores/gestiongastos'
import GestionGastosTable from '../../components/modules/contabilidad/GestionGastosTable.vue'
import GestionGastosForm from '../../components/modules/contabilidad/GestionGastosForm.vue'
import { formatMoneda } from '../../utils/formatters'

const store = useGestionGastosStore()
const modalOpen = ref(false)
const gastoEditando = ref(null)

onMounted(() => {
  store.fetchGastos()
})

function abrirFormulario(gasto = null) {
  gastoEditando.value = gasto
  modalOpen.value = true
}

function handleGuardar(resultado) {
  // El store ya actualiza automáticamente
}
</script>

<style scoped>
/* BREADCRUMB */
.breadcrumb-bar {
  display: flex;
  align-items: center;
  gap: 6px;
}
.bc-root {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  text-transform: uppercase;
}
.bc-sep {
  color: rgba(var(--v-theme-on-surface), 0.25);
}
.bc-section {
  font-size: 11px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.5);
}
.bc-item {
  font-size: 11px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}

/* HEADER */
.header-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.header-left {
  flex: 1;
}
.header-title {
  font-size: 24px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
  margin: 0 0 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.header-desc {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin: 0;
}
.header-right {
  display: flex;
  gap: 12px;
}
.btn-crear {
  white-space: nowrap;
}

/* KPI CARDS */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}
.kpi-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
}
.kpi-card:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.12);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.kpi-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.kpi-content {
  flex: 1;
}
.kpi-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin: 0;
}
.kpi-value {
  font-size: 20px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
  margin: 4px 0 0;
}

.table-section {
  margin-top: 24px;
}
</style>
