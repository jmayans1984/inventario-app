<template>
  <MainLayout>
    <!-- BREADCRUMB -->
    <div class="breadcrumb-bar mb-4">
      <span class="bc-root">CONTABILIDAD</span>
      <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
      <span class="bc-section">Configuración</span>
      <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
      <span class="bc-item">Centros de Costos</span>
    </div>

    <!-- HEADER -->
    <div class="header-section mb-5">
      <div class="header-left">
        <h1 class="header-title">Centros de Costos</h1>
        <p class="header-desc">Administra los centros de costos de tu empresa</p>
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
          Nuevo Centro de Costos
        </v-btn>
      </div>
    </div>

    <!-- KPI CARDS -->
    <v-row class="mb-5" dense>
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="12" sm="4">
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
    color: '#667eea',
  },
  {
    label: 'Total Activos',
    value: store.centrosCostos.filter(c => (c.activo || 'SI') !== 'NO').length,
    icon: 'mdi-check-circle-outline',
    color: '#22c55e',
  },
  {
    label: 'Total Inactivos',
    value: store.centrosCostos.filter(c => (c.activo || 'SI') === 'NO').length,
    icon: 'mdi-minus-circle-outline',
    color: '#94a3b8',
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
.breadcrumb-bar { display: flex; align-items: center; gap: 6px; }

.bc-root {
  font-size: 11px; font-weight: 800; letter-spacing: 1px;
  color: rgba(var(--v-theme-on-surface), 0.4); text-transform: uppercase;
}
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.25); }
.bc-section { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-item { font-size: 11px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
}
.header-left { flex: 1; min-width: 250px; }

.header-title {
  font-size: 28px; font-weight: 900; letter-spacing: -0.5px;
  color: rgb(var(--v-theme-on-surface)); margin: 0; line-height: 1.1;
}
.header-desc {
  font-size: 14px; color: rgba(var(--v-theme-on-surface), 0.5); margin-top: 6px;
}
.header-right { display: flex; gap: 12px; flex-wrap: wrap; }
.btn-crear { min-width: 200px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; font-size: 12px; }

/* KPI */
.kpi-card {
  background: rgb(var(--v-theme-surface));
  transition: all 0.2s;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.kpi-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }
.kpi-label { font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface), 0.4); margin: 0; }
.kpi-value { font-size: 28px; font-weight: 900; margin: 8px 0 0; line-height: 1; }
.kpi-icon-wrap { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

@media (max-width: 768px) {
  .header-section { flex-direction: column; }
  .header-title { font-size: 20px; }
  .btn-crear { width: 100%; }
}
</style>
