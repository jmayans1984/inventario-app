<template>
  <MainLayout>
    <div class="mod-container">

      <!-- HERO -->
      <div class="mod-hero" style="background: linear-gradient(135deg,#8b5cf6,#6d28d9)">
        <div class="mod-hero-left">
          <div class="mod-hero-icon"><v-icon size="28" color="white">mdi-tune</v-icon></div>
          <div>
            <div class="mod-hero-title">CONFIGURACIÓN</div>
            <div class="mod-hero-sub">Parámetros generales, notificaciones y permisos del sistema</div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN: CONFIGURACIÓN -->
      <div class="mod-section-label">CONFIGURACIÓN</div>
      <div class="mod-grid">
        <div class="mod-card" @click="go('/configuracion/general')">
          <div class="mod-card-icon" style="background:rgba(139,92,246,.12)">
            <v-icon size="22" color="#8b5cf6">mdi-tune</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Configuración General</div>
            <div class="mod-card-desc">Parámetros contables, usuarios y logo de la empresa</div>
          </div>
          <v-icon size="16" color="#8b5cf6" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/configuracion/bodega-maestra')">
          <div class="mod-card-icon" style="background:rgba(139,92,246,.12)">
            <v-icon size="22" color="#8b5cf6">mdi-warehouse</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Bodega Maestra / Proveeduría</div>
            <div class="mod-card-desc">Centro de costos asignado como bodega maestra</div>
          </div>
          <v-icon size="16" color="#8b5cf6" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/configuracion/notificaciones')">
          <div class="mod-card-icon" style="background:rgba(139,92,246,.12)">
            <v-icon size="22" color="#8b5cf6">mdi-bell-cog</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Preferencias de Notificaciones</div>
            <div class="mod-card-desc">Configura alertas y avisos del sistema</div>
          </div>
          <v-icon size="16" color="#8b5cf6" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/configuracion/permisos-clientes')">
          <div class="mod-card-icon" style="background:rgba(139,92,246,.12)">
            <v-icon size="22" color="#8b5cf6">mdi-shield-account-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Permisos por Cliente</div>
            <div class="mod-card-desc">Restringe módulos y rutas por empresa cliente</div>
          </div>
          <v-icon size="16" color="#8b5cf6" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/configuracion/permisos-usuarios')">
          <div class="mod-card-icon" style="background:rgba(139,92,246,.12)">
            <v-icon size="22" color="#8b5cf6">mdi-account-lock-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Permisos de Usuarios</div>
            <div class="mod-card-desc">Restringe módulos por usuario individual</div>
          </div>
          <v-icon size="16" color="#8b5cf6" class="mod-card-arrow">mdi-arrow-right</v-icon>
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
.mod-card:hover { border-color: #8b5cf6; background: rgba(139,92,246,.03); transform: translateX(3px); }
.mod-card-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mod-card-body { flex: 1; min-width: 0; }
.mod-card-title { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
.mod-card-desc { font-size: 11px; color: rgba(var(--v-theme-on-surface),.5); line-height: 1.4; }
.mod-card-arrow { flex-shrink: 0; opacity: .5; transition: opacity .15s; }
.mod-card:hover .mod-card-arrow { opacity: 1; }
</style>
