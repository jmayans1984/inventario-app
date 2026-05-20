<template>
  <MainLayout>
    <div class="view-container">
      <div class="breadcrumb">
        <span class="bc-root">TESORERÍA</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Ventas de Productos</span>
      </div>

      <div class="page-header">
        <div class="header-left">
          <div class="header-icon-wrap">
            <v-icon size="22" color="white">mdi-package-variant-closed</v-icon>
          </div>
          <div>
            <h1 class="page-title">VENTAS POR PRODUCTO</h1>
            <p class="page-sub">Detalle de ventas desglosado por producto y período</p>
          </div>
        </div>
        <div class="header-actions">
          <v-btn variant="outlined" prepend-icon="mdi-file-pdf-box" color="error" size="small">
            PDF
          </v-btn>
          <v-btn variant="outlined" prepend-icon="mdi-file-excel-box" color="success" size="small">
            Excel
          </v-btn>
        </div>
      </div>

      <div class="filtros-bar">
        <v-text-field
          label="Fecha Inicio"
          type="date"
          variant="outlined"
          size="small"
        />
        <v-text-field
          label="Fecha Fin"
          type="date"
          variant="outlined"
          size="small"
        />
        <v-btn variant="text" prepend-icon="mdi-refresh" size="small">
          Actualizar
        </v-btn>
      </div>

      <div class="info-card">
        <v-icon size="48" class="info-icon">mdi-package-variant-closed</v-icon>
        <h3>Reporte de Ventas por Producto</h3>
        <p>Este reporte muestra el desempeño de cada producto durante un período, permitiendo identificar los productos más vendidos y rentables.</p>
        <div class="features-list">
          <div class="feature-item">
            <v-icon size="20" color="success">mdi-check-circle-outline</v-icon>
            <span>Ventas por producto y período</span>
          </div>
          <div class="feature-item">
            <v-icon size="20" color="success">mdi-check-circle-outline</v-icon>
            <span>Cantidad y valor de unidades vendidas</span>
          </div>
          <div class="feature-item">
            <v-icon size="20" color="success">mdi-check-circle-outline</v-icon>
            <span>Productos más y menos vendidos</span>
          </div>
          <div class="feature-item">
            <v-icon size="20" color="success">mdi-check-circle-outline</v-icon>
            <span>Exportación a PDF y Excel</span>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '../../components/layouts/MainLayout.vue'
</script>

<style scoped>
.view-container { padding: 24px; max-width: 1400px; margin: 0 auto; }

.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }

.bc-root { font-size: 12px; font-weight: 700; color: #06b6d4; text-transform: uppercase; letter-spacing: 0.5px; }

.bc-sep { color: rgba(var(--v-theme-on-surface), 0.3); }

.bc-cat { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.5); }

.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.8); font-weight: 500; }

.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }

.header-left { display: flex; align-items: center; gap: 16px; }

.header-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#06b6d4,#0891b2); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(6,182,212,0.35); }

.page-title { font-size: 20px; font-weight: 800; letter-spacing: 0.5px; margin: 0; }

.page-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 2px 0 0; }

.filtros-bar { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; }

.info-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),0.08); border-radius: 16px; padding: 40px 32px; text-align: center; }

.info-icon { color: rgba(6,182,212,0.4); margin-bottom: 16px; }

.info-card h3 { font-size: 18px; font-weight: 700; margin: 16px 0 8px; }

.info-card p { font-size: 14px; color: rgba(var(--v-theme-on-surface),0.6); margin: 0 0 24px; max-width: 600px; }

.features-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; }

.feature-item { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid rgba(var(--v-theme-on-surface),0.08); border-radius: 8px; }
</style>
