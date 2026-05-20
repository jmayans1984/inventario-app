<template>
  <MainLayout>
    <div class="view-container">
      <div class="breadcrumb"><span class="bc-root">TESORERÍA</span><v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon><span class="bc-cat">Procesos</span><v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon><span class="bc-current">Conciliación de Cuentas</span></div>
      <div class="page-header"><div class="header-left"><div class="header-icon-wrap"><v-icon size="22" color="white">mdi-bank-check</v-icon></div><div><h1 class="page-title">CONCILIACIÓN DE CUENTAS</h1><p class="page-sub">Concilia movimientos bancarios con registros contables</p></div></div><v-btn class="btn-nuevo" prepend-icon="mdi-plus">Nueva Conciliación</v-btn></div>
      <div class="wip-card"><v-icon size="56" class="wip-icon">mdi-bank-check</v-icon><h2 class="wip-title">Módulo en Desarrollo</h2><p class="wip-sub">La conciliación de cuentas estará disponible próximamente.</p><v-chip color="teal" variant="tonal" size="small" class="mt-4">TESORERÍA · Procesos</v-chip></div>
    </div>
  </MainLayout>
</template>
<script setup>import MainLayout from '../../components/layouts/MainLayout.vue'</script>
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
.btn-nuevo { background: linear-gradient(135deg,#06b6d4,#0891b2); color: white !important; font-weight: 600; border-radius: 10px; text-transform: none; box-shadow: 0 4px 14px rgba(6,182,212,0.35); }
.wip-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),0.08); border-radius: 16px; padding: 64px 32px; text-align: center; }
.wip-icon { color: rgba(6,182,212,0.4); display: block; margin: 0 auto 20px; }
.wip-title { font-size: 20px; font-weight: 700; margin: 0 0 8px; }
.wip-sub { font-size: 14px; color: rgba(var(--v-theme-on-surface),0.5); margin: 0; }
</style>
