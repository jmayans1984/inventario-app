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
      <KpiCard label="Total Gastos" :value="store.totalGastos" icon="mdi-receipt-text-outline" color="var(--accent-blue)" />
      <KpiCard label="Valor Total" :value="formatMoneda(store.valorTotal)" icon="mdi-currency-usd" color="var(--accent-amber)" />
      <KpiCard label="Impuestos" :value="formatMoneda(store.totalImpuestos)" icon="mdi-calculator" color="var(--accent-green)" />
      <KpiCard label="Este Mes" :value="formatMoneda(store.gastosMesActual)" icon="mdi-calendar-month-outline" color="var(--accent-purple)" />
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
import KpiCard from '../../components/common/KpiCard.vue'
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

.table-section {
  margin-top: 24px;
}
</style>
