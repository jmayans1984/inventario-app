<template>
  <MainLayout>
    <div class="mod-container">

      <!-- HERO -->
      <div class="mod-hero" style="background: linear-gradient(135deg,#be185d,#9d174d)">
        <div class="mod-hero-left">
          <div class="mod-hero-icon"><v-icon size="28" color="white">mdi-account-group-outline</v-icon></div>
          <div>
            <div class="mod-hero-title">NÓMINA</div>
            <div class="mod-hero-sub">Gestión de empleados, horarios, liquidaciones y recibos de pago</div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN: CONFIGURACIÓN -->
      <div class="mod-section-label">CONFIGURACIÓN</div>
      <div class="mod-grid">
        <div class="mod-card" @click="go('/nomina/configuracion/empleados')">
          <div class="mod-card-icon" style="background:rgba(236,72,153,.12)">
            <v-icon size="22" color="#ec4899">mdi-account-tie-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Empleados</div>
            <div class="mod-card-desc">Gestiona la plantilla de empleados, W2 y 1099</div>
          </div>
          <v-icon size="16" color="#ec4899" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/nomina/configuracion/cargos')">
          <div class="mod-card-icon" style="background:rgba(236,72,153,.12)">
            <v-icon size="22" color="#ec4899">mdi-briefcase-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Cargos</div>
            <div class="mod-card-desc">Define los cargos y posiciones de la empresa</div>
          </div>
          <v-icon size="16" color="#ec4899" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/nomina/configuracion/fiscal')">
          <div class="mod-card-icon" style="background:rgba(236,72,153,.12)">
            <v-icon size="22" color="#ec4899">mdi-file-cog-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Config. Fiscal</div>
            <div class="mod-card-desc">Parámetros fiscales, tasas de impuestos y cuentas</div>
          </div>
          <v-icon size="16" color="#ec4899" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/nomina/configuracion/horario-config')">
          <div class="mod-card-icon" style="background:rgba(236,72,153,.12)">
            <v-icon size="22" color="#ec4899">mdi-clock-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Config. Horario</div>
            <div class="mod-card-desc">Configuración de tipos de horario y turnos</div>
          </div>
          <v-icon size="16" color="#ec4899" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>
      </div>

      <!-- SECCIÓN: PROCESOS -->
      <div class="mod-section-label">PROCESOS</div>
      <div class="mod-grid">
        <div class="mod-card" @click="go('/nomina/procesos/horario')">
          <div class="mod-card-icon" style="background:rgba(236,72,153,.12)">
            <v-icon size="22" color="#ec4899">mdi-calendar-week-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Horario Semanal</div>
            <div class="mod-card-desc">Registro de horas trabajadas por semana</div>
          </div>
          <v-icon size="16" color="#ec4899" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/nomina/procesos/liquidacion')">
          <div class="mod-card-icon" style="background:rgba(236,72,153,.12)">
            <v-icon size="22" color="#ec4899">mdi-calculator</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Liquidación de Nómina</div>
            <div class="mod-card-desc">Calcula y aprueba nóminas, genera contabilidad</div>
          </div>
          <v-icon size="16" color="#ec4899" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>
      </div>

      <!-- SECCIÓN: REPORTES -->
      <div class="mod-section-label">REPORTES</div>
      <div class="mod-grid">
        <div class="mod-card" @click="go('/nomina/reportes/horario')">
          <div class="mod-card-icon" style="background:rgba(236,72,153,.12)">
            <v-icon size="22" color="#ec4899">mdi-calendar-clock-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Reporte de Horario</div>
            <div class="mod-card-desc">Horas trabajadas por empleado y período</div>
          </div>
          <v-icon size="16" color="#ec4899" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/nomina/reportes/recibos')">
          <div class="mod-card-icon" style="background:rgba(236,72,153,.12)">
            <v-icon size="22" color="#ec4899">mdi-file-document-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Recibos de Pago</div>
            <div class="mod-card-desc">Visualiza e imprime los recibos de nómina</div>
          </div>
          <v-icon size="16" color="#ec4899" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { useRouter } from 'vue-router'
import MainLayout from '../components/layouts/MainLayout.vue'
const router = useRouter()
const go = (path) => router.push(path)
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
.mod-card:hover { border-color: #ec4899; background: rgba(236,72,153,.03); transform: translateX(3px); }
.mod-card-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mod-card-body { flex: 1; min-width: 0; }
.mod-card-title { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
.mod-card-desc { font-size: 11px; color: rgba(var(--v-theme-on-surface),.5); line-height: 1.4; }
.mod-card-arrow { flex-shrink: 0; opacity: .5; transition: opacity .15s; }
.mod-card:hover .mod-card-arrow { opacity: 1; }
</style>
