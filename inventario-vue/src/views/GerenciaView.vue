<template>
  <MainLayout>
    <div class="breadcrumb-bar mb-5"><span class="bc-root">GERENCIA</span></div>
    <v-row class="mb-5" dense>
      <v-col cols="12">
        <div class="module-hero" style="--mc: #06b6d4">
          <div class="hero-content">
            <div class="hero-icon-wrap"><v-icon size="32" color="white">mdi-chart-line</v-icon></div>
            <div><p class="hero-title">Módulo de Gerencia</p><p class="hero-sub">Análisis y reportes estratégicos</p></div>
          </div>
          <div class="hero-stats">
            <div class="hero-stat"><span class="hs-val">$450K</span><span class="hs-lbl">Ingresos YTD</span></div>
            <div class="hero-stat"><span class="hs-val">92%</span><span class="hs-lbl">Desempeño</span></div>
            <div class="hero-stat"><span class="hs-val">15</span><span class="hs-lbl">KPIs Activos</span></div>
          </div>
        </div>
      </v-col>
    </v-row>
    <v-row dense>
      <v-col cols="12" sm="6" lg="3">
        <v-card elevation="0" rounded="lg" class="module-card" style="--mc: #06b6d4" @click="router.push('/gerencia/reportes/ejecutivo')">
          <v-card-text class="pa-5">
            <div class="mc-icon-wrap mb-3"><v-icon size="22" color="#06b6d4">mdi-view-dashboard-outline</v-icon></div>
            <p class="mc-title">Dashboard Ejecutivo</p><p class="mc-desc">Vista estratégica</p>
            <div class="mc-footer mt-3"><span class="mc-count">Ver dashboard</span><v-icon size="14" color="#06b6d4">mdi-arrow-right</v-icon></div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card elevation="0" rounded="lg" class="module-card" style="--mc: #06b6d4" @click="router.push('/gerencia/reportes/kpis')">
          <v-card-text class="pa-5">
            <div class="mc-icon-wrap mb-3"><v-icon size="22" color="#06b6d4">mdi-gauge</v-icon></div>
            <p class="mc-title">KPIs</p><p class="mc-desc">Indicadores de desempeño</p>
            <div class="mc-footer mt-3"><span class="mc-count">15 activos</span><v-icon size="14" color="#06b6d4">mdi-arrow-right</v-icon></div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card elevation="0" rounded="lg" class="module-card" style="--mc: #06b6d4" @click="router.push('/gerencia/procesos/analisis')">
          <v-card-text class="pa-5">
            <div class="mc-icon-wrap mb-3"><v-icon size="22" color="#06b6d4">mdi-magnify-scan</v-icon></div>
            <p class="mc-title">Análisis de Datos</p><p class="mc-desc">Exploración de datos</p>
            <div class="mc-footer mt-3"><span class="mc-count">Ver análisis</span><v-icon size="14" color="#06b6d4">mdi-arrow-right</v-icon></div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </MainLayout>
</template>
<script setup>
import { useRouter } from 'vue-router'
import MainLayout from '../components/layouts/MainLayout.vue'
const router = useRouter()
</script>
<style scoped>
.breadcrumb-bar { display: flex; align-items: center; gap: 6px; }
.bc-root { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: rgba(var(--v-theme-on-surface), 0.4); text-transform: uppercase; }
.module-hero { background: linear-gradient(135deg, var(--mc) 0%, rgba(var(--v-theme-on-surface), 0.8) 100%); border-radius: 12px; padding: 24px; display: flex; justify-content: space-between; align-items: center; gap: 24px; color: white; }
.hero-content { display: flex; align-items: center; gap: 16px; flex: 1; }
.hero-icon-wrap { width: 56px; height: 56px; background: rgba(255, 255, 255, 0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.hero-title { margin: 0; font-size: 18px; font-weight: 700; }
.hero-sub { margin: 4px 0 0; font-size: 13px; opacity: 0.85; }
.hero-stats { display: flex; gap: 20px; align-items: center; }
.hero-stat { display: flex; flex-direction: column; align-items: center; }
.hs-val { font-size: 16px; font-weight: 700; }
.hs-lbl { font-size: 10px; opacity: 0.8; margin-top: 2px; }
.module-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface), 0.08); transition: all 0.2s; cursor: pointer; }
.module-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12); border-color: var(--mc); }
.mc-icon-wrap { width: 44px; height: 44px; background: rgba(var(--v-theme-on-surface), 0.06); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.mc-title { margin: 0; font-size: 14px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }
.mc-desc { margin: 6px 0 0; font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.6); }
.mc-footer { display: flex; justify-content: space-between; align-items: center; }
.mc-count { font-size: 11px; font-weight: 600; color: var(--mc); }
@media (max-width: 768px) { .module-hero { flex-direction: column; } .hero-stats { width: 100%; justify-content: space-around; } }
</style>
