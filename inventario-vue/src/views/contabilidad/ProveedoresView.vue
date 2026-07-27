<template>
  <MainLayout>
    <PageHeader
      title="Gestión de Proveedores"
      description="Administra el registro de proveedores de tu empresa"
      :crumbs="['Contabilidad', 'Configuración', 'Proveedores']"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" size="large" prepend-icon="mdi-plus" @click="abrirCrear">
          Nuevo proveedor
        </v-btn>
      </template>
    </PageHeader>

    <!-- KPI CARDS -->
    <div class="kpi-grid mb-5">
      <KpiCard v-for="(kpi, i) in kpis" :key="kpi.label" :index="i" :label="kpi.label" :value="kpi.value" :icon="kpi.icon" :color="kpi.color" :value-color="kpi.color" />
    </div>

    <!-- TABLA DE PROVEEDORES -->
    <ProveedoresTable
      ref="tableComponent"
      @editar="handleEditar"
    />

    <!-- FORMULARIO MODAL -->
    <ProveedoresForm
      :open="dialogForm"
      :proveedor="proveedorEditando"
      @update:open="dialogForm = $event"
      @close="proveedorEditando = null"
      @guardar="handleGuardarProveedor"
    />

    <!-- LOADING OVERLAY -->
    <v-overlay
      v-model="store.loading"
      class="align-center justify-center"
      contained
    >
      <v-progress-circular
        indeterminate
        color="primary"
        size="50"
      />
    </v-overlay>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import ProveedoresTable from '../../components/modules/contabilidad/ProveedoresTable.vue'
import ProveedoresForm from '../../components/modules/contabilidad/ProveedoresForm.vue'
import KpiCard from '../../components/common/KpiCard.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import { useProveedoresStore } from '../../stores/proveedores'

const store = useProveedoresStore()
const tableComponent = ref(null)

const dialogForm = ref(false)
const proveedorEditando = ref(null)

// ─── COMPUTED ────────────────────────────────────────

const kpis = computed(() => [
  {
    label: 'Total Proveedores',
    value: formatEntero(store.totalProveedores),
    icon: 'mdi-truck-outline',
    color: 'var(--indigo)',
  },
  {
    label: 'Activos',
    value: formatEntero(store.proveedoresActivos.length),
    icon: 'mdi-check-circle-outline',
    color: 'var(--success)',
  },
  {
    label: 'Inactivos',
    value: formatEntero(store.proveedoresInactivos.length),
    icon: 'mdi-minus-circle-outline',
    color: 'var(--ink-400)',
  },
  {
    label: 'Últimos 7 días',
    value: '3',
    icon: 'mdi-calendar-check-outline',
    color: 'var(--info)',
  },
])

// ─── METHODS ─────────────────────────────────────────

function abrirCrear() {
  proveedorEditando.value = null
  dialogForm.value = true
}

function handleEditar(proveedor) {
  proveedorEditando.value = proveedor
  dialogForm.value = true
}

async function handleGuardarProveedor() {
  try {
    // Recargar lista para reflejar cambios
    await store.fetchProveedores()
  } catch (error) {
    console.error('Error recargando proveedores:', error)
    // Aunque hay error, la lista local debería estar actualizada del store
  }
}

async function cargarDatos() {
  // Intentar cargar del API
  try {
    await store.fetchProveedores()
  } catch (error) {
    console.warn('No se pudo conectar a la API, cargando datos de ejemplo:', error)
    // Cargar datos de ejemplo
    store.cargarDatosEjemplo()
  }
}

function formatEntero(n) {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

// ─── LIFECYCLE ───────────────────────────────────────

onMounted(async () => {
  await cargarDatos()
})
</script>

<style scoped>
/* KPI CARDS */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
</style>
