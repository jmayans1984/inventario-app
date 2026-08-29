<template>
  <MainLayout>
    <div class="cont-dash-wrap">
      <PageHeader
        title="Contabilidad — Estado del Mes"
        description="Resumen de ingresos, egresos y resultados del mes actual con proyección de nómina"
        :crumbs="['Contabilidad', 'Dashboard']"
      />

      <!-- LOADING -->
      <div v-if="loading" class="cont-dash-loading">
        <v-progress-circular indeterminate color="var(--indigo)" size="48" />
        <p>Calculando estado de resultados...</p>
      </div>

      <!-- CONTENIDO PRINCIPAL -->
      <div v-else class="cont-dash-grid">
        <!-- PANEL IZQUIERDO: Estado de Resultados -->
        <div class="cont-dash-left">
          <!-- KPI CARDS -->
          <div class="pyg-kpis">
            <KpiCard
              :index="0"
              label="Ingresos"
              :value="formatMoneda(data.pyg.totalIngresos)"
              icon="mdi-trending-up"
              color="var(--success)"
              value-color="var(--success)"
            />
            <KpiCard
              :index="1"
              label="Egresos"
              :value="formatMoneda(data.pyg.totalGastos)"
              icon="mdi-receipt-text-outline"
              color="var(--indigo)"
              value-color="var(--indigo)"
            />
            <KpiCard
              :index="2"
              label="Utilidad"
              :value="formatMoneda(data.pyg.utilidad)"
              :icon="data.pyg.utilidad >= 0 ? 'mdi-cash-multiple' : 'mdi-alert'"
              :color="data.pyg.utilidad >= 0 ? 'var(--success)' : 'var(--error)'"
              :value-color="data.pyg.utilidad >= 0 ? 'var(--success)' : 'var(--error)'"
            />
          </div>

          <!-- TABLA P&G -->
          <div class="pyg-card">
            <div class="pyg-card-header">
              <v-icon size="18" color="var(--indigo)">mdi-file-chart-outline</v-icon>
              <span class="pyg-card-title">Estado de Resultados — Mes Actual</span>
            </div>

            <table class="pyg-table">
              <tbody>
                <!-- INGRESOS -->
                <tr class="pyg-row-header">
                  <td colspan="2" class="fw-bold">INGRESOS</td>
                </tr>
                <tr v-for="item in data.pyg.ingresos" :key="item.grupo" class="pyg-row-item">
                  <td class="pyg-label">{{ item.grupo }}</td>
                  <td class="pyg-value text-right">{{ formatMoneda(item.total) }}</td>
                </tr>
                <tr class="pyg-row-subtotal">
                  <td class="fw-bold">TOTAL INGRESOS</td>
                  <td class="fw-bold text-right">{{ formatMoneda(data.pyg.totalIngresos) }}</td>
                </tr>

                <!-- EGRESOS -->
                <tr class="pyg-row-header">
                  <td colspan="2" class="fw-bold">EGRESOS</td>
                </tr>
                <tr v-for="item in data.pyg.egresos" :key="item.grupo" class="pyg-row-item">
                  <td class="pyg-label">{{ item.grupo }}</td>
                  <td class="pyg-value text-right">{{ formatMoneda(item.total) }}</td>
                </tr>
                <tr class="pyg-row-subtotal">
                  <td class="fw-bold">TOTAL EGRESOS</td>
                  <td class="fw-bold text-right">{{ formatMoneda(data.pyg.totalGastos) }}</td>
                </tr>

                <!-- UTILIDAD -->
                <tr class="pyg-row-utilidad">
                  <td class="fw-bold">UTILIDAD NETA</td>
                  <td class="fw-bold text-right" :style="{ color: data.pyg.utilidad >= 0 ? 'var(--success)' : 'var(--error)' }">
                    {{ formatMoneda(data.pyg.utilidad) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- PANEL DERECHO: Movimientos y Preliquidación -->
        <div class="cont-dash-right">
          <!-- PRELIQUIDACIÓN DE NÓMINA -->
          <div v-if="data.preliquidacion" class="preq-card">
            <div class="preq-header">
              <v-icon size="18" color="var(--warning)">mdi-clock-outline</v-icon>
              <span class="preq-title">Preliquidación de Nómina</span>
              <span class="preq-badge">En Borrador</span>
            </div>

            <div class="preq-content">
              <div class="preq-row">
                <span class="preq-label">Bruto Proyectado</span>
                <span class="preq-value">{{ formatMoneda(data.preliquidacion.total_bruto) }}</span>
              </div>
              <div class="preq-row">
                <span class="preq-label">Deducciones</span>
                <span class="preq-value text-error">{{ formatMoneda(data.preliquidacion.total_deducciones) }}</span>
              </div>
              <div class="preq-row">
                <span class="preq-label">Neto a Pagar</span>
                <span class="preq-value fw-bold text-success">{{ formatMoneda(data.preliquidacion.total_neto) }}</span>
              </div>
              <div class="preq-row">
                <span class="preq-label">Aportes Empresa</span>
                <span class="preq-value">{{ formatMoneda(data.preliquidacion.total_aportes_er) }}</span>
              </div>
            </div>

            <div class="preq-footer">
              <span class="preq-note">Basado en horas hasta {{ fechaHoy }}</span>
              <router-link to="/nomina/liquidacion" class="preq-link">
                Ver liquidación →
              </router-link>
            </div>
          </div>

          <!-- ÚLTIMOS MOVIMIENTOS -->
          <div class="mov-card">
            <div class="mov-header">
              <v-icon size="18" color="var(--indigo)">mdi-receipt</v-icon>
              <span class="mov-title">Últimos Movimientos</span>
            </div>

            <div v-if="data.ultimosGastos.length" class="mov-list">
              <div v-for="gasto in data.ultimosGastos" :key="gasto.codigo" class="mov-item">
                <div class="mov-item-header">
                  <span class="mov-concepto">{{ gasto.concepto }}</span>
                  <span class="mov-proveedor">{{ gasto.proveedor_nombre }}</span>
                </div>
                <div class="mov-item-footer">
                  <span class="mov-fecha">{{ formatFecha(gasto.fecha) }}</span>
                  <span class="mov-total">{{ formatMoneda(gasto.total) }}</span>
                </div>
              </div>
            </div>
            <div v-else class="mov-empty">
              No hay movimientos este mes
            </div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import KpiCard from '../../components/common/KpiCard.vue'
import { formatMoneda } from '../../utils/formatters'
import axios from 'axios'

const loading = ref(false)
const data = ref({
  pyg: {
    totalIngresos: 0,
    totalGastos: 0,
    utilidad: 0,
    ingresos: [],
    egresos: []
  },
  preliquidacion: null,
  ultimosGastos: []
})

const empresa = ref(localStorage.getItem('empresa') || '')

// Formato de fecha unico de la app: MM/DD/AAAA. Se arma a mano en vez de
// usar toLocaleDateString con un locale, porque 'es-CO' rinde D/M/AAAA y
// cualquier locale depende de la tabla del navegador.
function fechaMMDDAAAA(d) {
  if (!d || isNaN(d.getTime())) return '—'
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${d.getFullYear()}`
}

const fechaHoy = computed(() => fechaMMDDAAAA(new Date()))

function formatFecha(fecha) {
  return fechaMMDDAAAA(new Date(fecha))
}

async function cargarDashboard() {
  loading.value = true
  try {
    const response = await axios.get('/api/contabilidad/dashboard', {
      params: { empresa: empresa.value }
    })

    const dashboard = response.data.data

    // Mapear P&G
    data.value.pyg = {
      totalIngresos: dashboard.kpis.ingresos?.total || 0,
      totalGastos: dashboard.kpis.comprasMP?.total + dashboard.kpis.nomina?.total + dashboard.kpis.gastosGenerales?.total + dashboard.kpis.impuestos?.total || 0,
      utilidad: (dashboard.kpis.ingresos?.total || 0) - (dashboard.kpis.comprasMP?.total + dashboard.kpis.nomina?.total + dashboard.kpis.gastosGenerales?.total + dashboard.kpis.impuestos?.total || 0),
      ingresos: [
        { grupo: 'Ventas', total: dashboard.kpis.ingresos?.total || 0 },
        { grupo: 'Otros Ingresos', total: dashboard.kpis.otros?.total || 0 }
      ],
      egresos: [
        { grupo: 'Materia Prima', total: dashboard.kpis.comprasMP?.total || 0 },
        { grupo: 'Nómina', total: dashboard.kpis.nomina?.total || 0 },
        { grupo: 'Gastos Generales', total: dashboard.kpis.gastosGenerales?.total || 0 },
        { grupo: 'Impuestos', total: dashboard.kpis.impuestos?.total || 0 }
      ]
    }

    // Preliquidación
    if (dashboard.preliquidacionNomina && dashboard.preliquidacionNomina.total_bruto > 0) {
      data.value.preliquidacion = dashboard.preliquidacionNomina
    }

    // Últimos gastos
    data.value.ultimosGastos = (dashboard.ultimosGastos || []).slice(0, 8)
  } catch (err) {
    console.error('Error cargando dashboard:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  cargarDashboard()
})
</script>

<style scoped>
/* ════════════════════════════════════════════════════════════════ */
/* LAYOUT */
/* ════════════════════════════════════════════════════════════════ */

.cont-dash-wrap {
  padding: 0;
}

.cont-dash-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 400px;
  color: var(--text-secondary);
}

.cont-dash-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

.cont-dash-left,
.cont-dash-right {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ════════════════════════════════════════════════════════════════ */
/* KPI CARDS */
/* ════════════════════════════════════════════════════════════════ */

.pyg-kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

/* ════════════════════════════════════════════════════════════════ */
/* P&G TABLE */
/* ════════════════════════════════════════════════════════════════ */

.pyg-card {
  background: var(--surface-secondary);
  border-radius: 12px;
  overflow: hidden;
}

.pyg-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--divider);
}

.pyg-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.pyg-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.pyg-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--divider);
}

.pyg-row-header {
  background: var(--surface-tertiary);
}

.pyg-row-header td {
  color: var(--text-primary);
  border-bottom: 2px solid var(--divider);
}

.pyg-row-item .pyg-label {
  color: var(--text-primary);
  font-weight: 500;
}

.pyg-row-item .pyg-value {
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.pyg-row-subtotal {
  background: rgba(99, 88, 224, 0.05);
  font-weight: 600;
  color: var(--indigo);
}

.pyg-row-subtotal td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--divider);
}

.pyg-row-utilidad {
  background: rgba(34, 197, 94, 0.05);
  color: var(--success);
  font-weight: 700;
}

.pyg-row-utilidad td {
  padding: 16px;
  border-bottom: none;
  font-size: 14px;
}

.text-right {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.fw-bold {
  font-weight: 600;
}

.text-error {
  color: var(--error);
}

.text-success {
  color: var(--success);
}

/* ════════════════════════════════════════════════════════════════ */
/* PRELIQUIDACIÓN DE NÓMINA */
/* ════════════════════════════════════════════════════════════════ */

.preq-card {
  background: var(--surface-secondary);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-left: 4px solid var(--warning);
  border-radius: 12px;
  overflow: hidden;
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.preq-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid var(--divider);
  background: rgba(245, 158, 11, 0.03);
}

.preq-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.preq-badge {
  font-size: 11px;
  font-weight: 600;
  background: rgba(245, 158, 11, 0.15);
  color: var(--warning);
  padding: 4px 8px;
  border-radius: 4px;
  text-transform: uppercase;
}

.preq-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preq-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preq-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.preq-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.preq-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.02);
  border-top: 1px solid var(--divider);
  font-size: 12px;
}

.preq-note {
  color: var(--text-secondary);
}

.preq-link {
  color: var(--indigo);
  text-decoration: none;
  font-weight: 600;
  transition: color 150ms ease;
}

.preq-link:hover {
  color: var(--indigo-dark);
  text-decoration: underline;
}

/* ════════════════════════════════════════════════════════════════ */
/* ÚLTIMOS MOVIMIENTOS */
/* ════════════════════════════════════════════════════════════════ */

.mov-card {
  background: var(--surface-secondary);
  border-radius: 12px;
  overflow: hidden;
}

.mov-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--divider);
}

.mov-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.mov-list {
  display: flex;
  flex-direction: column;
  max-height: 500px;
  overflow-y: auto;
}

.mov-item {
  padding: 12px 16px;
  border-bottom: 1px solid var(--divider);
  transition: background 150ms ease;
}

.mov-item:hover {
  background: rgba(99, 88, 224, 0.03);
}

.mov-item:last-child {
  border-bottom: none;
}

.mov-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.mov-concepto {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mov-proveedor {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.mov-item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mov-fecha {
  font-size: 12px;
  color: var(--text-secondary);
}

.mov-total {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.mov-empty {
  padding: 32px 16px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}

/* ════════════════════════════════════════════════════════════════ */
/* RESPONSIVE */
/* ════════════════════════════════════════════════════════════════ */

@media (max-width: 1200px) {
  .cont-dash-grid {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .pyg-kpis {
    grid-template-columns: 1fr;
  }
}
</style>
