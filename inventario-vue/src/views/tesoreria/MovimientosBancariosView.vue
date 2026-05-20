<template>
  <MainLayout>
    <div class="view-container">
      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">TESORERÍA</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Procesos</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Movimientos Bancarios</span>
      </div>

      <!-- HEADER -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon-wrap">
            <v-icon size="22" color="white">mdi-bank-transfer</v-icon>
          </div>
          <div>
            <h1 class="page-title">MOVIMIENTOS BANCARIOS</h1>
            <p class="page-sub">Visualiza y analiza todos los movimientos bancarios</p>
          </div>
        </div>
        <div class="header-actions">
          <v-btn
            v-if="store.movimientosFiltrados.length > 0"
            variant="outlined"
            prepend-icon="mdi-download"
            @click="exportarExcel"
            color="primary"
          >
            Exportar
          </v-btn>
        </div>
      </div>

      <!-- KPI CARDS -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">INGRESOS</div>
          <div class="kpi-value">{{ formatMoneda(store.totalIngresos) }}</div>
          <div class="kpi-sub">{{ store.movimientosIngresos.length }} movimientos</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">EGRESOS</div>
          <div class="kpi-value red-text">{{ formatMoneda(store.totalEgresos) }}</div>
          <div class="kpi-sub">{{ store.movimientosEgresos.length }} movimientos</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">SALDO NETO</div>
          <div class="kpi-value" :class="store.saldoNeto >= 0 ? 'green-text' : 'red-text'">
            {{ formatMoneda(store.saldoNeto) }}
          </div>
          <div class="kpi-sub">Total movimientos: {{ store.totalMovimientos }}</div>
        </div>
      </div>

      <!-- FILTROS -->
      <div class="filtros-bar">
        <div class="filtros-container">
          <!-- Tipo de movimiento -->
          <v-btn-toggle v-model="store.filtros.tipo" class="filtro-toggle">
            <v-btn value="TODOS" size="small">Todos</v-btn>
            <v-btn value="ING" size="small">Ingresos</v-btn>
            <v-btn value="EGR" size="small">Egresos</v-btn>
          </v-btn-toggle>

          <!-- Búsqueda -->
          <div class="search-bar">
            <v-icon size="18" class="search-icon">mdi-magnify</v-icon>
            <input
              v-model="store.filtros.busqueda"
              type="text"
              placeholder="Buscar por concepto o beneficiario..."
              class="search-input"
            />
          </div>

          <!-- Banco -->
          <v-select
            v-model="store.filtros.banco"
            :items="store.bancos"
            placeholder="Todos los bancos"
            clearable
            hide-details
            size="small"
            class="banco-select"
          />
        </div>
      </div>

      <!-- TABLA -->
      <div class="tabla-container">
        <div class="tabla-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-fecha">FECHA</th>
                <th class="col-tipo">TIPO</th>
                <th class="col-numero">NÚMERO</th>
                <th class="col-concepto">CONCEPTO</th>
                <th class="col-beneficiario">BENEFICIARIO</th>
                <th class="col-banco">BANCO</th>
                <th class="col-ingreso">INGRESO</th>
                <th class="col-egreso">EGRESO</th>
                <th class="col-saldo">SALDO</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="store.movimientosFiltrados.length === 0">
                <td colspan="9" class="tabla-empty">
                  <v-icon size="32" class="empty-icon">mdi-inbox-outline</v-icon>
                  <p class="empty-text">No hay movimientos para mostrar</p>
                </td>
              </tr>
              <tr v-for="(mov, idx) in store.movimientosFiltrados" :key="mov.id" class="tabla-row">
                <td class="col-fecha">{{ formatFecha(mov.fecha) }}</td>
                <td class="col-tipo">
                  <v-chip
                    :color="getTipoColor(mov)"
                    variant="flat"
                    size="small"
                    class="tipo-chip"
                  >
                    {{ getTipoLabel(mov) }}
                  </v-chip>
                </td>
                <td class="col-numero">
                  <span class="numero-badge">{{ mov.numero }}</span>
                </td>
                <td class="col-concepto">{{ mov.concepto || '-' }}</td>
                <td class="col-beneficiario">{{ mov.referencia || '-' }}</td>
                <td class="col-banco">{{ mov.banco || '-' }}</td>
                <td class="col-ingreso">
                  <span v-if="mov.ingreso" class="ingreso-text">
                    {{ formatMoneda(mov.ingreso) }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td class="col-egreso">
                  <span v-if="mov.egreso" class="egreso-text">
                    {{ formatMoneda(mov.egreso) }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td class="col-saldo">
                  <span
                    class="saldo-text"
                    :class="calcularSaldoAcumulado(idx) >= 0 ? 'saldo-positivo' : 'saldo-negativo'"
                  >
                    {{ formatMoneda(calcularSaldoAcumulado(idx)) }}
                  </span>
                </td>
              </tr>
              <!-- Footer con totales -->
              <tr v-if="store.movimientosFiltrados.length > 0" class="tabla-footer">
                <td colspan="6" class="footer-label">TOTALES</td>
                <td class="col-ingreso">
                  <span class="total-text ingreso-text">
                    {{ formatMoneda(calcularTotalIngresos()) }}
                  </span>
                </td>
                <td class="col-egreso">
                  <span class="total-text egreso-text">
                    {{ formatMoneda(calcularTotalEgresos()) }}
                  </span>
                </td>
                <td class="col-saldo">
                  <span
                    class="total-text"
                    :class="(calcularTotalIngresos() - calcularTotalEgresos()) >= 0 ? 'saldo-positivo' : 'saldo-negativo'"
                  >
                    {{ formatMoneda(calcularTotalIngresos() - calcularTotalEgresos()) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ERROR -->
      <v-alert
        v-if="store.error"
        type="error"
        closable
        @click:close="store.clearError()"
        class="mt-4"
      >
        {{ store.error }}
      </v-alert>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { useMovimientosBancariosStore } from '../../stores/movimientos-bancarios'
import { formatMoneda, formatFecha } from '../../utils/formatters'

const store = useMovimientosBancariosStore()

// Funciones helper
function getTipoLabel(mov) {
  if (mov.ingreso && parseFloat(mov.ingreso) > 0) return 'INGRESO'
  if (mov.egreso && parseFloat(mov.egreso) > 0) return 'EGRESO'
  return 'OTRO'
}

function getTipoColor(mov) {
  if (mov.ingreso && parseFloat(mov.ingreso) > 0) return 'success'
  if (mov.egreso && parseFloat(mov.egreso) > 0) return 'error'
  return 'default'
}

function calcularSaldoAcumulado(index) {
  let acumulado = 0
  for (let i = 0; i <= index; i++) {
    const m = store.movimientosFiltrados[i]
    acumulado += parseFloat(m.ingreso || 0)
    acumulado -= parseFloat(m.egreso || 0)
  }
  return acumulado
}

function calcularTotalIngresos() {
  return store.movimientosFiltrados.reduce((sum, m) => sum + parseFloat(m.ingreso || 0), 0)
}

function calcularTotalEgresos() {
  return store.movimientosFiltrados.reduce((sum, m) => sum + parseFloat(m.egreso || 0), 0)
}

function exportarExcel() {
  // Implementación de exportación a Excel
  alert('Exportación a Excel será implementada próximamente')
}

onMounted(async () => {
  await store.fetchMovimientos()
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

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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

.green-text {
  color: #10b981;
}

.red-text {
  color: #ef4444;
}

.filtros-bar {
  margin-bottom: 20px;
}

.filtros-container {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.filtro-toggle {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  flex: 1;
  min-width: 300px;
}

.search-icon {
  color: rgba(var(--v-theme-on-surface), 0.4);
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
}

.search-input::placeholder {
  color: rgba(var(--v-theme-on-surface), 0.4);
}

.banco-select {
  min-width: 200px;
}

.tabla-container {
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
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
  letter-spacing: 0.5px;
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
  color: rgb(var(--v-theme-on-surface));
}

.data-table tbody tr.tabla-footer {
  background: rgba(var(--v-theme-on-surface), 0.06);
  font-weight: 700;
  border-top: 2px solid rgba(var(--v-theme-on-surface), 0.1);
  border-bottom: none;
}

.data-table tbody tr.tabla-footer td {
  padding: 14px 10px;
  color: rgb(var(--v-theme-on-surface));
}

.col-fecha {
  width: 90px;
}

.col-tipo {
  width: 100px;
}

.col-numero {
  width: 100px;
}

.col-concepto {
  width: 25%;
}

.col-beneficiario {
  width: 20%;
}

.col-banco {
  width: 120px;
}

.col-ingreso {
  width: 110px;
  text-align: right;
}

.col-egreso {
  width: 110px;
  text-align: right;
}

.col-saldo {
  width: 110px;
  text-align: right;
}

.numero-badge {
  background: rgba(6, 182, 212, 0.15);
  color: #06b6d4;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 12px;
}

.tipo-chip {
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.ingreso-text {
  color: #10b981;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.egreso-text {
  color: #ef4444;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.saldo-text {
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.saldo-positivo {
  color: #10b981;
}

.saldo-negativo {
  color: #ef4444;
}

.total-text {
  font-family: 'Courier New', monospace;
}

.text-muted {
  color: rgba(var(--v-theme-on-surface), 0.4);
}

.tabla-empty {
  text-align: center !important;
  padding: 40px !important;
}

.empty-icon {
  color: rgba(var(--v-theme-on-surface), 0.2);
  display: block;
  margin: 0 auto 8px;
}

.empty-text {
  color: rgba(var(--v-theme-on-surface), 0.4);
  font-size: 14px;
  margin: 0;
}

.footer-label {
  text-align: right;
  padding-right: 10px !important;
  font-weight: 700;
}
</style>
