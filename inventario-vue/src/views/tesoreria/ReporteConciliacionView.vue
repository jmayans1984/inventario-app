<template>
  <MainLayout>
    <div class="view-container">
      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">TESORERÍA</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Conciliación Bancaria</span>
      </div>

      <!-- HEADER -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon-wrap">
            <v-icon size="22" color="white">mdi-file-chart-outline</v-icon>
          </div>
          <div>
            <h1 class="page-title">REPORTE DE CONCILIACIÓN</h1>
            <p class="page-sub">Estado de conciliación entre movimientos bancarios y contables</p>
          </div>
        </div>
        <div class="header-actions">
          <v-btn
            variant="outlined"
            prepend-icon="mdi-file-pdf-box"
            @click="exportarPDF"
            :loading="store.exportando"
            color="error"
          >
            PDF
          </v-btn>
          <v-btn
            variant="outlined"
            prepend-icon="mdi-file-excel-box"
            @click="exportarExcel"
            :loading="store.exportando"
            color="success"
          >
            Excel
          </v-btn>
        </div>
      </div>

      <!-- FILTROS -->
      <div class="filtros-bar">
        <v-text-field
          v-model="store.filtros.fechaInicio"
          label="Fecha Inicio"
          type="date"
          variant="outlined"
          size="small"
          @change="cargarReporte"
        />
        <v-text-field
          v-model="store.filtros.fechaFin"
          label="Fecha Fin"
          type="date"
          variant="outlined"
          size="small"
          @change="cargarReporte"
        />
        <v-text-field
          v-model="store.filtros.banco"
          label="Banco"
          variant="outlined"
          size="small"
          @change="cargarReporte"
        />
        <v-btn
          variant="text"
          prepend-icon="mdi-refresh"
          @click="cargarReporte"
          :loading="store.loading"
        >
          Actualizar
        </v-btn>
      </div>

      <!-- KPI CARDS -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">PENDIENTES</div>
          <div class="kpi-value red-text">{{ formatMoneda(store.totalPendiente) }}</div>
          <div class="kpi-sub">Esperando conciliación</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">CONCILIADOS</div>
          <div class="kpi-value green-text">{{ formatMoneda(store.totalConciliado) }}</div>
          <div class="kpi-sub">Verificados y confirmados</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">% CONCILIACIÓN</div>
          <div class="kpi-value blue-text">{{ store.porcentajeConciliacion }}%</div>
          <div class="kpi-sub">Tasa de conciliación</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">TOTAL</div>
          <div class="kpi-value">{{ formatMoneda(store.totalPendiente + store.totalConciliado) }}</div>
          <div class="kpi-sub">Monto total</div>
        </div>
      </div>

      <!-- GRÁFICO -->
      <div class="charts-grid">
        <div class="chart-card">
          <h3>Distribución de Conciliación</h3>
          <div class="chart-placeholder">
            <div class="pie-chart">
              <div class="pie-segment conciliado" :style="{ width: store.porcentajeConciliacion + '%' }"></div>
              <div class="pie-segment pendiente" :style="{ width: (100 - store.porcentajeConciliacion) + '%' }"></div>
            </div>
            <div class="chart-legend">
              <div class="legend-item">
                <span class="legend-color conciliado"></span>
                <span>Conciliado ({{ store.porcentajeConciliacion }}%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color pendiente"></span>
                <span>Pendiente ({{ 100 - store.porcentajeConciliacion }}%)</span>
              </div>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <h3>Resumen de Montos</h3>
          <div class="summary-bars">
            <div class="bar-item">
              <div class="bar-label">Conciliados</div>
              <div class="bar-value green-text">{{ formatMoneda(store.totalConciliado) }}</div>
              <div class="bar-fill" :style="{ width: getPercentage(store.totalConciliado) + '%', backgroundColor: '#10b981' }"></div>
            </div>
            <div class="bar-item">
              <div class="bar-label">Pendientes</div>
              <div class="bar-value red-text">{{ formatMoneda(store.totalPendiente) }}</div>
              <div class="bar-fill" :style="{ width: getPercentage(store.totalPendiente) + '%', backgroundColor: '#ef4444' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- TABLA DE MOVIMIENTOS CONCILIADOS -->
      <div v-if="store.conciliacionData.conciliados?.length > 0" class="tabla-section">
        <h3>Movimientos Conciliados</h3>
        <div class="tabla-container">
          <div class="tabla-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="col-fecha">FECHA</th>
                  <th class="col-numero">NÚMERO</th>
                  <th class="col-concepto">CONCEPTO</th>
                  <th class="col-banco">BANCO</th>
                  <th class="col-monto">MONTO</th>
                  <th class="col-estado">ESTADO</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="mov in store.conciliacionData.conciliados.slice(0, 10)" :key="mov.id" class="tabla-row">
                  <td class="col-fecha">{{ formatFecha(mov.fecha) }}</td>
                  <td class="col-numero">{{ mov.numero }}</td>
                  <td class="col-concepto">{{ mov.concepto }}</td>
                  <td class="col-banco">{{ mov.banco }}</td>
                  <td class="col-monto">{{ formatMoneda(mov.monto) }}</td>
                  <td class="col-estado">
                    <v-chip color="success" variant="flat" size="small">CONCILIADO</v-chip>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="store.conciliacionData.conciliados?.length > 10" class="more-rows">
              ... y {{ store.conciliacionData.conciliados.length - 10 }} registros más
            </div>
          </div>
        </div>
      </div>

      <!-- TABLA DE MOVIMIENTOS PENDIENTES -->
      <div v-if="store.conciliacionData.pendientes?.length > 0" class="tabla-section">
        <h3>Movimientos Pendientes</h3>
        <div class="tabla-container">
          <div class="tabla-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="col-fecha">FECHA</th>
                  <th class="col-numero">NÚMERO</th>
                  <th class="col-concepto">CONCEPTO</th>
                  <th class="col-banco">BANCO</th>
                  <th class="col-monto">MONTO</th>
                  <th class="col-estado">ESTADO</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="mov in store.conciliacionData.pendientes.slice(0, 10)" :key="mov.id" class="tabla-row">
                  <td class="col-fecha">{{ formatFecha(mov.fecha) }}</td>
                  <td class="col-numero">{{ mov.numero }}</td>
                  <td class="col-concepto">{{ mov.concepto }}</td>
                  <td class="col-banco">{{ mov.banco }}</td>
                  <td class="col-monto">{{ formatMoneda(mov.monto) }}</td>
                  <td class="col-estado">
                    <v-chip color="warning" variant="flat" size="small">PENDIENTE</v-chip>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="store.conciliacionData.pendientes?.length > 10" class="more-rows">
              ... y {{ store.conciliacionData.pendientes.length - 10 }} registros más
            </div>
          </div>
        </div>
      </div>

      <!-- ERROR -->
      <v-alert
        v-if="store.error"
        type="error"
        closable
        @click:close="store.clearError"
        class="mt-4"
      >
        {{ store.error }}
      </v-alert>
    </div>
  </MainLayout>
</template>

<script setup>
import { onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { useReportesStore } from '../../stores/reportes'
import { formatMoneda, formatFecha } from '../../utils/formatters'

const store = useReportesStore()

function getPercentage(monto) {
  const total = store.totalPendiente + store.totalConciliado
  if (total === 0) return 0
  return (monto / total) * 100
}

async function cargarReporte() {
  await store.fetchReporteConciliacion(store.filtros)
}

async function exportarPDF() {
  await store.exportarPDF('conciliacion', store.conciliacionData)
}

async function exportarExcel() {
  await store.exportarExcel('conciliacion', store.conciliacionData)
}

onMounted(async () => {
  await cargarReporte()
})
</script>

<style scoped>
.view-container {
  padding: 24px;
  max-width: 1400px;
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
  margin-bottom: 24px;
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

.header-actions {
  display: flex;
  gap: 8px;
}

.filtros-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.kpi-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.kpi-label {
  font-size: 11px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.kpi-value {
  font-size: 28px;
  font-weight: 800;
  color: #06b6d4;
  margin: 8px 0;
}

.kpi-sub {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.red-text { color: #ef4444; }
.green-text { color: #10b981; }
.blue-text { color: #06b6d4; }

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.chart-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  padding: 20px;
}

.chart-card h3 {
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 16px;
}

.chart-placeholder {
  display: flex;
  gap: 24px;
  align-items: center;
}

.pie-chart {
  display: flex;
  width: 120px;
  height: 20px;
  border-radius: 10px;
  overflow: hidden;
}

.pie-segment {
  height: 100%;
}

.pie-segment.conciliado {
  background: #10b981;
}

.pie-segment.pendiente {
  background: #ef4444;
}

.chart-legend {
  flex: 1;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.conciliado {
  background: #10b981;
}

.legend-color.pendiente {
  background: #ef4444;
}

.summary-bars {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bar-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bar-label {
  font-size: 12px;
  font-weight: 600;
}

.bar-value {
  font-size: 14px;
  font-weight: 700;
}

.bar-fill {
  height: 24px;
  border-radius: 4px;
  min-width: 50px;
}

.tabla-section {
  margin-bottom: 24px;
}

.tabla-section h3 {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
}

.tabla-container {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  overflow: hidden;
}

.tabla-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table thead {
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.data-table thead th {
  padding: 12px 10px;
  text-align: left;
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.6);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.data-table tbody tr {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
}

.data-table tbody tr:hover {
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.data-table tbody td {
  padding: 11px 10px;
}

.col-fecha { width: 90px; }
.col-numero { width: 100px; }
.col-concepto { width: 30%; }
.col-banco { width: 120px; }
.col-monto { width: 110px; text-align: right; }
.col-estado { width: 100px; }

.more-rows {
  padding: 12px;
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.5);
  font-size: 12px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.05);
}
</style>
