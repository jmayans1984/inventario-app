<template>
  <MainLayout>
    <div class="pr-container">

      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">GERENCIA</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Reportes</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Puntuación/Reviews</span>
      </div>

      <!-- HEADER -->
      <div class="pr-header">
        <div class="pr-header-icon">
          <v-icon size="28" color="white">mdi-star-outline</v-icon>
        </div>
        <div>
          <h2 class="pr-title">Puntuación y Reviews de Clientes</h2>
          <p class="pr-subtitle">Seguimiento de calificaciones y comentarios de Google y otras plataformas</p>
        </div>
      </div>

      <!-- PANEL VACÍO CON CTA -->
      <div class="pr-empty-state">
        <div class="pr-empty-icon">⭐</div>
        <h3>Integración de Google Reviews</h3>
        <p>Esta funcionalidad está en desarrollo. Próximamente podrás:</p>
        <ul class="pr-features">
          <li>Ver reviews de Google My Business por ubicación</li>
          <li>Hacer seguimiento de calificaciones y tendencias</li>
          <li>Recibir alertas de nuevos reviews</li>
          <li>Analizar sentimiento de comentarios</li>
        </ul>
        <v-btn
          color="#fbbf24"
          variant="elevated"
          prepend-icon="mdi-cog-outline"
          disabled
          class="mt-6"
        >
          Configurar Google My Business
        </v-btn>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '../../components/layouts/MainLayout.vue'
</script>

<style scoped>
.pr-container { padding: 0 0 32px; }

/* BREADCRUMB */
.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: rgba(var(--v-theme-on-surface), 0.4); text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.25); }
.bc-cat { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-current { font-size: 11px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }

/* HEADER */
.pr-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
.pr-header-icon {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  display: flex; align-items: center; justify-content: center;
}
.pr-title { font-size: 22px; font-weight: 800; margin: 0 0 2px; color: rgb(var(--v-theme-on-surface)); text-transform: uppercase; }
.pr-subtitle { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 0; }

/* EMPTY STATE */
.pr-empty-state {
  background: rgb(var(--v-theme-surface));
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 16px;
  padding: 48px 32px;
  text-align: center;
  margin-top: 24px;
}
.pr-empty-icon { font-size: 64px; margin-bottom: 16px; }
.pr-empty-state h3 { font-size: 20px; font-weight: 700; margin: 0 0 8px; color: rgb(var(--v-theme-on-surface)); }
.pr-empty-state p { font-size: 14px; color: rgba(var(--v-theme-on-surface), 0.6); margin: 0 0 16px; }
.pr-features {
  list-style: none;
  padding: 0;
  margin: 16px 0;
  display: inline-block;
  text-align: left;
}
.pr-features li {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  padding: 6px 0;
  padding-left: 24px;
  position: relative;
}
.pr-features li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #fbbf24;
  font-weight: 700;
}
</style>
