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
            <p class="notif-sub">Configura qué usuarios recibirán cada tipo de notificación</p>
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
            <div v-for="tipo in tiposNotificaciones" :key="tipo.valor" class="pref-card" :class="{ 'card-activo': tipo.activa === 'SI' }">
              <div class="card-header">
                <v-icon size="24" color="#0891b2">mdi-bell</v-icon>
                <div>
                  <h3 class="card-titulo">{{ tipo.label }}</h3>
                  <p class="card-tipo">{{ tipo.valor }}</p>
                </div>
              </div>

              <p class="card-desc">{{ tipo.descripcion }}</p>

              <!-- TOGGLE ACTIVA/DESACTIVA -->
              <div class="card-toggle">
                <v-switch
                  :model-value="tipo.activa === 'SI'"
                  color="#0891b2"
                  hide-details
                  :loading="guardandoTipo === tipo.valor"
                  @update:model-value="toggleNotificacion(tipo, $event)"
                  label="Activada"
                />
              </div>

              <!-- SELECTOR DE USUARIOS (solo si está activa) -->
              <template v-if="tipo.activa === 'SI'">
                <div class="usuarios-section">
                  <label class="usuarios-label">Usuarios que recibirán estas notificaciones:</label>
                  <v-select
                    :model-value="tipo.usuarios_receptores"
                    :items="usuariosEmpresa"
                    item-title="nombre"
                    item-value="codigo"
                    label="Selecciona usuarios..."
                    multiple
                    chips
                    variant="outlined"
                    density="compact"
                    :loading="guardandoTipo === tipo.valor"
                    @update:model-value="actualizarUsuariosReceptores(tipo, $event)"
                  />
                  <p v-if="tipo.usuarios_receptores.length === 0" class="usuarios-aviso">
                    ⚠️ Sin usuarios seleccionados - esta notificación no será enviada a nadie
                  </p>
                </div>
              </template>
            </div>
          </div>

          <div class="info-box">
            <v-icon size="18" color="#0891b2">mdi-information-outline</v-icon>
            <div>
              <strong>¿Cómo funciona?</strong>
              <p style="margin: 4px 0 0 0; font-size: 12px;">
                1. Activa el tipo de notificación con el toggle<br>
                2. Selecciona qué usuarios recibirán esa notificación<br>
                3. Los cambios se guardan automáticamente
              </p>
            </div>
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
import { ref, onMounted } from 'vue'
import MainLayout from '../components/layouts/MainLayout.vue'
import { notificacionesService } from '../services/notificaciones.service'
import { useAuthStore } from '../stores/auth'
import api from '../services/api'

const authStore = useAuthStore()
const loading = ref(false)
const guardandoTipo = ref(null)
const snack = ref({ show: false, msg: '', color: 'success' })
const tiposNotificaciones = ref([])
const usuariosEmpresa = ref([])

async function cargarDatos() {
  loading.value = true
  try {
    // Cargar preferencias (que incluye tipos de notificaciones del backend)
    const resPrefs = await notificacionesService.obtenerPreferencias()
    tiposNotificaciones.value = resPrefs.data || []

    // Cargar usuarios de la empresa
    const resUsers = await api.get('/configuracion/usuarios', {
      params: { empresa: authStore.empresa }
    })
    usuariosEmpresa.value = resUsers.data.data || []
  } catch (e) {
    console.error('Error cargando datos:', e)
    mostrarSnack('Error al cargar datos', 'error')
  } finally {
    loading.value = false
  }
}

async function toggleNotificacion(tipo, activa) {
  guardandoTipo.value = tipo.valor
  try {
    // Si se desactiva, limpiar usuarios
    const usuariosReceptores = activa ? tipo.usuarios_receptores : []

    await notificacionesService.actualizarPreferencia(
      tipo.valor,
      activa ? 'SI' : 'NO',
      usuariosReceptores
    )

    tipo.activa = activa ? 'SI' : 'NO'
    mostrarSnack(activa ? '✓ Notificación activada' : '✓ Notificación desactivada', 'success')
  } catch (e) {
    console.error('Error toggling notificación:', e)
    mostrarSnack('Error al actualizar', 'error')
  } finally {
    guardandoTipo.value = null
  }
}

async function actualizarUsuariosReceptores(tipo, usuarios) {
  guardandoTipo.value = tipo.valor
  try {
    tipo.usuarios_receptores = usuarios

    await notificacionesService.actualizarPreferencia(
      tipo.valor,
      tipo.activa,
      usuarios
    )

    mostrarSnack(`✓ ${usuarios.length} usuario${usuarios.length !== 1 ? 's' : ''} asignado${usuarios.length !== 1 ? 's' : ''}`, 'success')
  } catch (e) {
    console.error('Error actualizando usuarios:', e)
    mostrarSnack('Error al actualizar usuarios', 'error')
  } finally {
    guardandoTipo.value = null
  }
}

function mostrarSnack(msg, color = 'success') {
  snack.value = { show: true, msg, color }
}

onMounted(cargarDatos)
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
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.pref-card {
  background: rgb(var(--v-theme-surface));
  border: 2px solid rgba(var(--v-theme-on-surface),.08);
  border-radius: 12px;
  padding: 20px;
  transition: all .2s;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pref-card.card-activo {
  border-color: #0891b2;
  background: rgba(8,145,178,.02);
}

.pref-card:hover {
  border-color: rgba(var(--v-theme-on-surface),.15);
  box-shadow: 0 4px 12px rgba(0,0,0,.08);
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.card-titulo {
  font-size: 14px;
  font-weight: 700;
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
}

.card-tipo {
  font-size: 11px;
  color: #0891b2;
  margin: 2px 0 0 0;
  font-family: monospace;
  font-weight: 600;
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
  justify-content: flex-start;
  margin-top: 8px;
}

.usuarios-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(var(--v-theme-on-surface),.1);
}

.usuarios-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .3px;
  color: rgba(var(--v-theme-on-surface),.6);
  margin-bottom: 8px;
}

.usuarios-aviso {
  font-size: 12px;
  color: #f59e0b;
  margin: 8px 0 0 0;
  padding: 8px;
  background: rgba(245,158,11,.08);
  border-radius: 4px;
}

.info-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba(8,145,178,.08);
  border-left: 3px solid #0891b2;
  border-radius: 8px;
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface),.7);
  line-height: 1.5;
}

.info-box strong {
  color: #0891b2;
  display: block;
  margin-bottom: 4px;
}
</style>
