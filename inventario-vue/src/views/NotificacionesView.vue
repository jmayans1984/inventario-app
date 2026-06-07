<template>
  <MainLayout>
    <div class="notif-container">

      <!-- BREADCRUMB -->
      <div class="notif-breadcrumb">
        <span class="bc-root">CONFIGURACIÓN</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Preferencias de Notificaciones</span>
      </div>

      <!-- HEADER -->
      <div class="notif-header">
        <div class="notif-header-left">
          <div class="notif-icon-wrap">
            <v-icon size="22" color="white">mdi-bell-cog</v-icon>
          </div>
          <div>
            <h1 class="notif-title">PREFERENCIAS DE NOTIFICACIONES</h1>
            <p class="notif-sub">Elige qué tipos de notificaciones deseas recibir</p>
          </div>
        </div>
      </div>

      <!-- CONTENIDO -->
      <div class="notif-content">
        <div v-if="loading" class="notif-loading">
          <v-progress-circular indeterminate color="#0891b2" size="36" />
        </div>

        <template v-else>
          <div class="preferencias-grid">
            <div v-for="tipo in tiposNotificaciones" :key="tipo.valor" class="pref-card">
              <div class="card-header">
                <v-icon size="24" :color="obtieneColorTipo(tipo.valor)">{{ tipo.icon }}</v-icon>
                <h3 class="card-titulo">{{ tipo.label }}</h3>
              </div>

              <p class="card-desc">{{ obtieneDescripcion(tipo.valor) }}</p>

              <div class="card-toggle">
                <v-switch
                  :model-value="preferencias[tipo.valor]"
                  color="#0891b2"
                  hide-details
                  :loading="guardandoTipo === tipo.valor"
                  @update:model-value="togglePreferencia(tipo.valor, $event)"
                />
              </div>
            </div>
          </div>

          <div class="info-box">
            <v-icon size="18" color="#0891b2">mdi-information-outline</v-icon>
            <span>
              Las notificaciones desactivadas no serán enviadas a tu usuario, pero otros usuarios de la empresa seguirán recibiendo las suyas según sus propias preferencias.
            </span>
          </div>
        </template>
      </div>

      <!-- SNACKBAR -->
      <v-snackbar v-model="snack.show" :color="snack.color" :timeout="3000" location="bottom right">
        {{ snack.msg }}
      </v-snackbar>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import MainLayout from '../components/layouts/MainLayout.vue'
import { notificacionesService } from '../services/notificaciones.service'

const loading = ref(false)
const guardandoTipo = ref(null)
const snack = ref({ show: false, msg: '', color: 'success' })
const preferencias = reactive({})

const tiposNotificaciones = [
  {
    valor: 'stock_fuera',
    label: '🔴 Stock Fuera',
    icon: 'mdi-alert-circle',
    desc: 'Alerta cuando un producto no tiene stock disponible'
  },
  {
    valor: 'stock_bajo',
    label: '🟡 Stock Bajo',
    icon: 'mdi-alert',
    desc: 'Alerta cuando el stock está por debajo del mínimo configurado'
  },
  {
    valor: 'alerta_general',
    label: '📢 Alertas Generales',
    icon: 'mdi-bell',
    desc: 'Alertas y cambios importantes del sistema'
  },
  {
    valor: 'actualizaciones',
    label: '🔄 Actualizaciones del Sistema',
    icon: 'mdi-refresh',
    desc: 'Notificaciones sobre mantenimiento y nuevas características'
  },
  {
    valor: 'reportes',
    label: '📊 Reportes Completados',
    icon: 'mdi-file-chart',
    desc: 'Notificaciones cuando tus reportes están listos'
  },
]

function obtieneColorTipo(tipo) {
  const colores = {
    'stock_fuera': 'error',
    'stock_bajo': 'warning',
    'alerta_general': 'info',
    'actualizaciones': 'primary',
    'reportes': 'success'
  }
  return colores[tipo] || 'inherit'
}

function obtieneDescripcion(tipo) {
  const tipo_obj = tiposNotificaciones.find(t => t.valor === tipo)
  return tipo_obj?.desc || ''
}

async function cargarPreferencias() {
  loading.value = true
  try {
    const res = await notificacionesService.obtenerPreferencias()

    // Inicializar todas como activas (default)
    tiposNotificaciones.forEach(tipo => {
      preferencias[tipo.valor] = true
    })

    // Actualizar con las preferencias guardadas
    res.data.forEach(pref => {
      preferencias[pref.tipo] = pref.activa === 'SI'
    })
  } catch (e) {
    console.error('Error cargando preferencias:', e)
    mostrarSnack('Error al cargar preferencias', 'error')
  } finally {
    loading.value = false
  }
}

async function togglePreferencia(tipo, valor) {
  guardandoTipo.value = tipo
  try {
    await notificacionesService.actualizarPreferencia(tipo, valor ? 'SI' : 'NO')
    preferencias[tipo] = valor
    mostrarSnack(valor ? `✓ ${tipo} activado` : `✗ ${tipo} desactivado`, 'success')
  } catch (e) {
    console.error('Error actualizando preferencia:', e)
    mostrarSnack('Error al actualizar preferencia', 'error')
    // Revertir cambio
    preferencias[tipo] = !valor
  } finally {
    guardandoTipo.value = null
  }
}

function mostrarSnack(msg, color = 'success') {
  snack.value = { show: true, msg, color }
}

onMounted(cargarPreferencias)
</script>

<style scoped>
.notif-container { padding: 24px; max-width: 1200px; margin: 0 auto; }

.notif-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 12px; font-weight: 700; color: #06b6d4; text-transform: uppercase; letter-spacing: .5px; }
.bc-sep { color: rgba(var(--v-theme-on-surface),.3); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface),.8); font-weight: 500; }

.notif-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.notif-header-left { display: flex; align-items: center; gap: 16px; }
.notif-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#0891b2,#06b6d4); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(8,145,178,.35); flex-shrink: 0; }
.notif-title { font-size: 20px; font-weight: 800; letter-spacing: .5px; margin: 0; }
.notif-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }

.notif-content { min-height: 400px; }
.notif-loading { display: flex; justify-content: center; padding: 100px; }

.preferencias-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.pref-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface),.08);
  border-radius: 12px;
  padding: 20px;
  transition: all .2s;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pref-card:hover {
  border-color: rgba(var(--v-theme-on-surface),.15);
  box-shadow: 0 4px 12px rgba(0,0,0,.08);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-titulo {
  font-size: 14px;
  font-weight: 700;
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
}

.card-desc {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface),.6);
  margin: 0;
  line-height: 1.4;
  flex: 1;
}

.card-toggle {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.info-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(8,145,178,.08);
  border-left: 3px solid #0891b2;
  border-radius: 8px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface),.7);
  line-height: 1.5;
}
</style>
