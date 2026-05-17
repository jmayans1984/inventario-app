<template>
  <MainLayout>
    <!-- KPI Cards -->
    <v-row class="mb-6">
      <v-col v-for="kpi in kpis" :key="kpi.title" cols="12" sm="6" lg="3">
        <v-card class="kpi-card" elevation="0" rounded="lg">
          <div class="kpi-indicator" :style="{ background: kpi.color }"></div>
          <v-card-text class="pa-5">
            <div class="d-flex justify-space-between align-start mb-4">
              <div>
                <p class="kpi-label">{{ kpi.title }}</p>
                <p class="kpi-sublabel">{{ kpi.subtitle }}</p>
              </div>
              <div class="kpi-icon-bg" :style="{ background: kpi.color + '22' }">
                <v-icon :color="kpi.color" size="22">{{ kpi.icon }}</v-icon>
              </div>
            </div>
            <v-divider class="mb-4 border-opacity-10"></v-divider>
            <div class="d-flex gap-6">
              <div v-for="stat in kpi.stats" :key="stat.label">
                <p class="kpi-value" :style="{ color: kpi.color }">{{ stat.value }}</p>
                <p class="kpi-stat-label">{{ stat.label }}</p>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Acciones Rápidas -->
    <v-card elevation="0" rounded="lg" class="mb-6">
      <v-card-text class="pa-5">
        <p class="section-title mb-4">Acciones Rápidas</p>
        <v-row dense>
          <v-col cols="6" md="3" v-for="action in quickActions" :key="action.label">
            <v-btn
              block
              variant="tonal"
              :color="action.color"
              :prepend-icon="action.icon"
              class="action-btn"
              height="48"
            >
              {{ action.label }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Tabla órdenes recientes -->
    <v-card elevation="0" rounded="lg">
      <v-card-text class="pa-5">
        <div class="d-flex justify-space-between align-center mb-4">
          <p class="section-title">Órdenes Recientes</p>
          <v-btn variant="text" color="primary" size="small" append-icon="mdi-arrow-right">
            Ver todas
          </v-btn>
        </div>
        <v-table density="comfortable">
          <thead>
            <tr>
              <th class="table-header">ORDEN</th>
              <th class="table-header">CLIENTE</th>
              <th class="table-header">FECHA</th>
              <th class="table-header">TOTAL</th>
              <th class="table-header">ESTADO</th>
              <th class="table-header"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="orden in ordenes" :key="orden.id" class="table-row">
              <td class="table-cell font-weight-bold">{{ orden.id }}</td>
              <td class="table-cell">{{ orden.cliente }}</td>
              <td class="table-cell text-medium-emphasis">{{ orden.fecha }}</td>
              <td class="table-cell font-weight-bold">{{ orden.total }}</td>
              <td class="table-cell">
                <v-chip :color="orden.color" size="small" variant="tonal" label>
                  {{ orden.estado }}
                </v-chip>
              </td>
              <td class="table-cell">
                <v-btn size="small" variant="text" icon="mdi-eye-outline" color="primary"></v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </MainLayout>
</template>

<script setup>
import MainLayout from '../components/layouts/MainLayout.vue'

const kpis = [
  {
    title: 'INVENTARIO',
    subtitle: 'Gestión de productos',
    icon: 'mdi-package-variant-closed',
    color: '#3b82f6',
    stats: [
      { value: '1,250', label: 'Productos' },
      { value: '45', label: 'Bajo Stock' },
    ],
  },
  {
    title: 'ÓRDENES',
    subtitle: 'Órdenes de compra',
    icon: 'mdi-clipboard-list-outline',
    color: '#8b5cf6',
    stats: [
      { value: '28', label: 'Pendientes' },
      { value: '156', label: 'Este mes' },
    ],
  },
  {
    title: 'GASTOS',
    subtitle: 'Registros contables',
    icon: 'mdi-currency-usd',
    color: '#22c55e',
    stats: [
      { value: '$45K', label: 'Este mes' },
      { value: '12', label: 'Transacciones' },
    ],
  },
  {
    title: 'TESORERÍA',
    subtitle: 'Movimientos bancarios',
    icon: 'mdi-bank-outline',
    color: '#f59e0b',
    stats: [
      { value: '$120K', label: 'Saldo total' },
      { value: '8', label: 'Cuentas' },
    ],
  },
]

const quickActions = [
  { label: 'Nueva Orden', icon: 'mdi-plus-circle-outline', color: 'primary' },
  { label: 'Registrar Entrega', icon: 'mdi-truck-check-outline', color: 'success' },
  { label: 'Nuevo Gasto', icon: 'mdi-receipt-text-plus-outline', color: 'warning' },
  { label: 'Ver Reportes', icon: 'mdi-chart-bar', color: 'secondary' },
]

const ordenes = [
  { id: 'OC-2026-001', cliente: 'Empresa ABC', fecha: '15/05/2026', total: '$8,500.00', estado: 'PENDIENTE', color: 'warning' },
  { id: 'OC-2026-002', cliente: 'Distribuidora XYZ', fecha: '14/05/2026', total: '$12,300.00', estado: 'ENTREGADA', color: 'success' },
  { id: 'OC-2026-003', cliente: 'Retail Store', fecha: '13/05/2026', total: '$5,600.00', estado: 'FACTURADA', color: 'info' },
  { id: 'OC-2026-004', cliente: 'Tech Solutions', fecha: '12/05/2026', total: '$9,200.00', estado: 'PENDIENTE', color: 'warning' },
]
</script>

<style scoped>
/* KPI Cards */
.kpi-card {
  background: white;
  border: 1px solid #e2e8f0;
  position: relative;
  overflow: hidden;
}

:deep(.v-theme--dark) .kpi-card {
  background: #1e293b;
  border-color: rgba(255,255,255,0.08);
}

.kpi-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  border-radius: 0;
}

.kpi-label {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.kpi-sublabel {
  font-size: 12px;
  color: #94a3b8;
}

.kpi-icon-bg {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 2px;
}

.kpi-stat-label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

/* Section title */
.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

:deep(.v-theme--dark) .section-title {
  color: #f1f5f9;
}

/* Action buttons */
.action-btn {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* Table */
.table-header {
  font-size: 11px !important;
  font-weight: 700 !important;
  color: #94a3b8 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.8px !important;
  padding: 12px 16px !important;
}

.table-cell {
  font-size: 13px;
  color: #334155;
  padding: 14px 16px !important;
}

:deep(.v-theme--dark) .table-cell {
  color: #cbd5e1;
}
</style>
