<template>
  <MainLayout>
    <!-- BREADCRUMB -->
    <div class="breadcrumb-bar mb-4">
      <span class="bc-root">CONTABILIDAD</span>
      <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
      <span class="bc-section">Configuración</span>
      <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
      <span class="bc-item">Cuentas Bancarias</span>
    </div>

    <!-- HEADER -->
    <div class="header-section mb-5">
      <div class="header-left">
        <h1 class="header-title">Cuentas Bancarias</h1>
        <p class="header-desc">Administra las cuentas bancarias de tu empresa</p>
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
          Nueva Cuenta
        </v-btn>
      </div>
    </div>

    <!-- KPI CARDS (3) -->
    <v-row class="mb-5" dense>
      <v-col cols="12" sm="4">
        <v-card elevation="0" rounded="lg" class="kpi-card" style="border-top: 3px solid #667eea">
          <v-card-text class="pa-4">
            <div class="d-flex justify-space-between align-start">
              <div>
                <p class="kpi-label">Total Cuentas</p>
                <p class="kpi-value" style="color:#667eea">{{ store.totalCuentas }}</p>
              </div>
              <div class="kpi-icon-wrap" style="background:#667eea18; color:#667eea">
                <v-icon size="24">mdi-bank-outline</v-icon>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="4">
        <v-card elevation="0" rounded="lg" class="kpi-card" style="border-top: 3px solid #22c55e">
          <v-card-text class="pa-4">
            <div class="d-flex justify-space-between align-start">
              <div>
                <p class="kpi-label">Total Activas</p>
                <p class="kpi-value" style="color:#22c55e">{{ store.cuentasActivas.length }}</p>
              </div>
              <div class="kpi-icon-wrap" style="background:#22c55e18; color:#22c55e">
                <v-icon size="24">mdi-check-circle-outline</v-icon>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="4">
        <v-card elevation="0" rounded="lg" class="kpi-card" style="border-top: 3px solid #94a3b8">
          <v-card-text class="pa-4">
            <div class="d-flex justify-space-between align-start">
              <div>
                <p class="kpi-label">Total Inactivas</p>
                <p class="kpi-value" style="color:#94a3b8">{{ store.cuentasInactivas.length }}</p>
              </div>
              <div class="kpi-icon-wrap" style="background:#94a3b818; color:#94a3b8">
                <v-icon size="24">mdi-minus-circle-outline</v-icon>
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
    <CuentasBancariasTable @editar="handleEditar" />

    <!-- FORMULARIO MODAL -->
    <CuentasBancariasForm
      :open="dialogForm"
      :cuenta="cuentaEditando"
      @update:open="dialogForm = $event"
      @close="cuentaEditando = null"
      @guardar="handleGuardar"
    />
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import CuentasBancariasTable from '../../components/modules/contabilidad/CuentasBancariasTable.vue'
import CuentasBancariasForm  from '../../components/modules/contabilidad/CuentasBancariasForm.vue'
import { useCuentasBancariasStore } from '../../stores/cuentasbancarias'

const store = useCuentasBancariasStore()

const dialogForm    = ref(false)
const cuentaEditando = ref(null)

function abrirCrear() {
  cuentaEditando.value = null
  dialogForm.value = true
}

function handleEditar(cuenta) {
  cuentaEditando.value = cuenta
  dialogForm.value = true
}

function handleGuardar(cuenta) {
  console.log('Cuenta guardada:', cuenta)
}

onMounted(async () => {
  try {
    await store.fetchCuentas()
  } catch {
    store.cargarDatosEjemplo()
  }
})
</script>

<style scoped>
.breadcrumb-bar { display: flex; align-items: center; gap: 6px; }
.bc-root { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: rgba(var(--v-theme-on-surface), 0.4); text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.25); }
.bc-section { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-item { font-size: 11px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }

.header-section { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; flex-wrap: wrap; }
.header-left { flex: 1; min-width: 250px; }
.header-title { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; color: rgb(var(--v-theme-on-surface)); margin: 0; line-height: 1.1; }
.header-desc { font-size: 14px; color: rgba(var(--v-theme-on-surface), 0.5); margin-top: 6px; }
.header-right { display: flex; gap: 12px; }
.btn-crear { font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; font-size: 12px; }

.kpi-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface), 0.08); transition: all 0.2s; }
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
