<template>
  <MainLayout>
    <!-- BREADCRUMB -->
    <div class="breadcrumb-bar mb-4">
      <span class="bc-root">CONTABILIDAD</span>
      <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
      <span class="bc-section">Configuración</span>
      <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
      <span class="bc-item">Proveedores</span>
    </div>

    <!-- HEADER CON BOTÓN CREAR -->
    <div class="header-section mb-5">
      <div class="header-left">
        <h1 class="header-title">Gestión de Proveedores</h1>
        <p class="header-desc">Administra el registro de proveedores de tu empresa</p>
      </div>
      <div class="header-right">
        <v-btn
          color="primary"
          variant="elevated"
          size="large"
          prepend-icon="mdi-plus"
          @click="abrirCrear"
          class="btn-crear"
        >
          Nuevo Proveedor
        </v-btn>
      </div>
    </div>

    <!-- KPI CARDS -->
    <v-row class="mb-5" dense>
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="12" sm="6" lg="3">
        <v-card elevation="0" rounded="lg" class="kpi-card" :style="{ borderTop: `3px solid ${kpi.color}` }">
          <v-card-text class="pa-4">
            <div class="d-flex justify-space-between align-start">
              <div>
                <p class="kpi-label">{{ kpi.label }}</p>
                <p class="kpi-value" :style="{ color: kpi.color }">{{ kpi.value }}</p>
              </div>
              <div class="kpi-icon-wrap" :style="{ background: kpi.color + '18', color: kpi.color }">
                <v-icon size="24">{{ kpi.icon }}</v-icon>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

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
    color: '#667eea',
  },
  {
    label: 'Activos',
    value: formatEntero(store.proveedoresActivos.length),
    icon: 'mdi-check-circle-outline',
    color: '#22c55e',
  },
  {
    label: 'Inactivos',
    value: formatEntero(store.proveedoresInactivos.length),
    icon: 'mdi-minus-circle-outline',
    color: '#f59e0b',
  },
  {
    label: 'Últimos 7 días',
    value: '3',
    icon: 'mdi-calendar-check-outline',
    color: '#3b82f6',
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
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
}

.header-left {
  flex: 1;
  min-width: 250px;
}

.header-title {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: -0.5px;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
  line-height: 1.1;
}

.header-desc {
  font-size: 14px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin-top: 6px;
}

.header-right {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-crear {
  min-width: 180px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-size: 12px;
}

/* KPI CARDS */
.kpi-card {
  background: rgb(var(--v-theme-surface));
  transition: all 0.2s;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.kpi-card:hover {
  transform: translateY(-2px);
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08) !important;
}

.kpi-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.4);
  margin: 0;
}

.kpi-value {
  font-size: 28px;
  font-weight: 900;
  margin: 8px 0 0;
  line-height: 1;
}

.kpi-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
  }

  .header-title {
    font-size: 20px;
  }

  .btn-crear {
    width: 100%;
  }
}
</style>
