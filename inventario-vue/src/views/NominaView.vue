<template>
  <MainLayout>

    <div class="breadcrumb-bar mb-5">
      <span class="bc-root">NÓMINA</span>
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
          <div class="module-hero" style="background:linear-gradient(135deg,#ec4899 0%,#be185d 100%)">
            <div class="hero-content">
              <div class="hero-icon-wrap">
                <v-icon size="32" color="white">mdi-account-group-outline</v-icon>
              </div>
              <div>
                <p class="hero-title">Módulo de Nómina</p>
                <p class="hero-sub">Gestión de personal, sueldos y liquidaciones</p>
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

      <!-- Cards de acceso -->
      <v-row dense class="mb-4">
        <v-col v-for="card in moduleCards" :key="card.title" cols="12" sm="6" lg="3">
          <v-card elevation="0" rounded="lg" class="module-card" style="--mc:#ec4899" @click="router.push(card.path)">
            <v-card-text class="pa-5">
              <div class="mc-icon-wrap mb-3" style="background:rgba(236,72,153,0.12)">
                <v-icon size="22" color="#ec4899">{{ card.icon }}</v-icon>
              </div>
              <p class="mc-title">{{ card.title }}</p>
              <p class="mc-desc">{{ card.desc }}</p>
              <div class="mc-footer mt-3">
                <span class="mc-count">{{ card.count }}</span>
                <v-icon size="14" color="#ec4899">mdi-arrow-right</v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Resumen de empleados -->
      <v-row dense>
        <v-col cols="12" md="8">
          <v-card elevation="0" rounded="lg">
            <v-card-text class="pa-5">
              <p class="section-label">EMPLEADOS POR DEPARTAMENTO</p>
              <div class="dept-list">
                <div class="dept-item" v-for="dept in departamentos" :key="dept.nombre">
                  <div class="dept-info">
                    <span class="dept-nombre">{{ dept.nombre }}</span>
                    <span class="dept-cant">{{ dept.cant }} empleados</span>
                  </div>
                  <div class="dept-bar-wrap">
                    <div class="dept-bar" :style="{width: dept.pct + '%', background: '#ec4899'}"></div>
                  </div>
                  <span class="dept-pct">{{ dept.pct }}%</span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card elevation="0" rounded="lg" class="fill-height">
            <v-card-text class="pa-5">
              <p class="section-label">RESUMEN NÓMINA MES</p>
              <div class="payroll-summary">
                <div class="ps-item" v-for="item in payrollSummary" :key="item.label">
                  <span class="ps-label">{{ item.label }}</span>
                  <span class="ps-val" :style="{color: item.color}">{{ item.value }}</span>
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
          <div class="coming-icon mb-4" style="background:rgba(236,72,153,0.1)">
            <v-icon size="48" color="#ec4899">{{ pageIcon }}</v-icon>
          </div>
          <p class="coming-title">{{ itemLabel || sectionLabel }}</p>
          <p class="coming-sub">Este módulo está en desarrollo. Estará disponible pronto.</p>
          <v-btn class="mt-5" variant="tonal" color="#ec4899" @click="router.push('/nomina')">
            <v-icon start>mdi-arrow-left</v-icon> Volver a Nómina
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
import { formatMoneda, formatEntero } from '../utils/formatters'

const route = useRoute()
const router = useRouter()

const sectionMap = { configuracion: 'Configuración', procesos: 'Procesos', reportes: 'Reportes' }
const itemMap = { empleados: 'Empleados', conceptos: 'Conceptos de Pago', liquidacion: 'Liquidación de Nómina', colilla: 'Colilla de Pago' }
const iconMap = { empleados: 'mdi-account-tie-outline', conceptos: 'mdi-cash-multiple', liquidacion: 'mdi-calculator', colilla: 'mdi-file-document-outline' }

const sectionLabel = computed(() => sectionMap[route.params.section] || null)
const itemLabel = computed(() => itemMap[route.params.item] || null)
const pageIcon = computed(() => iconMap[route.params.item] || 'mdi-account-group-outline')

const heroStats = [
  { value: formatEntero(87),        label: 'Empleados activos' },
  { value: formatMoneda(95100, 0),  label: 'Nómina mensual' },
  { value: formatEntero(5),         label: 'Departamentos' },
  { value: formatEntero(2),         label: 'Liquidaciones pend.' },
]
const moduleCards = [
  { title: 'Empleados',             desc: 'Datos personales, cargos y contratos',             icon: 'mdi-account-tie-outline',   count: `${formatEntero(87)} activos`,    path: '/nomina/configuracion/empleados' },
  { title: 'Conceptos de Pago',     desc: 'Configuración de asignaciones y deducciones',      icon: 'mdi-cash-multiple',          count: 'Configurar',                     path: '/nomina/configuracion/conceptos' },
  { title: 'Liquidación de Nómina', desc: 'Cálculo y procesamiento de nómina',                icon: 'mdi-calculator',             count: `${formatEntero(2)} pendientes`,  path: '/nomina/procesos/liquidacion' },
  { title: 'Colilla de Pago',       desc: 'Comprobantes individuales por empleado',           icon: 'mdi-file-document-outline',  count: 'Ver reporte',                    path: '/nomina/reportes/colilla' },
]
const departamentos = [
  { nombre: 'Producción',    cant: 32, pct: 37 },
  { nombre: 'Ventas',        cant: 18, pct: 21 },
  { nombre: 'Administración', cant: 14, pct: 16 },
  { nombre: 'Logística',     cant: 12, pct: 14 },
  { nombre: 'Tecnología',    cant: 11, pct: 12 },
]
const payrollSummary = [
  { label: 'Salarios base',   value: formatMoneda(72400),  color: 'rgb(var(--v-theme-on-surface))' },
  { label: 'Bonificaciones',  value: formatMoneda(8200),   color: '#22c55e' },
  { label: 'Horas extra',     value: formatMoneda(3100),   color: '#3b82f6' },
  { label: 'Deducciones',     value: '-' + formatMoneda(12600), color: '#ef4444' },
  { label: 'Total neto',      value: formatMoneda(95100),  color: '#ec4899' },
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
.mc-icon-wrap { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.mc-title { font-size: 13px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); margin: 0; }
.mc-desc { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5); margin-top: 4px; line-height: 1.4; }
.mc-footer { display: flex; align-items: center; justify-content: space-between; }
.mc-count { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.4); }
.section-label { font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: rgba(var(--v-theme-on-surface), 0.4); margin-bottom: 16px; margin-top: 0; }
.dept-list { display: flex; flex-direction: column; gap: 14px; }
.dept-item { display: flex; align-items: center; gap: 10px; }
.dept-info { display: flex; flex-direction: column; width: 130px; flex-shrink: 0; }
.dept-nombre { font-size: 12px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }
.dept-cant { font-size: 10px; color: rgba(var(--v-theme-on-surface), 0.4); }
.dept-bar-wrap { flex: 1; height: 6px; background: rgba(var(--v-theme-on-surface), 0.1); border-radius: 3px; overflow: hidden; }
.dept-bar { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
.dept-pct { font-size: 11px; font-weight: 700; color: rgba(var(--v-theme-on-surface), 0.5); width: 30px; text-align: right; }
.payroll-summary { display: flex; flex-direction: column; gap: 12px; }
.ps-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06); }
.ps-item:last-child { border-bottom: none; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12); padding-top: 12px; }
.ps-label { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.6); }
.ps-val { font-size: 13px; font-weight: 800; }
.coming-icon { width: 80px; height: 80px; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; }
.coming-title { font-size: 20px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); margin: 0; }
.coming-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin-top: 8px; }
</style>
