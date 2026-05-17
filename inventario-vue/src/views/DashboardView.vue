<template>
  <MainLayout>

    <!-- ── KPI CARDS ── -->
    <v-row class="mb-5" dense>
      <v-col v-for="kpi in kpis" :key="kpi.title" cols="12" sm="6" xl="3">
        <v-card elevation="0" rounded="lg" class="kpi-card" :style="{ borderTop: `3px solid ${kpi.color}` }">
          <v-card-text class="pa-5">
            <div class="d-flex justify-space-between align-start">
              <p class="kpi-title">{{ kpi.title }}</p>
              <div class="kpi-icon" :style="{ background: kpi.color + '18', color: kpi.color }">
                <v-icon size="20">{{ kpi.icon }}</v-icon>
              </div>
            </div>

            <p class="kpi-subtitle">{{ kpi.subtitle }}</p>

            <v-divider class="my-3 opacity-10"></v-divider>

            <div class="kpi-stats">
              <div v-for="s in kpi.stats" :key="s.label" class="kpi-stat">
                <span class="kpi-val" :style="{ color: kpi.color }">{{ s.value }}</span>
                <span class="kpi-lbl">{{ s.label }}</span>
              </div>
            </div>

            <div class="kpi-trend">
              <v-icon size="13" :color="kpi.trend > 0 ? 'success' : 'error'">
                {{ kpi.trend > 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}
              </v-icon>
              <span :style="{ color: kpi.trend > 0 ? '#22c55e' : '#ef4444' }">
                {{ Math.abs(kpi.trend) }}% vs mes anterior
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row dense>
      <!-- ── ACCIONES RÁPIDAS ── -->
      <v-col cols="12" md="4">
        <v-card elevation="0" rounded="lg" class="fill-height">
          <v-card-text class="pa-5">
            <p class="section-label">ACCIONES RÁPIDAS</p>
            <div class="actions-grid">
              <div
                v-for="a in quickActions"
                :key="a.label"
                class="action-card"
                :style="{ '--ac': a.color }"
                @click="a.action"
              >
                <div class="action-icon-wrap" :style="{ background: a.color + '18' }">
                  <v-icon :color="a.color" size="22">{{ a.icon }}</v-icon>
                </div>
                <span class="action-label">{{ a.label }}</span>
                <v-icon size="14" color="rgba(var(--v-theme-on-surface),0.3)">mdi-chevron-right</v-icon>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- ── TABLA ÓRDENES RECIENTES ── -->
      <v-col cols="12" md="8">
        <v-card elevation="0" rounded="lg">
          <v-card-text class="pa-5">
            <div class="d-flex justify-space-between align-center mb-4">
              <p class="section-label">ÓRDENES RECIENTES</p>
              <v-btn variant="text" color="primary" size="x-small" append-icon="mdi-arrow-right" class="font-weight-bold">
                VER TODAS
              </v-btn>
            </div>

            <v-table density="comfortable" class="orders-table">
              <thead>
                <tr>
                  <th v-for="h in tableHeaders" :key="h" class="th">{{ h }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="o in ordenes" :key="o.id" class="order-row">
                  <td class="td">
                    <span class="order-id">{{ o.id }}</span>
                  </td>
                  <td class="td">{{ o.cliente }}</td>
                  <td class="td text-medium-emphasis">{{ o.fecha }}</td>
                  <td class="td">
                    <span class="order-total">{{ o.total }}</span>
                  </td>
                  <td class="td">
                    <v-chip :color="o.color" size="x-small" label variant="tonal" class="font-weight-bold">
                      {{ o.estado }}
                    </v-chip>
                  </td>
                  <td class="td" style="width:40px">
                    <v-btn icon="mdi-eye-outline" size="x-small" variant="text" color="primary"></v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

  </MainLayout>
</template>

<script setup>
import MainLayout from '../components/layouts/MainLayout.vue'
import { formatMoneda, formatEntero } from '../utils/formatters'

const kpis = [
  {
    title: 'INVENTARIO',
    subtitle: 'Gestión de productos y stock',
    icon: 'mdi-package-variant-closed',
    color: '#3b82f6',
    trend: 8.4,
    stats: [
      { value: formatEntero(1250), label: 'Productos' },
      { value: formatEntero(45),   label: 'Bajo stock' },
    ],
  },
  {
    title: 'ÓRDENES',
    subtitle: 'Órdenes de compra activas',
    icon: 'mdi-clipboard-list-outline',
    color: '#8b5cf6',
    trend: 12.1,
    stats: [
      { value: formatEntero(28),  label: 'Pendientes' },
      { value: formatEntero(156), label: 'Este mes' },
    ],
  },
  {
    title: 'GASTOS',
    subtitle: 'Registros contables del período',
    icon: 'mdi-receipt-text-outline',
    color: '#22c55e',
    trend: -3.2,
    stats: [
      { value: formatMoneda(45000, 0), label: 'Este mes' },
      { value: formatEntero(12),       label: 'Registros' },
    ],
  },
  {
    title: 'TESORERÍA',
    subtitle: 'Movimientos bancarios',
    icon: 'mdi-bank-outline',
    color: '#f59e0b',
    trend: 5.7,
    stats: [
      { value: formatMoneda(120000, 0), label: 'Saldo total' },
      { value: formatEntero(8),         label: 'Cuentas' },
    ],
  },
]

const quickActions = [
  { label: 'Nueva Orden de Compra', icon: 'mdi-plus-circle-outline', color: '#3b82f6', action: () => {} },
  { label: 'Registrar Entrega', icon: 'mdi-truck-check-outline', color: '#22c55e', action: () => {} },
  { label: 'Nuevo Gasto', icon: 'mdi-receipt-text-plus-outline', color: '#f59e0b', action: () => {} },
  { label: 'Reportes Gerenciales', icon: 'mdi-chart-areaspline', color: '#8b5cf6', action: () => {} },
]

const tableHeaders = ['ORDEN', 'PROVEEDOR', 'FECHA', 'TOTAL', 'ESTADO', '']

const ordenes = [
  { id: 'OC-2026-001', cliente: 'Empresa ABC',       fecha: '05/15/2026', total: formatMoneda(8500),   estado: 'PENDIENTE', color: 'warning' },
  { id: 'OC-2026-002', cliente: 'Distribuidora XYZ', fecha: '05/14/2026', total: formatMoneda(12300),  estado: 'ENTREGADA', color: 'success' },
  { id: 'OC-2026-003', cliente: 'Retail Store',      fecha: '05/13/2026', total: formatMoneda(5600),   estado: 'FACTURADA', color: 'info' },
  { id: 'OC-2026-004', cliente: 'Tech Solutions',    fecha: '05/12/2026', total: formatMoneda(9200),   estado: 'PENDIENTE', color: 'warning' },
]
</script>

<style scoped>
/* ── KPI CARD ── */
.kpi-card {
  background: rgb(var(--v-theme-surface));
  border-left: none;
  border-right: none;
  border-bottom: none;
  transition: transform 0.2s, box-shadow 0.2s;
}
.kpi-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }

.kpi-title {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.9;
  margin: 0;
}
.kpi-subtitle {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.45);
  margin-top: 4px;
}
.kpi-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.kpi-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
}
.kpi-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.kpi-val {
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.5px;
}
.kpi-lbl {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.4);
}
.kpi-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
}

/* ── SECCIÓN ── */
.section-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  margin-bottom: 16px;
  margin-top: 0;
}

/* ── ACCIONES ── */
.actions-grid { display: flex; flex-direction: column; gap: 8px; }

.action-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  transition: all 0.2s;
  background: transparent;
}
.action-card:hover {
  border-color: var(--ac);
  background: rgba(var(--v-theme-on-surface), 0.03);
  transform: translateX(3px);
}

.action-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.action-label {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  letter-spacing: 0.2px;
}

/* ── TABLA ── */
.orders-table { background: transparent !important; }

.th {
  font-size: 10px !important;
  font-weight: 800 !important;
  letter-spacing: 1.2px !important;
  text-transform: uppercase !important;
  color: rgba(var(--v-theme-on-surface), 0.4) !important;
  padding: 10px 14px !important;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08) !important;
  white-space: nowrap;
}

.td {
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
  padding: 14px 14px !important;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06) !important;
}

.order-row { transition: background 0.15s; }
.order-row:hover td { background: rgba(var(--v-theme-primary), 0.04) !important; }
.order-row:last-child td { border-bottom: none !important; }

.order-id { font-weight: 700; font-size: 12px; letter-spacing: 0.5px; }
.order-total { font-weight: 700; }
</style>
