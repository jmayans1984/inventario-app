<template>
  <MainLayout>
    <div class="view-container">
      <PageHeader
        title="Facturas de Compra"
        description="Gestiona las facturas de compra recibidas"
        :crumbs="['Tesorería', 'Procesos', 'Facturas de Compra']"
      />
      <div class="wip-card">
        <v-icon size="56" class="wip-icon">mdi-receipt-text-outline</v-icon>
        <h2 class="wip-title">Módulo en Desarrollo</h2>
        <p class="wip-sub">Las facturas de compra estarán disponibles próximamente.</p>
        <v-chip color="primary" variant="tonal" size="small" class="mt-4">TESORERÍA · Procesos</v-chip>
      </div>
    </div>
  </MainLayout>
</template>
<script setup>
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
</script>
<style scoped>
.view-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
.wip-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),0.08); border-radius: 16px; padding: 64px 32px; text-align: center; }
.wip-icon { color: var(--gold); opacity: 0.4; display: block; margin: 0 auto 20px; }
.wip-title { font-size: 20px; font-weight: 700; margin: 0 0 8px; }
.wip-sub { font-size: 14px; color: rgba(var(--v-theme-on-surface),0.5); margin: 0; }
</style>
