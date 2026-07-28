<template>
  <MainLayout>
    <div class="view-container">
      <PageHeader
        title="Informe de Lista de Precios"
        description="Visualiza y exporta los precios de tus productos"
        :crumbs="['Proveeduría', 'Informes', 'Lista de Precios']"
      />

      <!-- INFO CARD -->
      <div class="info-card">
        <div class="card-icon">
          <v-icon size="48" color="white">mdi-file-chart-outline</v-icon>
        </div>
        <h2 class="card-title">En Desarrollo</h2>
        <p class="card-description">Genera reportes de lista de precios por grupo, cliente o período.</p>
        <p class="card-status">Próximamente disponible...</p>
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

.info-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface), 0.08); border-radius: 12px; padding: 48px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; margin-top: 32px; }
.card-icon { width: 80px; height: 80px; border-radius: 12px; background: linear-gradient(135deg, var(--indigo), color-mix(in srgb, var(--indigo) 70%, black)); display: flex; align-items: center; justify-content: center; }
.card-title { font-size: 24px; font-weight: 800; letter-spacing: 0.5px; margin: 0; color: rgb(var(--v-theme-on-surface)); }
.card-description { font-size: 14px; color: rgba(var(--v-theme-on-surface), 0.6); max-width: 400px; margin: 0; }
.card-status { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.4); font-style: italic; margin: 8px 0 0; }
</style>
