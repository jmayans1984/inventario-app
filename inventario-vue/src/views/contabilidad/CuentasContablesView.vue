<template>
  <MainLayout>
    <PageHeader
      title="Cuentas Contables"
      description="Administra tu catálogo de cuentas contables"
      :crumbs="['Contabilidad', 'Configuración', 'Cuentas Contables']"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" size="large" prepend-icon="mdi-plus" @click="abrirFormulario()">
          Nueva cuenta
        </v-btn>
      </template>
    </PageHeader>

    <!-- KPI CARDS -->
    <div class="kpi-grid">
      <KpiCard :index="0" label="Total Cuentas" :value="store.totalCuentasContables" icon="mdi-calculator-variant" color="var(--indigo)" />
      <KpiCard :index="1" label="Activas" :value="cuentasActivas" icon="mdi-check-circle" color="var(--success)" />
      <KpiCard :index="2" label="Inactivas" :value="cuentasInactivas" icon="mdi-alert-circle" color="var(--warning)" />
      <KpiCard :index="3" label="Grupos Gastos" :value="gruposGastosUnicos" icon="mdi-chart-line" color="var(--gold)" />
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
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { useCuentasContablesStore } from '../../stores/cuentascontables'
import CuentasContablesTable from '../../components/modules/contabilidad/CuentasContablesTable.vue'
import CuentasContablesForm from '../../components/modules/contabilidad/CuentasContablesForm.vue'
import KpiCard from '../../components/common/KpiCard.vue'
import PageHeader from '../../components/common/PageHeader.vue'

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
