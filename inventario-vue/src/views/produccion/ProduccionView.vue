<template>
  <MainLayout>
    <div class="prod-wrap">
      <!-- HEADER -->
      <div class="prod-header">
        <div class="prod-header-icon"><v-icon size="20" color="white">mdi-factory</v-icon></div>
        <div class="flex-1">
          <h1 class="prod-title">MÓDULO PRODUCCIÓN</h1>
          <p class="prod-sub">Gestión de órdenes, ingredientes, lotes y etiquetas</p>
        </div>
      </div>

      <!-- MENÚ DE SECCIONES -->
      <div class="prod-menu-grid">
        <!-- CONFIGURACIÓN -->
        <div class="prod-menu-card" @click="irA('/produccion/configuracion')">
          <div class="prod-menu-icon">
            <v-icon size="32" color="#8b5cf6">mdi-cog</v-icon>
          </div>
          <div class="prod-menu-content">
            <h3>CONFIGURACIÓN</h3>
            <p>Recetas, artículos y lotes</p>
          </div>
          <v-icon size="18" color="#8b5cf6">mdi-chevron-right</v-icon>
        </div>

        <!-- REPORTES -->
        <div class="prod-menu-card" @click="irA('/produccion/reportes')">
          <div class="prod-menu-icon">
            <v-icon size="32" color="#8b5cf6">mdi-chart-bar</v-icon>
          </div>
          <div class="prod-menu-content">
            <h3>REPORTES</h3>
            <p>Análisis de costos y trazabilidad</p>
          </div>
          <v-icon size="18" color="#8b5cf6">mdi-chevron-right</v-icon>
        </div>
      </div>

      <!-- ESTADÍSTICAS RÁPIDAS -->
      <div class="prod-stats">
        <div class="stat-card">
          <div class="stat-label">ÓRDENES ACTIVAS</div>
          <div class="stat-value">{{ ordenesActivas }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">LOTES ESTE MES</div>
          <div class="stat-value">{{ lotesEsteMes }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">COSTO TOTAL</div>
          <div class="stat-value">${{ costoTotal.toFixed(2) }}</div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { useRouter } from 'vue-router'
import { API_BASE } from '../../utils/constants'

const router = useRouter()
const ordenesActivas = ref(0)
const lotesEsteMes = ref(0)
const costoTotal = ref(0)

function irA(ruta) {
  router.push(ruta)
}

async function cargarEstadisticas() {
  try {
    // Aquí iríamos a cargar datos reales de la API
    // Por ahora son datos de ejemplo
    ordenesActivas.value = 12
    lotesEsteMes.value = 45
    costoTotal.value = 15750.50
  } catch (e) {
    console.error(e)
  }
}

onMounted(cargarEstadisticas)
</script>

<style scoped>
.prod-wrap {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.prod-header {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #6d28d9, #8b5cf6);
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.prod-header-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.prod-title {
  font-size: 24px;
  font-weight: 800;
  color: white;
  margin: 0;
}

.prod-sub {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin: 4px 0 0 0;
}

.flex-1 {
  flex: 1;
}

.prod-menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}

.prod-menu-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.prod-menu-card:hover {
  border-color: #8b5cf6;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
  transform: translateY(-2px);
}

.prod-menu-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  background: rgba(139, 92, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.prod-menu-content {
  flex: 1;
}

.prod-menu-content h3 {
  font-size: 16px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  margin: 0 0 4px 0;
}

.prod-menu-content p {
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 0;
}

.prod-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 14px;
  padding: 18px;
  text-align: center;
  border-left: 4px solid #8b5cf6;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: box-shadow 0.2s, transform 0.2s;
}

.stat-card:hover {
  box-shadow: 0 6px 20px rgba(0,0,0,0.09);
  transform: translateY(-2px);
}

.stat-label {
  font-size: 11px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: #8b5cf6;
}
</style>
