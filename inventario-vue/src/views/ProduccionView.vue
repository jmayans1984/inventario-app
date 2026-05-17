<template>
  <MainLayout>

    <div class="breadcrumb-bar mb-5">
      <span class="bc-root">PRODUCCIÓN</span>
      <template v-if="sectionLabel">
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-section">{{ sectionLabel }}</span>
      </template>
      <template v-if="itemLabel">
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-item">{{ itemLabel }}</span>
      </template>
    </div>

    <template v-if="!route.params.item && !route.params.section">

      <v-row class="mb-5" dense>
        <v-col cols="12">
          <div class="module-hero" style="background:linear-gradient(135deg,#10b981 0%,#059669 100%)">
            <div class="hero-content">
              <div class="hero-icon-wrap">
                <v-icon size="32" color="white">mdi-factory</v-icon>
              </div>
              <div>
                <p class="hero-title">Módulo de Producción</p>
                <p class="hero-sub">Control de órdenes de producción, recetas y calidad</p>
              </div>
            </div>
            <div class="hero-stats">
              <div class="hero-stat" v-for="s in heroStats" :key="s.label">
                <span class="hs-val">{{ s.value }}</span>
                <span class="hs-lbl">{{ s.label }}</span>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>

      <v-row dense class="mb-4">
        <v-col v-for="card in moduleCards" :key="card.title" cols="12" sm="6" lg="4">
          <v-card elevation="0" rounded="lg" class="module-card" style="--mc:#10b981" @click="router.push(card.path)">
            <v-card-text class="pa-5">
              <div class="d-flex align-center gap-3 mb-4">
                <div class="mc-icon-wrap" style="background:rgba(16,185,129,0.12)">
                  <v-icon size="22" color="#10b981">{{ card.icon }}</v-icon>
                </div>
                <div>
                  <p class="mc-title">{{ card.title }}</p>
                  <p class="mc-desc" style="margin-top:2px">{{ card.desc }}</p>
                </div>
              </div>
              <div class="mc-footer">
                <span class="mc-count">{{ card.count }}</span>
                <v-icon size="14" color="#10b981">mdi-arrow-right</v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Estado de órdenes -->
      <v-row dense>
        <v-col cols="12">
          <v-card elevation="0" rounded="lg">
            <v-card-text class="pa-5">
              <p class="section-label">ESTADO DE ÓRDENES DE PRODUCCIÓN</p>
              <div class="status-grid">
                <div class="status-item" v-for="st in estadoOrdenes" :key="st.label">
                  <div class="status-bar" :style="{height: st.pct + '%', background: st.color}"></div>
                  <span class="status-val" :style="{color: st.color}">{{ st.val }}</span>
                  <span class="status-lbl">{{ st.label }}</span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <template v-else>
      <v-card elevation="0" rounded="lg">
        <v-card-text class="pa-8 text-center">
          <div class="coming-icon mb-4" style="background:rgba(16,185,129,0.1)">
            <v-icon size="48" color="#10b981">{{ pageIcon }}</v-icon>
          </div>
          <p class="coming-title">{{ itemLabel || sectionLabel }}</p>
          <p class="coming-sub">Este módulo está en desarrollo. Estará disponible pronto.</p>
          <v-btn class="mt-5" variant="tonal" color="#10b981" @click="router.push('/produccion')">
            <v-icon start>mdi-arrow-left</v-icon> Volver a Producción
          </v-btn>
        </v-card-text>
      </v-card>
    </template>

  </MainLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayout from '../components/layouts/MainLayout.vue'

const route = useRoute()
const router = useRouter()

const sectionMap = { configuracion: 'Configuración', procesos: 'Procesos', reportes: 'Reportes' }
const itemMap = { recetas: 'Recetas / Fórmulas', ordenes: 'Órdenes de Producción', periodo: 'Producción del Período' }
const iconMap = { recetas: 'mdi-flask-outline', ordenes: 'mdi-clipboard-play-outline', periodo: 'mdi-file-chart-outline' }

const sectionLabel = computed(() => sectionMap[route.params.section] || null)
const itemLabel = computed(() => itemMap[route.params.item] || null)
const pageIcon = computed(() => iconMap[route.params.item] || 'mdi-factory')

const heroStats = [
  { value: '14', label: 'Órdenes activas' },
  { value: '38', label: 'Recetas' },
  { value: '92%', label: 'Eficiencia' },
  { value: '3', label: 'En pausa' },
]
const moduleCards = [
  { title: 'Recetas / Fórmulas', desc: 'Definición de ingredientes y proporciones', icon: 'mdi-flask-outline', count: '38 recetas', path: '/produccion/configuracion/recetas' },
  { title: 'Órdenes de Producción', desc: 'Planificación y ejecución de lotes', icon: 'mdi-clipboard-play-outline', count: '14 activas', path: '/produccion/procesos/ordenes' },
  { title: 'Producción del Período', desc: 'Reporte de rendimiento y costos de producción', icon: 'mdi-file-chart-outline', count: 'Ver reporte', path: '/produccion/reportes/periodo' },
]
const estadoOrdenes = [
  { label: 'PLANIFICADAS', val: '5', pct: 40, color: '#3b82f6' },
  { label: 'EN PROCESO', val: '14', pct: 100, color: '#10b981' },
  { label: 'EN PAUSA', val: '3', pct: 25, color: '#f59e0b' },
  { label: 'COMPLETADAS', val: '28', pct: 75, color: '#8b5cf6' },
  { label: 'CANCELADAS', val: '1', pct: 10, color: '#ef4444' },
]
</script>

<style scoped>
.breadcrumb-bar { display: flex; align-items: center; gap: 6px; }
.bc-root { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: rgba(var(--v-theme-on-surface), 0.4); text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.25); }
.bc-section { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-item { font-size: 11px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }
.module-hero { border-radius: 16px; padding: 28px 32px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px; }
.hero-content { display: flex; align-items: center; gap: 18px; }
.hero-icon-wrap { width: 60px; height: 60px; background: rgba(255,255,255,0.15); border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.hero-title { color: white; font-size: 20px; font-weight: 800; margin: 0; }
.hero-sub { color: rgba(255,255,255,0.7); font-size: 12px; margin-top: 4px; }
.hero-stats { display: flex; gap: 32px; flex-wrap: wrap; }
.hero-stat { display: flex; flex-direction: column; align-items: center; }
.hs-val { color: white; font-size: 22px; font-weight: 800; line-height: 1; }
.hs-lbl { color: rgba(255,255,255,0.6); font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 3px; }
.module-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface), 0.07); cursor: pointer; transition: all 0.2s; }
.module-card:hover { border-color: var(--mc); transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
.mc-icon-wrap { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mc-title { font-size: 13px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); margin: 0; }
.mc-desc { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5); line-height: 1.4; }
.mc-footer { display: flex; align-items: center; justify-content: space-between; }
.mc-count { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.4); }
.section-label { font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: rgba(var(--v-theme-on-surface), 0.4); margin-bottom: 20px; margin-top: 0; }
.status-grid { display: flex; gap: 24px; align-items: flex-end; height: 120px; }
.status-item { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; }
.status-bar { width: 100%; border-radius: 6px 6px 0 0; transition: height 0.5s ease; min-height: 8px; }
.status-val { font-size: 16px; font-weight: 800; line-height: 1; }
.status-lbl { font-size: 9px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface), 0.4); text-align: center; }
.coming-icon { width: 80px; height: 80px; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; }
.coming-title { font-size: 20px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); margin: 0; }
.coming-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin-top: 8px; }
</style>
