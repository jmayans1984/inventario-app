<template>
  <MainLayout>

    <div class="breadcrumb-bar mb-5">
      <span class="bc-root">TESORERÍA</span>
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
          <div class="module-hero" style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%)">
            <div class="hero-content">
              <div class="hero-icon-wrap">
                <v-icon size="32" color="white">mdi-bank-outline</v-icon>
              </div>
              <div>
                <p class="hero-title">Módulo de Tesorería</p>
                <p class="hero-sub">Control de flujo de caja y movimientos bancarios</p>
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
        <v-col v-for="card in moduleCards" :key="card.title" cols="12" sm="6" lg="3">
          <v-card elevation="0" rounded="lg" class="module-card" style="--mc:#f59e0b" @click="router.push(card.path)">
            <v-card-text class="pa-5">
              <div class="mc-icon-wrap mb-3" style="background:rgba(245,158,11,0.12)">
                <v-icon size="22" color="#f59e0b">{{ card.icon }}</v-icon>
              </div>
              <p class="mc-title">{{ card.title }}</p>
              <p class="mc-desc">{{ card.desc }}</p>
              <div class="mc-footer mt-3">
                <span class="mc-count">{{ card.count }}</span>
                <v-icon size="14" color="#f59e0b">mdi-arrow-right</v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Tabla de cuentas -->
      <v-row dense>
        <v-col cols="12">
          <v-card elevation="0" rounded="lg">
            <v-card-text class="pa-5">
              <div class="d-flex justify-space-between align-center mb-4">
                <p class="section-label">SALDOS POR CUENTA BANCARIA</p>
                <v-btn variant="text" color="warning" size="x-small" append-icon="mdi-arrow-right" class="font-weight-bold">
                  VER TODAS
                </v-btn>
              </div>
              <v-table density="comfortable" class="data-table">
                <thead>
                  <tr>
                    <th class="th" v-for="h in ['CUENTA', 'BANCO', 'TIPO', 'SALDO', '']" :key="h">{{ h }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="acc in cuentas" :key="acc.numero" class="data-row">
                    <td class="td"><span class="bold-field">{{ acc.numero }}</span></td>
                    <td class="td">{{ acc.banco }}</td>
                    <td class="td"><v-chip size="x-small" :color="acc.color" label variant="tonal" class="font-weight-bold">{{ acc.tipo }}</v-chip></td>
                    <td class="td"><span class="saldo-field">{{ acc.saldo }}</span></td>
                    <td class="td"><v-btn icon="mdi-eye-outline" size="x-small" variant="text" color="primary"></v-btn></td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <template v-else>
      <v-card elevation="0" rounded="lg">
        <v-card-text class="pa-8 text-center">
          <div class="coming-icon mb-4" style="background:rgba(245,158,11,0.1)">
            <v-icon size="48" color="#f59e0b">{{ pageIcon }}</v-icon>
          </div>
          <p class="coming-title">{{ itemLabel || sectionLabel }}</p>
          <p class="coming-sub">Este módulo está en desarrollo. Estará disponible pronto.</p>
          <v-btn class="mt-5" variant="tonal" color="#f59e0b" @click="router.push('/tesoreria')">
            <v-icon start>mdi-arrow-left</v-icon> Volver a Tesorería
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
const itemMap = { movimientos: 'Movimientos', 'estado-cuenta': 'Estado de Cuenta' }
const iconMap = { movimientos: 'mdi-swap-horizontal', 'estado-cuenta': 'mdi-file-chart-outline' }

const sectionLabel = computed(() => sectionMap[route.params.section] || null)
const itemLabel = computed(() => itemMap[route.params.item] || null)
const pageIcon = computed(() => iconMap[route.params.item] || 'mdi-bank-outline')

const heroStats = [
  { value: '$120K', label: 'Saldo total' },
  { value: '8', label: 'Cuentas activas' },
  { value: '34', label: 'Movimientos mes' },
  { value: '$18K', label: 'Egresos mes' },
]
const moduleCards = [
  { title: 'Movimientos', desc: 'Registro de ingresos y egresos bancarios', icon: 'mdi-swap-horizontal', count: '34 este mes', path: '/tesoreria/procesos/movimientos' },
  { title: 'Estado de Cuenta', desc: 'Reporte de saldos por cuenta bancaria', icon: 'mdi-file-chart-outline', count: 'Ver reporte', path: '/tesoreria/reportes/estado-cuenta' },
  { title: 'Configuración', desc: 'Parámetros generales de tesorería', icon: 'mdi-tune', count: 'Configurar', path: '/tesoreria/configuracion' },
  { title: 'Flujo de Caja', desc: 'Proyección de entradas y salidas', icon: 'mdi-finance', count: 'Próximamente', path: '/tesoreria' },
]
const cuentas = [
  { numero: '001-123456', banco: 'Banco Nacional', tipo: 'CORRIENTE', saldo: '$45,200.00', color: 'success' },
  { numero: '002-789012', banco: 'Banco Mercantil', tipo: 'AHORROS', saldo: '$28,500.00', color: 'info' },
  { numero: '003-345678', banco: 'Banesco', tipo: 'CORRIENTE', saldo: '$31,750.00', color: 'success' },
  { numero: '004-901234', banco: 'BOD', tipo: 'AHORROS', saldo: '$14,550.00', color: 'info' },
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
.data-table { background: transparent !important; }
.th { font-size: 10px !important; font-weight: 800 !important; letter-spacing: 1.2px !important; text-transform: uppercase !important; color: rgba(var(--v-theme-on-surface), 0.4) !important; padding: 10px 14px !important; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08) !important; }
.td { font-size: 13px; color: rgb(var(--v-theme-on-surface)); padding: 14px 14px !important; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06) !important; }
.data-row { transition: background 0.15s; }
.data-row:hover td { background: rgba(var(--v-theme-primary), 0.04) !important; }
.data-row:last-child td { border-bottom: none !important; }
.bold-field { font-weight: 700; font-size: 12px; letter-spacing: 0.5px; }
.saldo-field { font-weight: 700; color: #22c55e; }
.coming-icon { width: 80px; height: 80px; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; }
.coming-title { font-size: 20px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); margin: 0; }
.coming-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin-top: 8px; }
</style>
