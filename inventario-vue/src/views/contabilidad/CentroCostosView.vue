<template>
  <MainLayout>
    <PageHeader
      title="Centros de Costos"
      description="Administra los centros de costos de tu empresa"
      :crumbs="['Contabilidad', 'Configuración', 'Centros de Costos']"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" size="large" prepend-icon="mdi-plus" @click="abrirCrear">
          Nuevo centro de costos
        </v-btn>
      </template>
    </PageHeader>

    <!-- KPI CARDS -->
    <div class="kpi-grid mb-5">
      <KpiCard
        v-for="(kpi, i) in kpis"
        :key="kpi.label"
        :index="i"
        :label="kpi.label"
        :value="kpi.value"
        :icon="kpi.icon"
        :color="kpi.color"
        :value-color="kpi.color"
      />
    </div>

    <!-- ERROR BANNER -->
    <v-alert
      v-if="store.error"
      type="warning"
      variant="tonal"
      density="compact"
      closable
      class="mb-4"
      @click:close="store.clearError()"
    >
      {{ store.error }}
    </v-alert>

    <!-- TABLA -->
    <CentroCostosTable @editar="handleEditar" />

    <!-- FORMULARIO MODAL -->
    <CentroCostosForm
      :open="dialogForm"
      :centro-costos="ccEditando"
      @update:open="dialogForm = $event"
      @close="ccEditando = null"
      @guardar="handleGuardar"
    />
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import CentroCostosTable from '../../components/modules/contabilidad/CentroCostosTable.vue'
import CentroCostosForm from '../../components/modules/contabilidad/CentroCostosForm.vue'
import KpiCard from '../../components/common/KpiCard.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import { useCentroCostosStore } from '../../stores/centrocostos'

const store = useCentroCostosStore()

const dialogForm = ref(false)
const ccEditando = ref(null)

// ─── KPI CARDS ───────────────────────────────────────

const kpis = computed(() => [
  {
    label: 'Total Centros de Costos',
    value: store.totalCentrosCostos,
    icon: 'mdi-sitemap-outline',
    color: 'var(--indigo)',
  },
  {
    label: 'Total Activos',
    value: store.centrosCostos.filter(c => (c.activo || 'SI') !== 'NO').length,
    icon: 'mdi-check-circle-outline',
    color: 'var(--success)',
  },
  {
    label: 'Total Inactivos',
    value: store.centrosCostos.filter(c => (c.activo || 'SI') === 'NO').length,
    icon: 'mdi-minus-circle-outline',
    color: 'var(--ink-400)',
  },
])

// ─── MÉTODOS ─────────────────────────────────────────

function abrirCrear() {
  ccEditando.value = null
  dialogForm.value = true
}

function handleEditar(cc) {
  ccEditando.value = cc
  dialogForm.value = true
}

function handleGuardar(cc) {
  console.log('Centro de costos guardado:', cc)
}

// ─── LIFECYCLE ───────────────────────────────────────

onMounted(async () => {
  try {
    await store.fetchCentrosCostos()
  } catch (err) {
    store.cargarDatosEjemplo()
  }
})
</script>

<style scoped>
/* KPI */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
</style>
