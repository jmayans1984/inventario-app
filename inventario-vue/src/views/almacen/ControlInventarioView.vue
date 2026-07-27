<template>
  <MainLayout>
    <div class="view-container">
      <PageHeader
        title="Control de Inventario"
        description="Configura puntos de reorden y límites de stock"
        :crumbs="['Almacén', 'Configuración', 'Control de Inventario']"
      />

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
import PageHeader from '../../components/common/PageHeader.vue'
</script>

<style scoped>
.view-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
.info-card { background: rgb(var(--v-theme-surface)); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 40px 32px; text-align: center; }
.info-icon { color: var(--indigo); opacity: 0.4; margin-bottom: 16px; }
.info-card h3 { font-size: 18px; font-weight: 700; margin: 16px 0 8px; }
.info-card p { font-size: 14px; color: var(--ink-600); margin: 0; }
</style>
