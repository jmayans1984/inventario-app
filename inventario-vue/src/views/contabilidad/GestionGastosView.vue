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

    <!-- TOP 5 CUENTAS CON MAYOR CONSUMO -->
    <div class="top5-section">
      <h3 class="section-title">Top 5 Cuentas - Este Mes</h3>
      <div class="top5-list">
        <div v-if="store.top5CuentasHoyMes.length === 0" class="empty-state">
          No hay gastos registrados este mes
        </div>
        <div v-for="(cuenta, idx) in store.top5CuentasHoyMes" :key="idx" class="top5-item">
          <div class="top5-rank">{{ idx + 1 }}</div>
          <div class="top5-name">{{ cuenta.nombre }}</div>
          <div class="top5-amount">{{ formatMoneda(cuenta.total) }}</div>
        </div>
      </div>
    </div>

    <!-- KPI CARDS - GASTOS POR CENTRO DE COSTO -->
    <div class="ccosto-section">
      <h3 class="section-title">Gastos por Centro de Costo - Este Mes</h3>
      <div class="kpi-grid">
        <KpiCard
          v-for="(ccosto, idx) in store.totalesPorCCostoHoyMes"
          :key="idx"
          :index="idx"
          :label="ccosto.nombre"
          :value="formatMoneda(ccosto.total)"
          icon="mdi-warehouse"
          :color="getColorByCCosto(idx)"
        />
        <div v-if="store.totalesPorCCostoHoyMes.length === 0" class="empty-state-grid">
          No hay centros de costo con gastos
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

/* TOP 5 CUENTAS */
.top5-section {
  margin-bottom: 32px;
  animation: fadeInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.top5-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.top5-item {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 12px 16px;
  background: var(--surface-secondary);
  border-radius: 8px;
  border-left: 4px solid var(--indigo);
  transition: all 200ms ease;
}

.top5-item:hover {
  background: var(--surface-tertiary);
  transform: translateX(4px);
}

.top5-rank {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--indigo);
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 12px;
}

.top5-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top5-amount {
  font-size: 13px;
  font-weight: 600;
  color: var(--indigo);
  text-align: right;
  white-space: nowrap;
}

.empty-state {
  padding: 24px 16px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
  background: var(--surface-secondary);
  border-radius: 8px;
  border-left: 4px solid var(--border-color);
}

/* CENTROS DE COSTO */
.ccosto-section {
  margin-bottom: 32px;
  animation: fadeInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
}

.empty-state-grid {
  grid-column: 1 / -1;
  padding: 40px 24px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
