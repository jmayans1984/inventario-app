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

    <!-- GASTOS POR CENTRO DE COSTO CON COMPARACIÓN -->
    <div class="kpi-grid">
      <div v-for="(item, idx) in store.gastosPorCCostoConComparacion" :key="idx" class="ccosto-card">
        <div class="ccosto-header">
          <h3 class="ccosto-name">{{ item.ccostoNombre }}</h3>
          <div class="ccosto-comparison" :class="`trend-${item.indicador}`">
            <v-icon size="16" class="trend-icon">
              {{ item.indicador === 'up' ? 'mdi-arrow-up' : item.indicador === 'down' ? 'mdi-arrow-down' : 'mdi-minus' }}
            </v-icon>
            <span class="trend-text">{{ Math.abs(item.porcentaje) }}%</span>
          </div>
        </div>
        <div class="ccosto-amount">{{ formatMoneda(item.totalActual) }}</div>
        <div class="ccosto-subtitle">
          vs {{ formatMoneda(item.totalPasado) }} mes pasado
        </div>
      </div>
      <div v-if="store.gastosPorCCostoConComparacion.length === 0" class="empty-state-grid">
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

/* CENTRO DE COSTO CARDS */
.ccosto-card {
  padding: 20px;
  background: var(--surface-secondary);
  border-radius: 12px;
  border-left: 4px solid var(--indigo);
  transition: all 200ms ease;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ccosto-card:hover {
  background: var(--surface-tertiary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.ccosto-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.ccosto-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
}

.ccosto-comparison {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.ccosto-comparison.trend-up {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.ccosto-comparison.trend-down {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.ccosto-comparison.trend-equal {
  background: rgba(156, 163, 175, 0.1);
  color: #6b7280;
}

.trend-icon {
  font-size: 14px;
}

.ccosto-amount {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.ccosto-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
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
