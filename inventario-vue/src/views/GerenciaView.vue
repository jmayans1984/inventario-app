<template>
  <MainLayout>

    <div class="breadcrumb-bar mb-5">
      <span class="bc-root">GERENCIA</span>
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

      <!-- Hero con gradiente especial -->
      <v-row class="mb-5" dense>
        <v-col cols="12">
          <div class="module-hero">
            <div class="hero-content">
              <div class="hero-icon-wrap">
                <v-icon size="32" color="white">mdi-chart-line</v-icon>
              </div>
              <div>
                <p class="hero-title">Panel de Gerencia</p>
                <p class="hero-sub">Visión ejecutiva • KPIs estratégicos • Análisis de datos</p>
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

      <!-- KPIs ejecutivos -->
      <v-row dense class="mb-4">
        <v-col v-for="kpi in executiveKpis" :key="kpi.title" cols="12" sm="6" xl="3">
          <v-card elevation="0" rounded="lg" class="exec-kpi" :style="{borderTop: `3px solid ${kpi.color}`}">
            <v-card-text class="pa-5">
              <div class="d-flex justify-space-between align-start mb-3">
                <div>
                  <p class="ek-title">{{ kpi.title }}</p>
                  <p class="ek-val" :style="{color: kpi.color}">{{ kpi.value }}</p>
                </div>
                <div class="ek-icon" :style="{background: kpi.color + '18', color: kpi.color}">
                  <v-icon size="20">{{ kpi.icon }}</v-icon>
                </div>
              </div>
              <div class="ek-trend">
                <v-icon size="12" :color="kpi.trend > 0 ? 'success' : 'error'">
                  {{ kpi.trend > 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}
                </v-icon>
                <span :style="{color: kpi.trend > 0 ? '#22c55e' : '#ef4444'}">
                  {{ Math.abs(kpi.trend) }}% vs mes anterior
                </span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Accesos rápidos gerenciales -->
      <v-row dense>
        <v-col v-for="card in moduleCards" :key="card.title" cols="12" sm="6" lg="4">
          <v-card elevation="0" rounded="lg" class="module-card" style="--mc:#667eea" @click="router.push(card.path)">
            <v-card-text class="pa-5">
              <div class="d-flex align-center gap-3 mb-3">
                <div class="mc-icon-wrap" :style="{background: card.color + '18'}">
                  <v-icon size="22" :color="card.color">{{ card.icon }}</v-icon>
                </div>
                <div>
                  <p class="mc-title">{{ card.title }}</p>
                  <p class="mc-desc" style="margin-top:2px">{{ card.desc }}</p>
                </div>
              </div>
              <div class="mc-footer">
                <span class="mc-count">{{ card.count }}</span>
                <v-icon size="14" :color="card.color">mdi-arrow-right</v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

    </template>

    <template v-else>
      <v-card elevation="0" rounded="lg">
        <v-card-text class="pa-8 text-center">
          <div class="coming-icon mb-4" style="background:rgba(102,126,234,0.1)">
            <v-icon size="48" color="#667eea">{{ pageIcon }}</v-icon>
          </div>
          <p class="coming-title">{{ itemLabel || sectionLabel }}</p>
          <p class="coming-sub">Este módulo está en desarrollo. Estará disponible pronto.</p>
          <v-btn class="mt-5" variant="tonal" color="primary" @click="router.push('/gerencia')">
            <v-icon start>mdi-arrow-left</v-icon> Volver a Gerencia
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
const itemMap = { parametros: 'Parámetros', analisis: 'Análisis de Datos', ejecutivo: 'Dashboard Ejecutivo', kpis: 'KPIs' }
const iconMap = { parametros: 'mdi-tune', analisis: 'mdi-magnify-scan', ejecutivo: 'mdi-view-dashboard-outline', kpis: 'mdi-gauge' }

const sectionLabel = computed(() => sectionMap[route.params.section] || null)
const itemLabel = computed(() => itemMap[route.params.item] || null)
const pageIcon = computed(() => iconMap[route.params.item] || 'mdi-chart-line')

const heroStats = [
  { value: '$892K', label: 'Ingresos YTD' },
  { value: '18.4%', label: 'Margen neto' },
  { value: '94%', label: 'Satisfacción' },
  { value: '↑12%', label: 'Crecimiento' },
]
const executiveKpis = [
  { title: 'Ingresos del Mes', value: '$142,500', icon: 'mdi-cash-multiple', color: '#22c55e', trend: 12.4 },
  { title: 'Gastos Operativos', value: '$89,200', icon: 'mdi-trending-down', color: '#ef4444', trend: -3.1 },
  { title: 'Utilidad Bruta', value: '$53,300', icon: 'mdi-chart-line', color: '#667eea', trend: 8.7 },
  { title: 'ROI Período', value: '37.4%', icon: 'mdi-percent', color: '#f59e0b', trend: 5.2 },
]
const moduleCards = [
  { title: 'Dashboard Ejecutivo', desc: 'Resumen gerencial de todos los módulos', icon: 'mdi-view-dashboard-outline', count: 'Ver dashboard', path: '/gerencia/reportes/ejecutivo', color: '#667eea' },
  { title: 'KPIs Estratégicos', desc: 'Indicadores clave de rendimiento', icon: 'mdi-gauge', count: 'Ver KPIs', path: '/gerencia/reportes/kpis', color: '#f59e0b' },
  { title: 'Análisis de Datos', desc: 'Exploración avanzada de datos del negocio', icon: 'mdi-magnify-scan', count: 'Analizar', path: '/gerencia/procesos/analisis', color: '#8b5cf6' },
]
</script>

<style scoped>
.breadcrumb-bar { display: flex; align-items: center; gap: 6px; }
.bc-root { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: rgba(var(--v-theme-on-surface), 0.4); text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.25); }
.bc-section { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-item { font-size: 11px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }
.module-hero {
  border-radius: 16px;
  padding: 28px 32px;
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid rgba(102,126,234,0.3);
  position: relative;
  overflow: hidden;
}
.module-hero::before {
  content: '';
  position: absolute;
  top: -40px; right: -40px;
  width: 160px; height: 160px;
  border-radius: 50%;
  background: rgba(102,126,234,0.15);
}
.hero-content { display: flex; align-items: center; gap: 18px; position: relative; }
.hero-icon-wrap { width: 60px; height: 60px; background: linear-gradient(135deg,#667eea,#764ba2); border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.hero-title { color: white; font-size: 20px; font-weight: 800; margin: 0; }
.hero-sub { color: rgba(255,255,255,0.5); font-size: 12px; margin-top: 4px; }
.hero-stats { display: flex; gap: 32px; flex-wrap: wrap; position: relative; }
.hero-stat { display: flex; flex-direction: column; align-items: center; }
.hs-val { color: white; font-size: 20px; font-weight: 800; line-height: 1; }
.hs-lbl { color: rgba(255,255,255,0.5); font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 3px; }
.exec-kpi { background: rgb(var(--v-theme-surface)); transition: all 0.2s; }
.exec-kpi:hover { transform: translateY(-2px); }
.ek-title { font-size: 10px; font-weight: 800; letter-spacing: 1px; color: rgba(var(--v-theme-on-surface), 0.4); text-transform: uppercase; margin: 0; }
.ek-val { font-size: 26px; font-weight: 800; margin: 4px 0 0; line-height: 1; letter-spacing: -0.5px; }
.ek-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ek-trend { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; }
.module-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface), 0.07); cursor: pointer; transition: all 0.2s; }
.module-card:hover { border-color: var(--mc); transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
.mc-icon-wrap { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mc-title { font-size: 13px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); margin: 0; }
.mc-desc { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5); line-height: 1.4; }
.mc-footer { display: flex; align-items: center; justify-content: space-between; }
.mc-count { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.4); }
.coming-icon { width: 80px; height: 80px; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; }
.coming-title { font-size: 20px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); margin: 0; }
.coming-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin-top: 8px; }
</style>
