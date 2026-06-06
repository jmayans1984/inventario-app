<template>
  <MainLayout>
    <div class="view-container">
      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">PROVEEDURÍA</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Informes</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Órdenes de Compra</span>
      </div>

      <!-- INFO CARD -->
      <div class="info-card">
        <div class="card-icon">
          <v-icon size="48" color="white">mdi-file-text-outline</v-icon>
        </div>
        <h2 class="card-title">Informe de Órdenes de Compra</h2>
        <p class="card-description">Analiza el rendimiento de ventas basado en órdenes recibidas. Filtra por período, cliente o estado.</p>
        <p class="card-status">En desarrollo...</p>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '../../components/layouts/MainLayout.vue'
</script>

<style scoped>
.view-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

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

.bc-sep {
  color: rgba(var(--v-theme-on-surface), 0.3);
}

.bc-cat {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.bc-current {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.8);
  font-weight: 500;
}

.info-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
}

.card-icon {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(6, 182, 212, 0.35);
}

.card-title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0.5px;
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
}

.card-description {
  font-size: 14px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  max-width: 400px;
  margin: 0;
}

.card-status {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  font-style: italic;
  margin: 8px 0 0;
}
</style>
