<template>
  <MainLayout>
    <div class="mod-container">

      <!-- HERO -->
      <div class="mod-hero" style="background: linear-gradient(135deg, var(--indigo), color-mix(in srgb, var(--indigo) 60%, black))">
        <div class="mod-hero-left">
          <div class="mod-hero-icon"><v-icon size="28" color="white">mdi-chart-line</v-icon></div>
          <div>
            <div class="mod-hero-title">GERENCIA</div>
            <div class="mod-hero-sub">Análisis y reportes estratégicos</div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN: REPORTES -->
      <div class="mod-section-label">REPORTES</div>
      <div class="mod-grid">
        <div class="mod-card" @click="router.push('/gerencia/reportes/ejecutivo')">
          <div class="mod-card-icon" style="background:var(--indigo-wash)">
            <v-icon size="22" color="primary">mdi-view-dashboard-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Dashboard Franquicias</div>
            <div class="mod-card-desc">Vista estratégica consolidada</div>
          </div>
          <v-icon size="16" color="primary" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="router.push('/gerencia/reportes/analisis-ventas')">
          <div class="mod-card-icon" style="background:var(--indigo-wash)">
            <v-icon size="22" color="primary">mdi-chart-areaspline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Análisis de Ventas</div>
            <div class="mod-card-desc">Tendencias y comparativas de ventas</div>
          </div>
          <v-icon size="16" color="primary" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="router.push('/gerencia/reportes/analisis-nomina')">
          <div class="mod-card-icon" style="background:var(--indigo-wash)">
            <v-icon size="22" color="primary">mdi-account-cash-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Análisis de Nómina</div>
            <div class="mod-card-desc">Costos laborales por período</div>
          </div>
          <v-icon size="16" color="primary" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="router.push('/gerencia/reportes/labor-cost')">
          <div class="mod-card-icon" style="background:var(--indigo-wash)">
            <v-icon size="22" color="primary">mdi-percent-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Labor Cost %</div>
            <div class="mod-card-desc">Porcentaje de costo laboral sobre ventas</div>
          </div>
          <v-icon size="16" color="primary" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="router.push('/gerencia/reportes/consumo-mp')">
          <div class="mod-card-icon" style="background:var(--indigo-wash)">
            <v-icon size="22" color="primary">mdi-food-variant</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Consumo Materia Prima</div>
            <div class="mod-card-desc">Consumo de insumos por período</div>
          </div>
          <v-icon size="16" color="primary" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="router.push('/gerencia/reportes/reviews')">
          <div class="mod-card-icon" style="background:var(--indigo-wash)">
            <v-icon size="22" color="primary">mdi-star-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Puntuación / Reviews</div>
            <div class="mod-card-desc">Calificaciones y reseñas de clientes</div>
          </div>
          <v-icon size="16" color="primary" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { useRouter } from 'vue-router'
import MainLayout from '../components/layouts/MainLayout.vue'
const router = useRouter()
</script>

<style scoped>
.mod-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
.mod-hero { border-radius: 16px; padding: 24px 28px; margin-bottom: 28px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
.mod-hero-left { display: flex; align-items: center; gap: 16px; }
.mod-hero-icon { width: 52px; height: 52px; border-radius: 13px; background: rgba(255,255,255,.18); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mod-hero-title { font-size: 22px; font-weight: 900; color: white; letter-spacing: .5px; }
.mod-hero-sub { font-size: 13px; color: rgba(255,255,255,.7); margin-top: 3px; }
.mod-section-label { font-size: 10px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.35); margin: 20px 0 10px; }
.mod-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; margin-bottom: 4px; }
.mod-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 12px; background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.07); cursor: pointer; transition: all .15s; }
.mod-card:hover { border-color: var(--indigo); background: color-mix(in srgb, var(--indigo) 4%, transparent); transform: translateX(3px); }
.mod-card-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mod-card-body { flex: 1; min-width: 0; }
.mod-card-title { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
.mod-card-desc { font-size: 11px; color: rgba(var(--v-theme-on-surface),.5); line-height: 1.4; }
.mod-card-arrow { flex-shrink: 0; opacity: .5; transition: opacity .15s; }
.mod-card:hover .mod-card-arrow { opacity: 1; }
</style>
