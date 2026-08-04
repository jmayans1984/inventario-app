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

    <!-- TOP CUENTAS POR CENTRO DE COSTO -->
    <div class="kpi-grid">
      <KpiCard
        v-for="(item, idx) in store.topCuentasPorCCostoHoyMes"
        :key="idx"
        :index="idx"
        :label="`${item.ccostoNombre} - ${item.cuentaNombre}`"
        :value="formatMoneda(item.total)"
        icon="mdi-account-cash-outline"
        :color="getColorByCCosto(idx)"
      />
      <div v-if="store.topCuentasPorCCostoHoyMes.length === 0" class="empty-state-grid">
        No hay gastos registrados este mes
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

function getColorByCCosto(index) {
  const colors = ['var(--indigo)', 'var(--gold)', 'var(--success)', 'var(--info)']
  return colors[index % colors.length]
}
</script>

<style scoped>
/* ════════════════════════════════════════════════════════════════ */
/* KPI CARDS - MODERN ANIMATION                                    */
/* ════════════════════════════════════════════════════════════════ */

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
  animation: gridStagger 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes gridStagger {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.table-section {
  margin-top: 28px;
  animation: fadeInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-state-grid {
  grid-column: 1 / -1;
  padding: 40px 24px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
