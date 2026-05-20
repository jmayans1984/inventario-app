<template>
  <MainLayout>
    <div class="view-container">
      <div class="breadcrumb">
        <span class="bc-root">ALMACÉN</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Configuración</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Control de Inventario</span>
      </div>

      <div class="page-header">
        <div class="header-left">
          <div class="header-icon-wrap">
            <v-icon size="22" color="white">mdi-warehouse</v-icon>
          </div>
          <div>
            <h1 class="page-title">CONTROL DE INVENTARIO</h1>
            <p class="page-sub">Configura puntos de reorden y límites de stock</p>
          </div>
        </div>
      </div>

      <div class="info-card">
        <v-icon size="48" class="info-icon">mdi-warehouse</v-icon>
        <h3>Control de Inventario</h3>
        <p>Define los parámetros de control para cada producto: punto de reorden, stock máximo, stock de seguridad.</p>
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
.bc-root { font-size: 12px; font-weight: 700; color: #06b6d4; text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.3); }
.bc-cat { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.8); font-weight: 500; }
.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
.header-left { display: flex; align-items: center; gap: 16px; }
.header-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#06b6d4,#0891b2); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(6,182,212,0.35); }
.page-title { font-size: 20px; font-weight: 800; margin: 0; }
.page-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 2px 0 0; }
.info-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),0.08); border-radius: 16px; padding: 40px 32px; text-align: center; }
.info-icon { color: rgba(6,182,212,0.4); margin-bottom: 16px; }
.info-card h3 { font-size: 18px; font-weight: 700; margin: 16px 0 8px; }
.info-card p { font-size: 14px; color: rgba(var(--v-theme-on-surface),0.6); margin: 0; }
</style>
