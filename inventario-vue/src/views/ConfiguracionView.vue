<template>
  <MainLayout>

    <div class="breadcrumb-bar mb-5">
      <span class="bc-root">CONFIGURACIÓN</span>
    </div>

    <!-- Hero -->
    <v-row class="mb-5" dense>
      <v-col cols="12">
        <div class="config-hero">
          <div class="hero-content">
            <div class="hero-icon-wrap">
              <v-icon size="32" color="white">mdi-tune</v-icon>
            </div>
            <div>
              <p class="hero-title">Configuración del Sistema</p>
              <p class="hero-sub">Parámetros generales, usuarios, permisos y personalización</p>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Secciones de configuración -->
    <v-row dense>
      <v-col v-for="sec in sections" :key="sec.title" cols="12" sm="6" lg="4">
        <v-card elevation="0" rounded="lg" class="config-card" :style="{'--cc': sec.color}">
          <v-card-text class="pa-5">
            <div class="cc-header mb-4">
              <div class="cc-icon" :style="{background: sec.color + '18'}">
                <v-icon size="24" :color="sec.color">{{ sec.icon }}</v-icon>
              </div>
              <div>
                <p class="cc-title">{{ sec.title }}</p>
                <p class="cc-desc">{{ sec.desc }}</p>
              </div>
            </div>
            <div class="cc-items">
              <div class="cc-item" v-for="item in sec.items" :key="item">
                <v-icon size="12" color="rgba(var(--v-theme-on-surface),0.3)">mdi-circle-small</v-icon>
                <span>{{ item }}</span>
              </div>
            </div>
            <v-btn
              class="mt-4" size="small" variant="tonal" :color="sec.color" block
              append-icon="mdi-arrow-right"
            >
              Configurar
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

  </MainLayout>
</template>

<script setup>
import MainLayout from '../components/layouts/MainLayout.vue'

const sections = [
  {
    title: 'Empresa',
    desc: 'Datos generales de la empresa',
    icon: 'mdi-domain',
    color: '#667eea',
    items: ['Razón social y RIF', 'Dirección fiscal', 'Logo e imagen', 'Datos de contacto'],
  },
  {
    title: 'Usuarios y Roles',
    desc: 'Control de acceso al sistema',
    icon: 'mdi-account-key-outline',
    color: '#8b5cf6',
    items: ['Gestión de usuarios', 'Roles y permisos', 'Historial de accesos', 'Políticas de contraseña'],
  },
  {
    title: 'Parámetros Fiscales',
    desc: 'Configuración tributaria',
    icon: 'mdi-file-certificate-outline',
    color: '#22c55e',
    items: ['Tasas de impuesto (IVA)', 'Retenciones', 'Unidad tributaria', 'Tipos de documento'],
  },
  {
    title: 'Monedas y Tasas',
    desc: 'Divisas y tipos de cambio',
    icon: 'mdi-currency-usd',
    color: '#f59e0b',
    items: ['Moneda base', 'Monedas secundarias', 'Tasas de cambio', 'Actualización automática'],
  },
  {
    title: 'Notificaciones',
    desc: 'Alertas y comunicaciones',
    icon: 'mdi-bell-cog-outline',
    color: '#3b82f6',
    items: ['Alertas de stock bajo', 'Vencimiento de pagos', 'Notificaciones por email', 'Resúmenes automáticos'],
  },
  {
    title: 'Respaldos',
    desc: 'Seguridad y recuperación de datos',
    icon: 'mdi-database-cog-outline',
    color: '#ef4444',
    items: ['Backup automático', 'Exportar datos', 'Restaurar respaldo', 'Historial de cambios'],
  },
]
</script>

<style scoped>
.breadcrumb-bar { display: flex; align-items: center; gap: 6px; }
.bc-root { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: rgba(var(--v-theme-on-surface), 0.4); text-transform: uppercase; }

.config-hero {
  border-radius: 16px;
  padding: 28px 32px;
  background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
  border: 1px solid rgba(255,255,255,0.08);
}
.hero-content { display: flex; align-items: center; gap: 18px; }
.hero-icon-wrap { width: 60px; height: 60px; background: rgba(255,255,255,0.12); border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.hero-title { color: white; font-size: 20px; font-weight: 800; margin: 0; }
.hero-sub { color: rgba(255,255,255,0.5); font-size: 12px; margin-top: 4px; }

.config-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  transition: all 0.2s;
}
.config-card:hover {
  border-color: var(--cc);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important;
}
.cc-header { display: flex; align-items: flex-start; gap: 14px; }
.cc-icon { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cc-title { font-size: 14px; font-weight: 800; color: rgb(var(--v-theme-on-surface)); margin: 0; letter-spacing: 0.2px; }
.cc-desc { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.45); margin-top: 3px; }
.cc-items { display: flex; flex-direction: column; gap: 6px; }
.cc-item {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>
