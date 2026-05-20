<template>
  <MainLayout>
    <div class="view-container">
      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">TESORERÍA</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Procesos</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Importar Ventas</span>
      </div>

      <!-- HEADER -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon-wrap">
            <v-icon size="22" color="white">mdi-file-import-outline</v-icon>
          </div>
          <div>
            <h1 class="page-title">IMPORTAR VENTAS</h1>
            <p class="page-sub">Carga registros de ventas desde un archivo CSV</p>
          </div>
        </div>
      </div>

      <!-- PASO 1: SELECCIONAR ARCHIVO -->
      <div v-if="store.paso === 1" class="import-card">
        <div class="import-section">
          <v-icon size="48" class="import-icon">mdi-cloud-upload-outline</v-icon>
          <h3>Selecciona un archivo CSV</h3>
          <p class="import-subtitle">Arrastra tu archivo aquí o haz clic para seleccionar</p>

          <div class="drop-zone" @dragover.prevent @drop.prevent="handleDrop">
            <input
              ref="fileInput"
              type="file"
              accept=".csv"
              style="display: none"
              @change="handleFileSelect"
            />
            <v-btn
              variant="tonal"
              prepend-icon="mdi-folder-open"
              @click="fileInput?.click()"
              class="select-btn"
            >
              Seleccionar Archivo
            </v-btn>

            <div v-if="store.archivo" class="file-selected">
              <v-icon color="success" size="24">mdi-check-circle</v-icon>
              <span>{{ store.archivo.name }} ({{ formatFileSize(store.archivo.size) }})</span>
            </div>
          </div>

          <div class="button-group">
            <v-btn variant="text" @click="store.descargarPlantilla" prepend-icon="mdi-download">
              Descargar Plantilla
            </v-btn>
            <v-btn
              v-if="store.archivo"
              color="success"
              prepend-icon="mdi-check"
              :loading="store.validating"
              @click="validarArchivo"
              class="next-btn"
            >
              Validar
            </v-btn>
          </div>
        </div>
      </div>

      <!-- PASO 2: VALIDAR DATOS -->
      <div v-if="store.paso === 2" class="import-card">
        <div class="import-section">
          <div class="validation-summary">
            <div class="summary-item success">
              <v-icon size="28">mdi-check-circle</v-icon>
              <div>
                <span class="summary-label">Válidos</span>
                <span class="summary-value">{{ store.totalValidos }}</span>
              </div>
            </div>
            <div class="summary-item error">
              <v-icon size="28">mdi-alert-circle</v-icon>
              <div>
                <span class="summary-label">Errores</span>
                <span class="summary-value">{{ store.totalInvalidos }}</span>
              </div>
            </div>
            <div class="summary-item info">
              <v-icon size="28">mdi-information-outline</v-icon>
              <div>
                <span class="summary-label">Total</span>
                <span class="summary-value">{{ store.totalRegistros }}</span>
              </div>
            </div>
          </div>

          <!-- Mostrar errores -->
          <v-alert
            v-if="store.validationErrors.length > 0"
            type="error"
            closable
            class="validation-errors-card"
          >
            <div class="errors-list">
              <div v-for="error in store.validationErrors" :key="error.fila" class="error-item">
                <strong>Fila {{ error.fila }}:</strong>
                {{ error.errores.join('; ') }}
              </div>
            </div>
          </v-alert>

          <!-- Vista previa de registros válidos -->
          <div v-if="store.totalValidos > 0" class="preview-section">
            <h4>Vista previa de registros válidos</h4>
            <div class="table-wrapper">
              <table class="preview-table">
                <thead>
                  <tr>
                    <th>Fila</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Monto</th>
                    <th>Referencia</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(reg, idx) in store.registrosValidos.slice(0, 5)" :key="idx">
                    <td>{{ reg.fila }}</td>
                    <td>{{ reg.fecha }}</td>
                    <td>{{ reg.cliente }}</td>
                    <td class="amount">{{ formatMoneda(parseFloat(reg.monto)) }}</td>
                    <td>{{ reg.referencia || '-' }}</td>
                  </tr>
                </tbody>
              </table>
              <div v-if="store.totalValidos > 5" class="more-records">
                ... y {{ store.totalValidos - 5 }} registros más
              </div>
            </div>
          </div>

          <div class="button-group">
            <v-btn variant="text" @click="store.resetForm" prepend-icon="mdi-arrow-left">
              Atrás
            </v-btn>
            <v-btn
              v-if="store.totalValidos > 0"
              color="success"
              prepend-icon="mdi-import"
              :loading="store.loading"
              @click="store.importar"
              class="next-btn"
            >
              Importar ({{ store.totalValidos }})
            </v-btn>
          </div>
        </div>
      </div>

      <!-- PASO 4: RESULTADO -->
      <div v-if="store.paso === 4" class="import-card">
        <div class="import-section">
          <v-icon size="64" color="success" class="success-icon">mdi-check-circle</v-icon>
          <h3>¡Importación completada!</h3>
          <p>{{ store.success }}</p>

          <v-btn
            color="primary"
            prepend-icon="mdi-reload"
            @click="store.resetForm"
            class="reset-btn"
          >
            Importar otro archivo
          </v-btn>
        </div>
      </div>

      <!-- ALERTAS DE ERROR -->
      <v-alert
        v-if="store.error"
        type="error"
        closable
        @click:close="store.clearMessages"
        class="mt-4"
      >
        {{ store.error }}
      </v-alert>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { useImportarVentasStore } from '../../stores/importar-ventas'
import { formatMoneda } from '../../utils/formatters'

const store = useImportarVentasStore()
const fileInput = ref(null)

function handleFileSelect(event) {
  const file = event.target.files?.[0]
  if (file) {
    store.seleccionarArchivo(file)
  }
}

function handleDrop(event) {
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type === 'text/csv' || file.name.endsWith('.csv')) {
    store.seleccionarArchivo(file)
  } else if (file) {
    store.error = 'Por favor, selecciona un archivo CSV'
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

async function validarArchivo() {
  await store.validarArchivo()
}

onMounted(() => {
  store.resetForm()
})
</script>

<style scoped>
.view-container {
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 20px;
}

.bc-root {
  font-size: 12px;
  font-weight: 700;
  color: #06b6d4;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.bc-sep {
  color: rgba(var(--v-theme-on-surface), 0.3);
}

.bc-cat {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.bc-current {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.8);
  font-weight: 500;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(6, 182, 212, 0.35);
}

.page-title {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.5px;
  margin: 0;
}

.page-sub {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin: 2px 0 0;
}

.import-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 16px;
  padding: 40px 32px;
}

.import-section {
  text-align: center;
}

.import-icon {
  color: #06b6d4;
  margin-bottom: 16px;
}

.import-section h3 {
  font-size: 18px;
  font-weight: 700;
  margin: 16px 0 8px;
}

.import-subtitle {
  font-size: 14px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 0;
}

.drop-zone {
  border: 2px dashed rgba(6, 182, 212, 0.3);
  border-radius: 12px;
  padding: 32px 24px;
  margin: 24px 0;
  background: rgba(6, 182, 212, 0.05);
  transition: all 0.3s;
}

.drop-zone:hover {
  border-color: #06b6d4;
  background: rgba(6, 182, 212, 0.1);
}

.select-btn {
  margin-bottom: 16px;
}

.file-selected {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #10b981;
  font-weight: 600;
  margin-top: 16px;
}

.validation-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin: 24px 0;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.summary-item.success {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
}

.summary-item.success :deep(.v-icon) {
  color: #10b981;
}

.summary-item.error {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.summary-item.error :deep(.v-icon) {
  color: #ef4444;
}

.summary-item.info {
  background: rgba(6, 182, 212, 0.1);
  border-color: rgba(6, 182, 212, 0.3);
}

.summary-item.info :deep(.v-icon) {
  color: #06b6d4;
}

.summary-item > div {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.summary-label {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  font-size: 24px;
  font-weight: 800;
}

.validation-errors-card {
  margin: 20px 0;
}

.errors-list {
  max-height: 200px;
  overflow-y: auto;
}

.error-item {
  padding: 8px 0;
  font-size: 13px;
  line-height: 1.4;
}

.preview-section {
  margin: 24px 0;
  text-align: left;
}

.preview-section h4 {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
}

.table-wrapper {
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-radius: 8px;
  overflow: auto;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.preview-table th {
  background: rgba(var(--v-theme-on-surface), 0.06);
  padding: 10px;
  text-align: left;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.preview-table td {
  padding: 10px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
}

.preview-table td.amount {
  text-align: right;
  color: #06b6d4;
  font-weight: 600;
}

.more-records {
  padding: 12px 10px;
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.5);
  font-size: 12px;
  font-style: italic;
}

.success-icon {
  animation: bounce 0.6s ease-out;
}

@keyframes bounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.button-group {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.next-btn {
  min-width: 140px;
}

.reset-btn {
  margin-top: 20px;
}
</style>
