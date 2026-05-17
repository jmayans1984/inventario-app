<template>
  <MainLayout>

    <!-- Breadcrumb -->
    <div class="breadcrumb-bar mb-5">
      <span class="bc-root">CONTABILIDAD</span>
      <template v-if="sectionLabel">
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-section">{{ sectionLabel }}</span>
      </template>
      <template v-if="itemLabel">
        <v-icon size="12" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-item">{{ itemLabel }}</span>
      </template>
    </div>

    <!-- Hero banner del módulo cuando no hay item seleccionado -->
    <template v-if="!route.params.item && !route.params.section">
      <v-row class="mb-5" dense>
        <v-col cols="12">
          <div class="module-hero" style="--mc: #8b5cf6">
            <div class="hero-content">
              <div class="hero-icon-wrap">
                <v-icon size="32" color="white">mdi-calculator-variant-outline</v-icon>
              </div>
              <div>
                <p class="hero-title">Módulo de Contabilidad</p>
                <p class="hero-sub">Gestión financiera y contable de tu empresa</p>
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

      <!-- Tarjetas de acceso rápido -->
      <v-row dense>
        <v-col v-for="card in moduleCards" :key="card.title" cols="12" sm="6" lg="3">
          <v-card
            elevation="0" rounded="lg" class="module-card"
            :style="{ '--mc': '#8b5cf6' }"
            @click="router.push(card.path)"
          >
            <v-card-text class="pa-5">
              <div class="mc-icon-wrap mb-3">
                <v-icon size="22" color="#8b5cf6">{{ card.icon }}</v-icon>
              </div>
              <p class="mc-title">{{ card.title }}</p>
              <p class="mc-desc">{{ card.desc }}</p>
              <div class="mc-footer mt-3">
                <span class="mc-count">{{ card.count }}</span>
                <v-icon size="14" color="#8b5cf6">mdi-arrow-right</v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Vista de sub-página -->
    <template v-else>
      <v-card elevation="0" rounded="lg">
        <v-card-text class="pa-8 text-center">
          <div class="coming-icon mb-4" style="--mc: #8b5cf6">
            <v-icon size="48" color="#8b5cf6">{{ pageIcon }}</v-icon>
          </div>
          <p class="coming-title">{{ itemLabel || sectionLabel }}</p>
          <p class="coming-sub">Este módulo está en desarrollo. Estará disponible pronto.</p>
          <v-btn class="mt-5" variant="tonal" color="#8b5cf6" @click="router.push('/contabilidad')">
            <v-icon start>mdi-arrow-left</v-icon> Volver a Contabilidad
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

const sectionMap = {
  configuracion: 'Configuración',
  procesos: 'Procesos',
  reportes: 'Reportes',
}
const itemMap = {
  proveedores: 'Proveedores',
  'cuentas-contables': 'Cuentas Contables',
  'cuentas-bancarias': 'Cuentas Bancarias',
  'centros-costos': 'Centros de Costos',
  gastos: 'Gestión de Gastos',
  'estado-resultados': 'Estado de Resultados',
}
const iconMap = {
  proveedores: 'mdi-truck-outline',
  'cuentas-contables': 'mdi-book-outline',
  'cuentas-bancarias': 'mdi-bank-outline',
  'centros-costos': 'mdi-sitemap-outline',
  gastos: 'mdi-receipt-text-outline',
  'estado-resultados': 'mdi-trending-up',
}

const sectionLabel = computed(() => sectionMap[route.params.section] || null)
const itemLabel = computed(() => itemMap[route.params.item] || null)
const pageIcon = computed(() => iconMap[route.params.item] || 'mdi-calculator-variant-outline')

const heroStats = [
  { value: '45', label: 'Proveedores' },
  { value: '$45K', label: 'Gastos del mes' },
  { value: '4', label: 'Cuentas bancarias' },
  { value: '12', label: 'Registros hoy' },
]

const moduleCards = [
  { title: 'Proveedores', desc: 'Gestión de proveedores y datos de contacto', icon: 'mdi-truck-outline', count: '45 registros', path: '/contabilidad/configuracion/proveedores' },
  { title: 'Cuentas Bancarias', desc: 'Administración de cuentas bancarias activas', icon: 'mdi-bank-outline', count: '4 cuentas', path: '/contabilidad/configuracion/cuentas-bancarias' },
  { title: 'Gestión de Gastos', desc: 'Registro y control de gastos del período', icon: 'mdi-receipt-text-outline', count: '12 este mes', path: '/contabilidad/procesos/gastos' },
  { title: 'Estado de Resultados', desc: 'Reporte financiero del período seleccionado', icon: 'mdi-trending-up', count: 'Ver reporte', path: '/contabilidad/reportes/estado-resultados' },
]
</script>

<style scoped>
/* Breadcrumb */
.breadcrumb-bar { display: flex; align-items: center; gap: 6px; }
.bc-root { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: rgba(var(--v-theme-on-surface), 0.4); text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.25); }
.bc-section { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-item { font-size: 11px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }

/* Hero */
.module-hero {
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  border-radius: 16px;
  padding: 28px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
}
.hero-content { display: flex; align-items: center; gap: 18px; }
.hero-icon-wrap {
  width: 60px; height: 60px;
  background: rgba(255,255,255,0.15);
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.hero-title { color: white; font-size: 20px; font-weight: 800; letter-spacing: 0.3px; margin: 0; }
.hero-sub { color: rgba(255,255,255,0.7); font-size: 12px; margin-top: 4px; }
.hero-stats { display: flex; gap: 32px; flex-wrap: wrap; }
.hero-stat { display: flex; flex-direction: column; align-items: center; }
.hs-val { color: white; font-size: 22px; font-weight: 800; line-height: 1; }
.hs-lbl { color: rgba(255,255,255,0.6); font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 3px; }

/* Module cards */
.module-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  cursor: pointer;
  transition: all 0.2s;
}
.module-card:hover {
  border-color: var(--mc);
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important;
}
.mc-icon-wrap {
  width: 42px; height: 42px;
  background: rgba(139,92,246,0.12);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}
.mc-title { font-size: 13px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); margin: 0; }
.mc-desc { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5); margin-top: 4px; line-height: 1.4; }
.mc-footer { display: flex; align-items: center; justify-content: space-between; }
.mc-count { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.4); }

/* Coming soon */
.coming-icon {
  width: 80px; height: 80px;
  background: rgba(139,92,246,0.1);
  border-radius: 20px;
  display: inline-flex; align-items: center; justify-content: center;
}
.coming-title { font-size: 20px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); margin: 0; }
.coming-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin-top: 8px; }
</style>
