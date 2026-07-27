<template>
  <MainLayout>
    <PageHeader
      title="Gestión de Gastos"
      description="Registra y controla los gastos de tu empresa"
      :crumbs="['Contabilidad', 'Procesos', 'Gestión de Gastos']"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" size="large" prepend-icon="mdi-plus" @click="abrirFormulario()">
          Nuevo gasto
        </v-btn>
      </template>
    </PageHeader>

    <!-- KPI CARDS -->
    <div class="kpi-grid">
      <KpiCard :index="0" label="Total Gastos" :value="store.totalGastos" icon="mdi-receipt-text-outline" color="var(--indigo)" />
      <KpiCard :index="1" label="Valor Total" :value="formatMoneda(store.valorTotal)" icon="mdi-currency-usd" color="var(--gold)" />
      <KpiCard :index="2" label="Impuestos" :value="formatMoneda(store.totalImpuestos)" icon="mdi-calculator" color="var(--success)" />
      <KpiCard :index="3" label="Este Mes" :value="formatMoneda(store.gastosMesActual)" icon="mdi-calendar-month-outline" color="var(--info)" />
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
import PageHeader from '../../components/common/PageHeader.vue'
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
