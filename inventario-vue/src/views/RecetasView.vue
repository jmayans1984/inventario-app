<template>
  <MainLayout>
    <div class="view-container">
      <div class="breadcrumb-bar mb-5"><span class="bc-root">RECETAS</span></div>
      <v-row class="mb-5" dense>
        <v-col cols="12">
          <div class="module-hero" style="--mc:#f59e0b">
            <div class="hero-content">
              <div class="hero-icon-wrap"><v-icon size="32" color="white">mdi-chef-hat</v-icon></div>
              <div>
                <p class="hero-title">Módulo de Recetas</p>
                <p class="hero-sub">Estandarización y control de costos de recetas de restaurante</p>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
      <v-row dense>
        <v-col cols="12" sm="6" lg="3">
          <v-card elevation="0" rounded="lg" class="module-card" style="--mc:#f59e0b" @click="router.push('/recetas/configuracion/catalogo')">
            <v-card-text class="pa-5">
              <div class="mc-icon-wrap mb-3"><v-icon size="22" color="#f59e0b">mdi-book-open-variant-outline</v-icon></div>
              <p class="mc-title">Catálogo de Recetas</p>
              <p class="mc-desc">Crea y gestiona tus recetas</p>
              <div class="mc-footer mt-3"><span class="mc-count">Ver catálogo</span><v-icon size="14" color="#f59e0b">mdi-arrow-right</v-icon></div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-card elevation="0" rounded="lg" class="module-card" style="--mc:#f59e0b" @click="router.push('/recetas/configuracion/articulos')">
            <v-card-text class="pa-5">
              <div class="mc-icon-wrap mb-3"><v-icon size="22" color="#f59e0b">mdi-food-apple-outline</v-icon></div>
              <p class="mc-title">Artículos e Insumos</p>
              <p class="mc-desc">Gestiona ingredientes y precios</p>
              <div class="mc-footer mt-3"><span class="mc-count">Ver artículos</span><v-icon size="14" color="#f59e0b">mdi-arrow-right</v-icon></div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-card elevation="0" rounded="lg" class="module-card" style="--mc:#f59e0b" @click="router.push('/recetas/procesos/costos')">
            <v-card-text class="pa-5">
              <div class="mc-icon-wrap mb-3"><v-icon size="22" color="#f59e0b">mdi-calculator-variant-outline</v-icon></div>
              <p class="mc-title">Gestión de Costos</p>
              <p class="mc-desc">Recalcula costos de recetas</p>
              <div class="mc-footer mt-3"><span class="mc-count">Ver proceso</span><v-icon size="14" color="#f59e0b">mdi-arrow-right</v-icon></div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-card elevation="0" rounded="lg" class="module-card" style="--mc:#f59e0b" @click="router.push('/recetas/reportes/costos')">
            <v-card-text class="pa-5">
              <div class="mc-icon-wrap mb-3"><v-icon size="22" color="#f59e0b">mdi-file-chart-outline</v-icon></div>
              <p class="mc-title">Reportes</p>
              <p class="mc-desc">Costos y fichas técnicas</p>
              <div class="mc-footer mt-3"><span class="mc-count">Ver reportes</span><v-icon size="14" color="#f59e0b">mdi-arrow-right</v-icon></div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </MainLayout>
</template>

<script setup>
import { useRouter } from 'vue-router'
import MainLayout from '../components/layouts/MainLayout.vue'
const router = useRouter()
</script>

<style scoped>
.view-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
.breadcrumb-bar { display: flex; align-items: center; gap: 6px; }
.bc-root { font-size: 12px; font-weight: 700; color: #f59e0b; text-transform: uppercase; }
.module-hero { background: linear-gradient(135deg,#f59e0b,#d97706); border-radius: 16px; padding: 28px 32px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
.hero-content { display: flex; align-items: center; gap: 16px; }
.hero-icon-wrap { width: 56px; height: 56px; border-radius: 14px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; }
.hero-title { font-size: 20px; font-weight: 800; color: #fff; margin: 0; }
.hero-sub { font-size: 13px; color: rgba(255,255,255,0.8); margin: 2px 0 0; }
.module-card { border: 1px solid rgba(var(--v-theme-on-surface),.07); cursor: pointer; transition: transform .15s,box-shadow .15s; }
.module-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.1) !important; }
.mc-icon-wrap { width: 40px; height: 40px; border-radius: 10px; background: rgba(var(--mc-rgb, 245,158,11),.1); display: flex; align-items: center; justify-content: center; }
.mc-title { font-size: 14px; font-weight: 700; margin: 0 0 2px; }
.mc-desc { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); margin: 0; }
.mc-footer { display: flex; align-items: center; justify-content: space-between; }
.mc-count { font-size: 12px; color: var(--mc,#f59e0b); font-weight: 600; }
</style>
