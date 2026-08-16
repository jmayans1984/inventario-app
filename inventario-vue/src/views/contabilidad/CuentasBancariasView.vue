<template>
  <MainLayout>
    <PageHeader
      title="Cuentas Bancarias"
      description="Administra las cuentas bancarias de tu empresa"
      :crumbs="['Contabilidad', 'Configuración', 'Cuentas Bancarias']"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" size="large" prepend-icon="mdi-plus" @click="abrirCrear">
          Nueva cuenta
        </v-btn>
      </template>
    </PageHeader>

    <!-- KPI CARDS (3) -->
    <div class="kpi-grid mb-5">
      <KpiCard :index="0" label="Total Cuentas" :value="store.totalCuentas" icon="mdi-bank-outline" color="var(--indigo)" />
      <KpiCard :index="1" label="Total Activas" :value="store.cuentasActivas.length" icon="mdi-check-circle-outline" color="var(--success)" />
      <KpiCard :index="2" label="Total Inactivas" :value="store.cuentasInactivas.length" icon="mdi-minus-circle-outline" color="var(--ink-400)" />
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
import { useRoute } from 'vue-router'
import MainLayout from '../../components/layouts/MainLayout.vue'
import CuentasBancariasTable from '../../components/modules/contabilidad/CuentasBancariasTable.vue'
import CuentasBancariasForm  from '../../components/modules/contabilidad/CuentasBancariasForm.vue'
import KpiCard from '../../components/common/KpiCard.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import { useCuentasBancariasStore } from '../../stores/cuentasbancarias'

const store = useCuentasBancariasStore()
const route = useRoute()

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
  const buscar = route.query.buscar
  if (buscar) store.filters.search = String(buscar)
  try {
    await store.fetchCuentas()
  } catch {
    store.cargarDatosEjemplo()
  }
})
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
</style>
