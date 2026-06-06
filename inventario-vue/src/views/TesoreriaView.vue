<template>
  <MainLayout>
    <div class="mod-container">

      <!-- HERO -->
      <div class="mod-hero" style="background: linear-gradient(135deg,#0369a1,#075985)">
        <div class="mod-hero-left">
          <div class="mod-hero-icon"><v-icon size="28" color="white">mdi-bank-transfer</v-icon></div>
          <div>
            <div class="mod-hero-title">TESORERÍA</div>
            <div class="mod-hero-sub">Movimientos bancarios, conciliación, ventas y facturas</div>
          </div>
        </div>
      </div>

      <!-- CONFIGURACIÓN -->
      <div class="mod-section-label">CONFIGURACIÓN</div>
      <div class="mod-grid">
        <div class="mod-card" @click="go('/tesoreria/configuracion/cuentas-bancarias')">
          <div class="mod-card-icon" style="background:rgba(14,165,233,.12)">
            <v-icon size="22" color="#0ea5e9">mdi-bank-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Cuentas Bancarias</div>
            <div class="mod-card-desc">Gestiona las cuentas bancarias de la empresa</div>
          </div>
          <v-icon size="16" color="#0ea5e9" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>
      </div>

      <!-- PROCESOS -->
      <div class="mod-section-label">PROCESOS</div>
      <div class="mod-grid">
        <div class="mod-card" @click="go('/tesoreria/procesos/movimientos-bancarios')">
          <div class="mod-card-icon" style="background:rgba(14,165,233,.12)">
            <v-icon size="22" color="#0ea5e9">mdi-swap-horizontal</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Movimientos Bancarios</div>
            <div class="mod-card-desc">Registro de ingresos y egresos bancarios</div>
          </div>
          <v-icon size="16" color="#0ea5e9" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/tesoreria/procesos/conciliacion-cuentas')">
          <div class="mod-card-icon" style="background:rgba(14,165,233,.12)">
            <v-icon size="22" color="#0ea5e9">mdi-check-all</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Conciliación Bancaria</div>
            <div class="mod-card-desc">Concilia movimientos con extractos bancarios</div>
          </div>
          <v-icon size="16" color="#0ea5e9" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/tesoreria/procesos/importar-ventas')">
          <div class="mod-card-icon" style="background:rgba(14,165,233,.12)">
            <v-icon size="22" color="#0ea5e9">mdi-file-import-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Importar Ventas</div>
            <div class="mod-card-desc">Importa ventas desde archivos CSV o Excel</div>
          </div>
          <v-icon size="16" color="#0ea5e9" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/tesoreria/procesos/facturas-compra')">
          <div class="mod-card-icon" style="background:rgba(14,165,233,.12)">
            <v-icon size="22" color="#0ea5e9">mdi-file-document-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Facturas de Compra</div>
            <div class="mod-card-desc">Gestiona facturas recibidas de proveedores</div>
          </div>
          <v-icon size="16" color="#0ea5e9" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/tesoreria/procesos/facturas-venta')">
          <div class="mod-card-icon" style="background:rgba(14,165,233,.12)">
            <v-icon size="22" color="#0ea5e9">mdi-file-send-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Facturas de Venta</div>
            <div class="mod-card-desc">Gestiona facturas emitidas a clientes</div>
          </div>
          <v-icon size="16" color="#0ea5e9" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>
      </div>

      <!-- REPORTES -->
      <div class="mod-section-label">REPORTES</div>
      <div class="mod-grid">
        <div class="mod-card" @click="go('/tesoreria/reportes/conciliacion-bancaria')">
          <div class="mod-card-icon" style="background:rgba(14,165,233,.12)">
            <v-icon size="22" color="#0ea5e9">mdi-file-chart-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Reporte Conciliación</div>
            <div class="mod-card-desc">Estado de conciliación por cuenta bancaria</div>
          </div>
          <v-icon size="16" color="#0ea5e9" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/tesoreria/reportes/movimiento-cuentas')">
          <div class="mod-card-icon" style="background:rgba(14,165,233,.12)">
            <v-icon size="22" color="#0ea5e9">mdi-chart-timeline-variant</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Movimiento de Cuentas</div>
            <div class="mod-card-desc">Historial de movimientos por cuenta y período</div>
          </div>
          <v-icon size="16" color="#0ea5e9" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/tesoreria/reportes/ventas-periodo')">
          <div class="mod-card-icon" style="background:rgba(14,165,233,.12)">
            <v-icon size="22" color="#0ea5e9">mdi-calendar-month-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Ventas por Período</div>
            <div class="mod-card-desc">Resumen de ventas agrupadas por período</div>
          </div>
          <v-icon size="16" color="#0ea5e9" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/tesoreria/reportes/ventas-productos-periodo')">
          <div class="mod-card-icon" style="background:rgba(14,165,233,.12)">
            <v-icon size="22" color="#0ea5e9">mdi-package-variant-closed</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Ventas por Producto</div>
            <div class="mod-card-desc">Ranking de productos más vendidos por período</div>
          </div>
          <v-icon size="16" color="#0ea5e9" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { useRouter } from 'vue-router'
import MainLayout from '../components/layouts/MainLayout.vue'
const router = useRouter()
const go = (path) => router.push(path)
</script>

<style scoped>
.mod-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
.mod-hero { border-radius: 16px; padding: 24px 28px; margin-bottom: 28px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.mod-hero-left { display: flex; align-items: center; gap: 16px; }
.mod-hero-icon { width: 52px; height: 52px; border-radius: 13px; background: rgba(255,255,255,.18); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mod-hero-title { font-size: 22px; font-weight: 900; color: white; letter-spacing: .5px; }
.mod-hero-sub { font-size: 13px; color: rgba(255,255,255,.7); margin-top: 3px; }
.mod-section-label { font-size: 10px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.35); margin: 20px 0 10px; }
.mod-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; margin-bottom: 4px; }
.mod-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 12px; background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.07); cursor: pointer; transition: all .15s; }
.mod-card:hover { border-color: #0ea5e9; background: rgba(14,165,233,.03); transform: translateX(3px); }
.mod-card-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mod-card-body { flex: 1; min-width: 0; }
.mod-card-title { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
.mod-card-desc { font-size: 11px; color: rgba(var(--v-theme-on-surface),.5); line-height: 1.4; }
.mod-card-arrow { flex-shrink: 0; opacity: .5; transition: opacity .15s; }
.mod-card:hover .mod-card-arrow { opacity: 1; }
</style>
