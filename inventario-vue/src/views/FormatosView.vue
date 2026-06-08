<template>
  <MainLayout>
    <div class="fmt-container">
      <div class="fmt-breadcrumb">
        <span class="bc-root">FORMATOS / DOCS</span>
      </div>
      <div class="fmt-header">
        <div class="fmt-header-left">
          <div class="fmt-icon-wrap">
            <v-icon size="22" color="white">mdi-file-document-multiple-outline</v-icon>
          </div>
          <div>
            <h1 class="fmt-title">FORMATOS Y DOCUMENTOS</h1>
            <p class="fmt-sub">Gestión de formatos, plantillas y documentos del sistema</p>
          </div>
        </div>
      </div>
      <div class="fmt-empty">
        <v-icon size="64" color="rgba(var(--v-theme-on-surface),.15)">mdi-file-document-multiple-outline</v-icon>
        <p>Módulo en construcción</p>
        <span>Aquí podrás gestionar formatos y documentos</span>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '../components/layouts/MainLayout.vue'
</script>

<style scoped>
.fmt-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
.fmt-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 12px; font-weight: 700; color: #06b6d4; text-transform: uppercase; letter-spacing: .5px; }
.fmt-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
.fmt-header-left { display: flex; align-items: center; gap: 16px; }
.fmt-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#8b5cf6,#7c3aed); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(139,92,246,.35); flex-shrink: 0; }
.fmt-title { font-size: 20px; font-weight: 800; letter-spacing: .5px; margin: 0; }
.fmt-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }
.fmt-empty { text-align: center; padding: 80px 20px; color: rgba(var(--v-theme-on-surface),.4); }
.fmt-empty p { font-size: 18px; font-weight: 600; margin: 16px 0 8px; color: rgba(var(--v-theme-on-surface),.5); }
.fmt-empty span { font-size: 13px; }
</style>
