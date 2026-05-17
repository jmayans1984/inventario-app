<template>
  <MainLayout>

    <div class="breadcrumb-bar mb-5">
      <span class="bc-root">ALMACÉN</span>
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
          <div class="module-hero" style="background:linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%)">
            <div class="hero-content">
              <div class="hero-icon-wrap">
                <v-icon size="32" color="white">mdi-warehouse</v-icon>
              </div>
              <div>
                <p class="hero-title">Módulo de Almacén</p>
                <p class="hero-sub">Control de inventario, órdenes de compra y recepciones</p>
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

      <!-- KPI mini-cards -->
      <v-row dense class="mb-4">
        <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" sm="3">
          <v-card elevation="0" rounded="lg" class="kpi-mini" :style="{'border-top': `3px solid ${kpi.color}`}">
            <v-card-text class="pa-4">
              <div class="d-flex align-center gap-2 mb-1">
                <v-icon size="16" :color="kpi.color">{{ kpi.icon }}</v-icon>
                <span class="kpi-mini-label">{{ kpi.label }}</span>
              </div>
              <p class="kpi-mini-val" :style="{color: kpi.color}">{{ kpi.value }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row dense>
        <v-col v-for="card in moduleCards" :key="card.title" cols="12" sm="6" lg="3">
          <v-card elevation="0" rounded="lg" class="module-card" style="--mc:#3b82f6" @click="router.push(card.path)">
            <v-card-text class="pa-5">
              <div class="mc-icon-wrap mb-3" style="background:rgba(59,130,246,0.12)">
                <v-icon size="22" color="#3b82f6">{{ card.icon }}</v-icon>
              </div>
              <p class="mc-title">{{ card.title }}</p>
              <p class="mc-desc">{{ card.desc }}</p>
              <div class="mc-footer mt-3">
                <span class="mc-count">{{ card.count }}</span>
                <v-icon size="14" color="#3b82f6">mdi-arrow-right</v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

    </template>

    <template v-else>
      <v-card elevation="0" rounded="lg">
        <v-card-text class="pa-8 text-center">
          <div class="coming-icon mb-4" style="background:rgba(59,130,246,0.1)">
            <v-icon size="48" color="#3b82f6">{{ pageIcon }}</v-icon>
          </div>
          <p class="coming-title">{{ itemLabel || sectionLabel }}</p>
          <p class="coming-sub">Este módulo está en desarrollo. Estará disponible pronto.</p>
          <v-btn class="mt-5" variant="tonal" color="#3b82f6" @click="router.push('/almacen')">
            <v-icon start>mdi-arrow-left</v-icon> Volver a Almacén
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
const itemMap = { productos: 'Productos', categorias: 'Categorías', ordenes: 'Órdenes de Compra', recepciones: 'Recepciones', inventario: 'Inventario Actual', movimientos: 'Movimientos' }
const iconMap = { productos: 'mdi-package-variant', categorias: 'mdi-tag-outline', ordenes: 'mdi-clipboard-list-outline', recepciones: 'mdi-truck-delivery-outline', inventario: 'mdi-file-chart-outline', movimientos: 'mdi-swap-horizontal' }

const sectionLabel = computed(() => sectionMap[route.params.section] || null)
const itemLabel = computed(() => itemMap[route.params.item] || null)
const pageIcon = computed(() => iconMap[route.params.item] || 'mdi-warehouse')

const heroStats = [
  { value: '1,250', label: 'Productos' },
  { value: '45', label: 'Bajo stock' },
  { value: '28', label: 'Órdenes abiertas' },
  { value: '7', label: 'Por recibir' },
]
const kpis = [
  { label: 'Total Productos', value: '1,250', icon: 'mdi-package-variant', color: '#3b82f6' },
  { label: 'Bajo Stock', value: '45', icon: 'mdi-alert-outline', color: '#ef4444' },
  { label: 'Órdenes Abiertas', value: '28', icon: 'mdi-clipboard-list-outline', color: '#f59e0b' },
  { label: 'Recepciones Pend.', value: '7', icon: 'mdi-truck-delivery-outline', color: '#22c55e' },
]
const moduleCards = [
  { title: 'Productos', desc: 'Catálogo completo de productos y materias primas', icon: 'mdi-package-variant', count: '1,250 registros', path: '/almacen/configuracion/productos' },
  { title: 'Órdenes de Compra', desc: 'Emisión y seguimiento de órdenes de compra', icon: 'mdi-clipboard-list-outline', count: '28 abiertas', path: '/almacen/procesos/ordenes' },
  { title: 'Recepciones', desc: 'Registro de entradas de mercancía al almacén', icon: 'mdi-truck-delivery-outline', count: '7 pendientes', path: '/almacen/procesos/recepciones' },
  { title: 'Inventario Actual', desc: 'Reporte de existencias y valorización', icon: 'mdi-file-chart-outline', count: 'Ver reporte', path: '/almacen/reportes/inventario' },
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
.kpi-mini { background: rgb(var(--v-theme-surface)); transition: all 0.2s; }
.kpi-mini:hover { transform: translateY(-2px); }
.kpi-mini-label { font-size: 10px; font-weight: 700; letter-spacing: 0.5px; color: rgba(var(--v-theme-on-surface), 0.5); text-transform: uppercase; }
.kpi-mini-val { font-size: 22px; font-weight: 800; margin: 0; line-height: 1; }
.module-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface), 0.07); cursor: pointer; transition: all 0.2s; }
.module-card:hover { border-color: var(--mc); transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
.mc-icon-wrap { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.mc-title { font-size: 13px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); margin: 0; }
.mc-desc { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5); margin-top: 4px; line-height: 1.4; }
.mc-footer { display: flex; align-items: center; justify-content: space-between; }
.mc-count { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.4); }
.coming-icon { width: 80px; height: 80px; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; }
.coming-title { font-size: 20px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); margin: 0; }
.coming-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin-top: 8px; }
</style>
