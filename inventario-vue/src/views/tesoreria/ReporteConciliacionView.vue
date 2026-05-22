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
            <v-icon size="22" color="white">mdi-bank-check</v-icon>
          </div>
          <div>
            <h1 class="page-title">CONCILIACIÓN BANCARIA</h1>
            <p class="page-sub">Saldos y movimientos pendientes por cuenta bancaria</p>
          </div>
        </div>
        <div class="header-actions">
          <v-btn
            variant="outlined"
            prepend-icon="mdi-file-pdf-box"
            @click="exportarPDF"
            :loading="cargando"
            color="error"
          >
            PDF
          </v-btn>
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="cargando" class="loading-wrap">
        <v-progress-circular indeterminate color="primary" size="40" />
        <p class="loading-text">Cargando reporte...</p>
      </div>

      <!-- CUENTAS Y REPORTE -->
      <div v-else>
        <!-- RESUMEN GENERAL -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon-wrap kpi-icon-cyan">
              <v-icon size="20" color="white">mdi-bank-outline</v-icon>
            </div>
            <div class="kpi-body">
              <div class="kpi-label">CUENTAS ACTIVAS</div>
              <div class="kpi-value">{{ cuentas.length }}</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon-wrap kpi-icon-blue">
              <v-icon size="20" color="white">mdi-cash-multiple</v-icon>
            </div>
            <div class="kpi-body">
              <div class="kpi-label">SALDO ANTERIOR</div>
              <div class="kpi-value">{{ formatMoneda(totalSaldoAnterior) }}</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon-wrap kpi-icon-orange">
              <v-icon size="20" color="white">mdi-progress-question</v-icon>
            </div>
            <div class="kpi-body">
              <div class="kpi-label">MOVIMIENTOS PENDIENTES</div>
              <div class="kpi-value">{{ formatMoneda(totalMovimientosPendientes) }}</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon-wrap kpi-icon-green">
              <v-icon size="20" color="white">mdi-calculator-variant</v-icon>
            </div>
            <div class="kpi-body">
              <div class="kpi-label">SALDO FUTURO PROYECTADO</div>
              <div class="kpi-value">{{ formatMoneda(totalSaldoFinal) }}</div>
            </div>
          </div>
        </div>

        <!-- CUENTAS POR CUENTA -->
        <div v-if="cuentas.length > 0" class="cuentas-grid">
          <div v-for="cuenta in cuentas" :key="cuenta.codigo" class="cuenta-card">
            <!-- ENCABEZADO DE LA CUENTA -->
            <div class="cuenta-header">
              <div class="cuenta-info">
                <h3 class="cuenta-nombre">{{ cuenta.numero }} - {{ cuenta.nombre }}</h3>
                <p class="cuenta-banco">{{ cuenta.banco }}</p>
              </div>
            </div>

            <!-- RESUMEN DE LA CUENTA -->
            <div class="resumen-valores">
              <div class="valor-item">
                <span class="valor-label">Saldo Anterior Conciliado</span>
                <span class="valor-amount cyan-text">{{ formatMoneda(cuenta.saldoAnterior || 0) }}</span>
              </div>
              <div class="valor-item">
                <span class="valor-label">+ Movimientos Pendientes</span>
                <span class="valor-amount orange-text">{{ formatMoneda(cuenta.totalMovimientos || 0) }}</span>
              </div>
              <div class="valor-item border-top">
                <span class="valor-label font-bold">= Saldo Futuro Proyectado</span>
                <span class="valor-amount green-text font-bold">{{ formatMoneda(cuenta.saldoFinal || 0) }}</span>
              </div>
            </div>

            <!-- MOVIMIENTOS PENDIENTES -->
            <div v-if="cuenta.movimientosPendientes && cuenta.movimientosPendientes.length > 0" class="movimientos-section">
              <div class="section-title">
                Movimientos Pendientes ({{ cuenta.movimientosPendientes.length }})
              </div>
              <div class="tabla-wrapper">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th class="col-fecha">FECHA</th>
                      <th class="col-numero">NÚMERO</th>
                      <th class="col-tipo">TIPO</th>
                      <th class="col-concepto">CONCEPTO</th>
                      <th class="col-monto">MONTO</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="mov in cuenta.movimientosPendientes" :key="mov.id" class="tabla-row">
                      <td class="col-fecha">{{ formatFecha(mov.fecha) }}</td>
                      <td class="col-numero">{{ mov.numero }}</td>
                      <td class="col-tipo">
                        <v-chip
                          :color="mov.tipo === 'ING' ? 'success' : 'error'"
                          variant="flat"
                          size="x-small"
                        >
                          {{ mov.tipo }}
                        </v-chip>
                      </td>
                      <td class="col-concepto">{{ mov.concepto }}</td>
                      <td class="col-monto">
                        <span :class="mov.tipo === 'ING' ? 'text-green' : 'text-red'">
                          {{ formatMoneda(mov.monto) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div v-else class="no-movimientos">
              <v-icon size="32">mdi-check-circle-outline</v-icon>
              <p>Todos los movimientos están conciliados</p>
            </div>
          </div>
        </div>

        <!-- EMPTY STATE -->
        <div v-else class="empty-state">
          <v-icon size="48" class="empty-icon">mdi-bank-outline</v-icon>
          <p class="empty-title">No hay cuentas bancarias</p>
          <p class="empty-sub">No se encontraron cuentas bancarias activas para mostrar</p>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import cuentasBancariasService from '../../services/cuentasbancarias.service'
import api from '../../services/api'
import { formatMoneda, formatFecha } from '../../utils/formatters'
import { useAuthStore } from '../../stores/auth'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const cuentas = ref([])
const cargando = ref(false)
const authStore = useAuthStore()

const totalSaldoAnterior = computed(() =>
  cuentas.value.reduce((sum, c) => sum + (parseFloat(c.saldoAnterior) || 0), 0)
)

const totalMovimientosPendientes = computed(() =>
  cuentas.value.reduce((sum, c) => sum + (parseFloat(c.totalMovimientos) || 0), 0)
)

const totalSaldoFinal = computed(() =>
  cuentas.value.reduce((sum, c) => sum + (parseFloat(c.saldoFinal) || 0), 0)
)

async function cargarReporte() {
  cargando.value = true
  try {
    // Obtener cuentas bancarias activas
    const respCuentas = await cuentasBancariasService.getCuentas({ estado: 'ACTIVA' })
    const cuentasData = Array.isArray(respCuentas) ? respCuentas : (respCuentas.data || [])

    // Para cada cuenta, obtener los movimientos pendientes
    const cuentasConDatos = await Promise.all(
      cuentasData.map(async (cuenta) => {
        try {
          const response = await api.get(`/tesoreria/cuentas-bancarias/${cuenta.codigo}/reporte-conciliacion`, {
            params: { empresa: authStore.empresa?.codigo }
          })
          const datos = response.data?.data || {}
          return {
            ...cuenta,
            saldoAnterior: datos.saldoAnterior || 0,
            totalMovimientos: datos.totalMovimientos || 0,
            saldoFinal: (datos.saldoAnterior || 0) + (datos.totalMovimientos || 0),
            movimientosPendientes: datos.movimientosPendientes || []
          }
        } catch (err) {
          console.error(`Error cargando reporte para cuenta ${cuenta.codigo}:`, err)
          return {
            ...cuenta,
            saldoAnterior: 0,
            totalMovimientos: 0,
            saldoFinal: 0,
            movimientosPendientes: []
          }
        }
      })
    )

    cuentas.value = cuentasConDatos
  } catch (err) {
    console.error('Error cargando reporte:', err)
  } finally {
    cargando.value = false
  }
}

async function exportarPDF() {
  cargando.value = true
  try {
    const elemento = document.querySelector('.view-container')
    const canvas = await html2canvas(elemento, { scale: 2 })
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgData = canvas.toDataURL('image/png')
    const imgWidth = 210 - 20
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
    pdf.save('conciliacion-bancaria.pdf')
  } catch (err) {
    console.error('Error exportando PDF:', err)
    alert('Error al generar PDF')
  } finally {
    cargando.value = false
  }
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

/* ── Breadcrumb ── */
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

.bc-sep { color: rgba(var(--v-theme-on-surface), 0.3); }
.bc-cat { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.8); font-weight: 500; }

/* ── Header ── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.header-left { display: flex; align-items: center; gap: 16px; }
.header-icon-wrap {
  width: 48px; height: 48px; border-radius: 12px;
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 14px rgba(6, 182, 212, 0.35);
}

.page-title { font-size: 20px; font-weight: 800; letter-spacing: 0.5px; margin: 0; }
.page-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 2px 0 0; }

.header-actions { display: flex; gap: 8px; }

/* ── KPI Cards ── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.kpi-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.kpi-icon-wrap {
  width: 44px; height: 44px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.kpi-icon-cyan { background: linear-gradient(135deg, #06b6d4, #0891b2); box-shadow: 0 4px 12px rgba(6,182,212,0.3); }
.kpi-icon-blue { background: linear-gradient(135deg, #3b82f6, #2563eb); box-shadow: 0 4px 12px rgba(59,130,246,0.3); }
.kpi-icon-orange { background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 4px 12px rgba(245,158,11,0.3); }
.kpi-icon-green { background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 12px rgba(16,185,129,0.3); }

.kpi-body { flex: 1; min-width: 0; }
.kpi-label { font-size: 10px; font-weight: 700; color: rgba(var(--v-theme-on-surface), 0.5); text-transform: uppercase; letter-spacing: 0.5px; }
.kpi-value { font-size: 22px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); margin: 2px 0; }

/* ── Loading ── */
.loading-wrap { text-align: center; padding: 60px; }
.loading-text { color: rgba(var(--v-theme-on-surface), 0.5); font-size: 13px; margin-top: 12px; }

/* ── Cuentas Grid ── */
.cuentas-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

.cuenta-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  padding: 20px;
}

.cuenta-header {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(var(--v-theme-on-surface), 0.08);
}

.cuenta-info { }
.cuenta-nombre { font-size: 16px; font-weight: 700; margin: 0; color: rgb(var(--v-theme-on-surface)); }
.cuenta-banco { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.6); margin: 4px 0 0; }

/* ── Resumen de Valores ── */
.resumen-valores {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-radius: 8px;
}

.valor-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.valor-item.border-top {
  border-top: 2px solid rgba(var(--v-theme-on-surface), 0.2);
  padding-top: 8px;
}

.valor-label { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.6); text-transform: uppercase; letter-spacing: 0.5px; }
.valor-amount { font-size: 18px; font-weight: 700; font-family: 'Courier New', monospace; }

.cyan-text { color: #06b6d4; }
.orange-text { color: #f59e0b; }
.green-text { color: #10b981; }

.font-bold { font-weight: 700; }

/* ── Movimientos ── */
.movimientos-section {
  margin-top: 20px;
}

.section-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

.tabla-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table thead { background: rgba(var(--v-theme-on-surface), 0.04); }
.data-table thead th {
  padding: 12px 10px; text-align: left; font-weight: 700;
  font-size: 11px; letter-spacing: 0.5px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.6);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.data-table tbody tr { border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); }
.data-table tbody tr:hover { background: rgba(var(--v-theme-on-surface), 0.02); }
.data-table tbody td { padding: 11px 10px; color: rgb(var(--v-theme-on-surface)); }

.col-fecha { width: 100px; white-space: nowrap; }
.col-numero { width: 100px; font-family: 'Courier New', monospace; }
.col-tipo { width: 80px; text-align: center; }
.col-concepto { flex: 1; min-width: 200px; }
.col-monto { width: 120px; text-align: right; font-family: 'Courier New', monospace; font-weight: 600; }

.text-green { color: #10b981; font-weight: 600; }
.text-red { color: #ef4444; font-weight: 600; }

.no-movimientos {
  text-align: center;
  padding: 32px 24px;
  color: rgba(var(--v-theme-on-surface), 0.4);
}

.no-movimientos p { margin: 8px 0 0; font-size: 13px; }

/* ── Empty State ── */
.empty-state {
  text-align: center;
  padding: 80px 24px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
}

.empty-icon { color: rgba(var(--v-theme-on-surface), 0.15); display: block; margin: 0 auto 12px; }
.empty-title { font-size: 16px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); margin: 0 0 4px; }
.empty-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.4); margin: 0; }
</style>
